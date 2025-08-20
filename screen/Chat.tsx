/* /screens/Chat.tsx */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Keyboard,
  Image,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import AppHeader from "../components/global/AppHeader";

// ─── Auth / User ───────────────────────────────────────────────────────────────
import { GetCurrentUserData } from "../services/auth/authService";
import { getUserById } from "../services/user/user.service";
import type { AppUser } from "../interfaces/user";

// ─── Chat services (adjust names if needed) ───────────────────────────────────
import { markConversationRead } from "../services/chat/conversations.service";
import {
  listenToMessages, // (conversationId, cb: (MessageDoc[]) => void) -> { success, data: () => void }
  sendTextMessage, // (conversationId, text) -> Promise<{success:boolean, message?:string}>
  sendImageMessage, // (conversationId, imageUrl, width?, height?) -> Promise<...>
} from "../services/chat/messages.service";
import {
  uploadChatImage, // (conversationId, localUri) -> Promise<{success:boolean, url:string}>
} from "../services/chat/storage.service";

// ─── Layout constants ─────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;
const MAX_IMAGE_WIDTH = MAX_BUBBLE_WIDTH - 32;

// ─── Route types ──────────────────────────────────────────────────────────────
type ChatRouteParams = {
  conversationId: string;
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
};
type ChatRoute = RouteProp<{ Chat: ChatRouteParams }, "Chat">;

// ─── Backend message shape (adjust to your messages.service) ──────────────────
type MessageDoc = {
  id: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  createdAt: number | Date; // Firestore Timestamp -> convert to ms/Date in service or here
};

