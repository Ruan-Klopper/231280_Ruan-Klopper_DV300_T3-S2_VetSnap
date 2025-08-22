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
import * as ImagePicker from "expo-image-picker";
import AppHeader from "../components/global/AppHeader";

// Auth / User
import { GetCurrentUserData } from "../services/auth/authService";
import { getUserById } from "../services/user/user.service";
import type { AppUser } from "../interfaces/user";

// Chat services
import { markConversationRead } from "../services/chat/conversations.service";
import * as Msg from "../services/chat/messages.service"; // uses: listenToMessages, sendTextMessage, sendImageMessage

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;
const MAX_IMAGE_WIDTH = MAX_BUBBLE_WIDTH - 52;
const FALLBACK_IMG_H = Math.round(MAX_IMAGE_WIDTH * 0.75);

type ChatRouteParams = {
  conversationId: string;
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
};
type ChatRoute = RouteProp<{ Chat: ChatRouteParams }, "Chat">;

type MessageDoc = {
  id: string;
  text?: string | null;
  imageUrl?: string | null;
  senderId: string;
  status?: "sent" | "delivered" | "read" | "uploading";
  createdAt: any;
};

type UiMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  imageW?: number;
  imageH?: number;
  fromMe: boolean;
  timeLabel: string;
  uploading?: boolean; // derived from status
};

const normalizeDate = (val: any): Date => {
  try {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === "number") return new Date(val < 1e12 ? val * 1000 : val);
    if (typeof val === "object") {
      if (typeof val.toDate === "function") return val.toDate();
      if (typeof val.toMillis === "function") return new Date(val.toMillis());
      if (typeof val.seconds === "number") return new Date(val.seconds * 1000);
    }
    if (typeof val === "string") return new Date(val);
  } catch {}
  return new Date();
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const isLikelyUrl = (v?: string | null) => !!v && /^https?:\/\/\S+/i.test(v);

const scaleImage = (w: number, h: number) => {
  if (!w || !h) return { w: MAX_IMAGE_WIDTH, h: FALLBACK_IMG_H };
  const ratio = w / h;
  const targetW = Math.min(w, MAX_IMAGE_WIDTH);
  return { w: targetW, h: Math.max(1, Math.round(targetW / ratio)) };
};

/** If the backend ever (incorrectly) puts a URL in text, hide it when imageUrl exists */
const sanitizeText = (text?: string | null, imageUrl?: string | null) => {
  if (!text) return undefined;
  if (!imageUrl) return text;
  if (text === imageUrl) return undefined;
  if (isLikelyUrl(text)) return undefined;
  return text;
};

const Bubble: React.FC<{ msg: UiMessage }> = ({ msg }) => {
  const { fromMe, text, timeLabel, imageUrl, imageW, imageH, uploading } = msg;
  const finalW = imageUrl ? imageW || MAX_IMAGE_WIDTH : 0;
  const finalH = imageUrl ? imageH || FALLBACK_IMG_H : 0;

  return (
    <View
      style={[styles.bubbleRow, fromMe ? styles.alignRight : styles.alignLeft]}
    >
      <View
        style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleOther]}
      >
        {!!imageUrl && (
          <View style={{ position: "relative", marginBottom: text ? 8 : 0 }}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: finalW,
                height: finalH,
                borderRadius: 12,
                backgroundColor: "#eee",
              }}
            />
            {uploading && (
              <View style={styles.overlay}>
                <ActivityIndicator />
              </View>
            )}
          </View>
        )}
        {!!text && <Text style={styles.bubbleText}>{text}</Text>}
        <Text style={styles.bubbleMeta}>
          {timeLabel}
          {uploading ? " • Uploading…" : ""}
        </Text>
      </View>
    </View>
  );
};

const Chat: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ChatRoute>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<UiMessage>>(null);

  const { conversationId, otherUserId, otherUserName, otherUserAvatar } =
    route.params;

  const [me, setMe] = useState<AppUser | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  const [headerUser, setHeaderUser] = useState<{
    name: string;
    avatar?: string | null;
  }>({
    name: otherUserName || "Chat",
    avatar: otherUserAvatar ?? null,
  });
  const [headerHeight, setHeaderHeight] = useState(0);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);

  // bootstrap me
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

  // header peer info
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

  // mark read
  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  // subscribe to messages (single source of truth, no local optimistic needed)
  useEffect(() => {
    if (!conversationId || !me) return;
    let unsub: null | (() => void) = null;

    const res = (Msg as any).listenToMessages(
      conversationId,
      async (docs: MessageDoc[]) => {
        // Map to UI; keep patient behavior for images
        const mapped = await Promise.all(
          docs.map(async (m) => {
            const d = normalizeDate(m.createdAt);
            const safeText = sanitizeText(m.text, m.imageUrl);

            let imageW: number | undefined;
            let imageH: number | undefined;

            if (m.imageUrl) {
              try {
                const dims = await new Promise<{ w: number; h: number }>(
                  (resolve, reject) =>
                    Image.getSize(
                      m.imageUrl!,
                      (w, h) => resolve({ w, h }),
                      // fallback dimensions if remote HEAD fails
                      () => resolve({ w: MAX_IMAGE_WIDTH, h: FALLBACK_IMG_H })
                    )
                );
                const s = scaleImage(dims.w, dims.h);
                imageW = s.w;
                imageH = s.h;
              } catch {
                imageW = MAX_IMAGE_WIDTH;
                imageH = FALLBACK_IMG_H;
              }
            }

            return {
              id: m.id,
              text: safeText,
              imageUrl: m.imageUrl ?? undefined,
              imageW,
              imageH,
              fromMe: m.senderId === me.userId,
              timeLabel: formatTime(d),
              uploading: m.status === "uploading" && !m.imageUrl,
              _ts: d.getTime(),
            } as UiMessage & { _ts: number };
          })
        );

        mapped.sort((a, b) => b._ts - a._ts);
        setMessages(mapped.map(({ _ts, ...u }) => u));
      }
    );

    if (res?.success && typeof res.data === "function") unsub = res.data;
    return () => {
      if (unsub) unsub();
    };
  }, [conversationId, me]);

  // auto-scroll to latest (top because list is inverted)
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

  // send text (strictly text → never put URL in text)
  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversationId || !me) return;
    setSending(true);
    Keyboard.dismiss();
    try {
      const res = await (Msg as any).sendTextMessage(
        conversationId,
        me.userId,
        text
      );
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
  }, [conversationId, input, me]);

  // permissions
  const ensureMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Allow photo library access to send images."
      );
      return false;
    }
    return true;
  };
  const ensureCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow camera access to take photos.");
      return false;
    }
    return true;
  };

  // choose & send image (patient flow delegated to service)
  const pickAndSend = useCallback(
    async (mode: "library" | "camera") => {
      if (!conversationId || !me) return;
      if (mode === "library" && !(await ensureMediaPermission())) return;
      if (mode === "camera" && !(await ensureCameraPermission())) return;

      try {
        const result =
          mode === "library"
            ? await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.9,
                exif: false,
              })
            : await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.9,
              });

        if (result.canceled) return;

        const asset = result.assets?.[0];
        const localUri = asset?.uri;
        if (!localUri) return;

        setSendingImage(true);

        // This is key: the service will
        // 1) create a message with status: "uploading"
        // 2) upload the blob
        // 3) patch message with imageUrl + status: "sent"
        const send = await (Msg as any).sendImageMessage(
          conversationId,
          me.userId,
          localUri,
          "image/jpeg"
        );

        if (!send?.success) {
          throw new Error(send?.message || "Failed to send image");
        }
        // No optimistic management needed; the live listener will render the "uploading" bubble immediately.
      } catch (e: any) {
        Alert.alert("Image", e?.message || "Failed to send image");
      } finally {
        setSendingImage(false);
      }
    },
    [conversationId, me]
  );

  const renderItem = useCallback(
    ({ item }: { item: UiMessage }) => <Bubble msg={item} />,
    []
  );

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

        {/* Input bar */}
        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(8, insets.bottom) },
          ]}
        >
          <Pressable
            style={styles.circleBtn}
            onPress={() => pickAndSend("library")}
            disabled={sendingImage}
          >
            {sendingImage ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="image-outline" size={22} color="#111" />
            )}
          </Pressable>

          <Pressable
            style={styles.circleBtn}
            onPress={() => pickAndSend("camera")}
            disabled={sendingImage}
          >
            <Ionicons name="camera-outline" size={22} color="#111" />
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
              blurOnSubmit={false}
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

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },

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