// ─── UI message shape ─────────────────────────────────────────────────────────
type UiMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  imageW?: number;
  imageH?: number;
  fromMe: boolean;
  timeLabel: string; // "HH:mm"
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (d: Date | number) => {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// scale image within bubble constraints
const scaleImage = (w: number, h: number) => {
  if (!w || !h) return { w: 0, h: 0 };
  const ratio = w / h;
  const targetW = Math.min(w, MAX_IMAGE_WIDTH);
  const targetH = targetW / ratio;
  return { w: targetW, h: targetH };
};

// ─── Message bubble ───────────────────────────────────────────────────────────
const Bubble: React.FC<{ msg: UiMessage }> = ({ msg }) => {
  const { fromMe, text, timeLabel, imageUrl, imageW, imageH } = msg;
  return (
    <View
      style={[styles.bubbleRow, fromMe ? styles.alignRight : styles.alignLeft]}
    >
      <View
        style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleOther]}
      >
        {!!imageUrl && !!imageW && !!imageH && (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: imageW,
              height: imageH,
              borderRadius: 12,
              marginBottom: text ? 8 : 0,
            }}
          />
        )}
        {!!text && <Text style={styles.bubbleText}>{text}</Text>}
        <Text style={styles.bubbleMeta}>{timeLabel}</Text>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const Chat: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ChatRoute>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<UiMessage>>(null);

  const { conversationId, otherUserId, otherUserName, otherUserAvatar } =
    route.params;

  // me
  const [me, setMe] = useState<AppUser | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  // header
  const [headerUser, setHeaderUser] = useState<{
    name: string;
    avatar?: string | null;
  }>({
    name: otherUserName || "Chat",
    avatar: otherUserAvatar ?? null,
  });
  const [headerHeight, setHeaderHeight] = useState(0);

  // messages
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");

  // ── Bootstrap: get me ───────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await GetCurrentUserData();
      if (!alive) return;
      if (!res.success || !res.data) {
        Alert.alert("Auth", res.message || "Failed to load user");
        setBootLoading(false);
        return;
      }
      setMe(res.data);
      setBootLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── Load peer profile if needed ─────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      if (otherUserId && (!otherUserName || !otherUserAvatar)) {
        const res = await getUserById(otherUserId);
        if (alive && res.success && res.data) {
          setHeaderUser({ name: res.data.fullName, avatar: res.data.photoURL });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [otherUserId, otherUserName, otherUserAvatar]);

  // ── Mark read on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    // fire-and-forget; no await
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  // ── Subscribe to messages ───────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !me) return;
    let unsub: null | (() => void) = null;

    const res = listenToMessages(conversationId, async (docs: MessageDoc[]) => {
      // Map backend docs -> UI messages
      // Note: If your service already returns ms timestamps, keep as-is.
      const ui = await Promise.all(
        docs.map(async (m) => {
          const created =
            m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt);
          let imageW: number | undefined;
          let imageH: number | undefined;

          if (m.imageUrl) {
            try {
              const { w, h } = await new Promise<{ w: number; h: number }>(
                (resolve, reject) =>
                  Image.getSize(
                    m.imageUrl!,
                    (w, h) => resolve({ w, h }),
                    reject
                  )
              );
              const s = scaleImage(w, h);
              imageW = s.w;
              imageH = s.h;
            } catch {
              // ignore broken images
            }
          }

          return {
            id: m.id,
            text: m.text,
            imageUrl: m.imageUrl,
            imageW,
            imageH,
            fromMe: m.senderId === me.userId,
            timeLabel: formatTime(created),
          } as UiMessage;
        })
      );

      // We want newest at bottom visually -> use FlatList inverted with ascending array
      // If your service returns ascending, fine; if descending, reverse here.
      setMessages(ui);
    });

    if (res?.success && typeof res.data === "function") {
      unsub = res.data;
    }

    return () => {
      if (unsub) unsub();
    };
  }, [conversationId, me]);

  // ── Auto-scroll to latest when messages change ──────────────────────────────
  useEffect(() => {
    // With inverted list, offset 0 = bottom (newest)
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

  // ── Send text message ───────────────────────────────────────────────────────
  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversationId) return;
    setSending(true);
    Keyboard.dismiss();
    try {
      const res = await sendTextMessage(conversationId, text);
      if (!res?.success) {
        Alert.alert("Chat", res?.message || "Failed to send message");
      } else {
        setInput("");
      }
    } catch (e: any) {
      Alert.alert("Chat", e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }, [conversationId, input]);

  // ── Send image (hook up your picker) ────────────────────────────────────────
  const onPickAndSendImage = useCallback(async () => {
    if (!conversationId) return;

    try {
      // TODO: Integrate your picker (e.g., expo-image-picker) to get localUri
      // const result = await ImagePicker.launchImageLibraryAsync({ ... });
      // if (result.canceled) return;
      // const localUri = result.assets[0].uri;

      Alert.alert(
        "Media",
        "Hook up your picker and call uploadChatImage(localUri)."
      );
      return;

      // Example flow after you have localUri:
      // const up = await uploadChatImage(conversationId, localUri);
      // if (!up.success) throw new Error("Upload failed");
      // let w = 0, h = 0;
      // try {
      //   const dim = await new Promise<{ w: number; h: number }>((resolve, reject) =>
      //     Image.getSize(up.url, (w, h) => resolve({ w, h }), reject)
      //   );
      //   w = dim.w; h = dim.h;
      // } catch {}
      // await sendImageMessage(conversationId, up.url, w, h);
    } catch (e: any) {
      Alert.alert("Image", e?.message || "Failed to send image");
    }
  }, [conversationId]);

  // ── Render items ────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: UiMessage }) => {
    return <Bubble msg={item} />;
  }, []);

  // ── Loading guard ───────────────────────────────────────────────────────────
  if (bootLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={[styles.flex, styles.center]}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <AppHeader
          variant={4}
          recipientAvatarUrl={
            headerUser.avatar ??
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
          }
          userName={headerUser.name}
          isOnline
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={insets.top + headerHeight}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContent}
          inverted
          keyboardShouldPersistTaps="handled"
        />

        {/* ── Input bar ── */}
        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(8, insets.bottom) },
          ]}
        >
          <Pressable style={styles.circleBtn} onPress={onPickAndSendImage}>
            <Ionicons name="image-outline" size={22} color="#111" />
          </Pressable>

          <View style={styles.textPill}>
            <TextInput
              style={styles.textInput}
              placeholder="Type message"
              placeholderTextColor="#A6CE39"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={onSend}
              returnKeyType="send"
              editable={!sending}
            />
          </View>

          <Pressable
            onPress={onSend}
            style={styles.circleBtn}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="send" size={22} color="#111" />
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.circleBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f4ef" },
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },

  chatContent: {
    paddingHorizontal: 16,
    paddingBottom: 112,
    gap: 12,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  // bubbles
  bubbleRow: { maxWidth: "75%" },
  alignLeft: { alignSelf: "flex-start" },
  alignRight: { alignSelf: "flex-end" },
  bubble: { borderRadius: 20, padding: 12 },
  bubbleMe: { backgroundColor: "#DCF8C6" },
  bubbleOther: { backgroundColor: "#E5E5EA" },
  bubbleText: { fontSize: 16, color: "#111" },
  bubbleMeta: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  // input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 6,
    gap: 6,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textPill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: "center",
  },
  textInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
