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
import * as FileSystem from "expo-file-system";
import AppHeader from "../components/global/AppHeader";

// Auth / User
import { GetCurrentUserData } from "../services/auth/authService";
import { getUserById } from "../services/user/user.service";
import type { AppUser } from "../interfaces/user";

// Chat services
import { markConversationRead } from "../services/chat/conversations.service";
import * as Msg from "../services/chat/messages.service"; // keep flexible
import { uploadChatImage } from "../services/chat/storage.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;
const MAX_IMAGE_WIDTH = MAX_BUBBLE_WIDTH - 32;
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
  text?: string;
  imageUrl?: string;
  senderId: string;
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
  pending?: boolean;
  error?: boolean;
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

const scaleImage = (w: number, h: number) => {
  if (!w || !h) return { w: 0, h: 0 };
  const ratio = w / h;
  const targetW = Math.min(w, MAX_IMAGE_WIDTH);
  return { w: targetW, h: targetW / ratio };
};

// put near your helpers
const isLikelyUrl = (v?: string) => !!v && /^https?:\/\/\S+/i.test(v);

// Upgrade text URL → image (covers signed Firebase/S3/CDNs)
const coerceImageFromText = (m: MessageDoc) => {
  if (m.imageUrl || !m.text) return m;
  const t = m.text.trim();
  let isUrl = false;
  try {
    const u = new URL(t);
    isUrl = u.protocol === "http:" || u.protocol === "https:";
  } catch {
    isUrl = false;
  }
  if (!isUrl) return m;

  const hasExt = /\.(png|jpe?g|webp|gif|bmp|heic|heif)(\?.*)?$/i.test(t);
  const looksLikeCloud =
    /firebasestorage\.googleapis\.com|googleusercontent\.com|amazonaws\.com|cloudfront\.net|supabase\.co/i.test(
      t
    ) || /(?:^|[?&])alt=media\b|(?:^|[?&])token=|X-Amz-Signature/i.test(t);

  return hasExt || looksLikeCloud
    ? { ...m, imageUrl: t, text: undefined as any }
    : m;
};

const Bubble: React.FC<{ msg: UiMessage }> = ({ msg }) => {
  const { fromMe, text, timeLabel, imageUrl, imageW, imageH, pending, error } =
    msg;
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
              style={{ width: finalW, height: finalH, borderRadius: 12 }}
              onError={() => {}}
            />
            {(pending || !imageW || !imageH) && (
              <View style={styles.overlay}>
                <ActivityIndicator />
              </View>
            )}
            {error && (
              <View
                style={[
                  styles.overlay,
                  { backgroundColor: "rgba(220,53,69,0.15)" },
                ]}
              >
                <Ionicons name="alert-circle" size={20} color="#DC3545" />
                <Text style={{ marginTop: 6, color: "#DC3545" }}>Failed</Text>
              </View>
            )}
          </View>
        )}
        {!!text && <Text style={styles.bubbleText}>{text}</Text>}
        <Text style={styles.bubbleMeta}>
          {timeLabel}
          {pending && " • Sending"}
          {error && " • Error"}
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
  const [optimistic, setOptimistic] = useState<UiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [input, setInput] = useState("");

  const listData = useMemo(
    () => [...messages, ...optimistic],
    [messages, optimistic]
  );

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

  // peer header
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

  // subscribe to messages
  useEffect(() => {
    if (!conversationId || !me) return;
    let unsub: null | (() => void) = null;

    const res = (Msg as any).listenToMessages(
      conversationId,
      async (docs: MessageDoc[]) => {
        const mapped = await Promise.all(
          docs.map(async (_m) => {
            const m = coerceImageFromText(_m); // keep as a safety net
            const d = normalizeDate(m.createdAt);

            // ⚠️ strip url-ish text when imageUrl is present, or when text equals the image url
            const textIsUrl = isLikelyUrl(m.text);
            const safeText =
              m.imageUrl && (textIsUrl || m.text === m.imageUrl)
                ? undefined
                : m.text;

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
              } catch {}
            }

            return {
              id: m.id,
              text: safeText, // ← use sanitized text
              imageUrl: m.imageUrl,
              imageW,
              imageH,
              fromMe: m.senderId === me.userId,
              timeLabel: formatTime(d),
              _ts: d.getTime(),
            } as UiMessage & { _ts: number };
          })
        );

        mapped.sort((a, b) => a._ts - b._ts); // ascending for inverted list
        setMessages(mapped.map(({ _ts, ...u }) => u));
        if (optimistic.length) setOptimistic([]);
      }
    );

    if (res?.success && typeof res.data === "function") unsub = res.data;
    return () => {
      if (unsub) unsub();
    };
  }, [conversationId, me, optimistic.length]);

  // auto-scroll
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [listData]);

  // send text
  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversationId) return;
    setSending(true);
    Keyboard.dismiss();
    try {
      const res = await (Msg as any).sendTextMessage(conversationId, text);
      if (!res?.success)
        Alert.alert("Chat", res?.message || "Failed to send message");
      else setInput("");
    } catch (e: any) {
      Alert.alert("Chat", e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }, [conversationId, input]);

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

  // —— Upload (Blob first, then base64) ————————————————————————————————
  const guessMimeFromName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
    return "image/jpeg";
  };

  const uploadAsset = async (localUri: string) => {
    const nameGuess =
      localUri.split("/").pop()?.split("?")[0] || `photo_${Date.now()}.jpg`;
    const mime = guessMimeFromName(nameGuess);

    // 1) Blob path
    try {
      const resp = await fetch(localUri);
      const blob = await resp.blob();
      const up = await (uploadChatImage as any)(
        conversationId,
        blob as any,
        nameGuess
      );
      if (
        up?.success &&
        typeof up.data === "string" &&
        /^https?:\/\//i.test(up.data)
      ) {
        return up.data as string;
      }
    } catch {}

    // 2) Base64 raw
    const b64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    try {
      const up2 = await (uploadChatImage as any)(
        conversationId,
        b64 as any,
        nameGuess
      );
      if (
        up2?.success &&
        typeof up2.data === "string" &&
        /^https?:\/\//i.test(up2.data)
      ) {
        return up2.data as string;
      }
    } catch {}

    // 3) Base64 data URL
    const dataUrl = `data:${mime};base64,${b64}`;
    const up3 = await (uploadChatImage as any)(
      conversationId,
      dataUrl as any,
      nameGuess
    );
    if (
      !up3?.success ||
      typeof up3.data !== "string" ||
      !/^https?:\/\//i.test(up3.data)
    ) {
      throw new Error(up3?.message || "Upload failed (no valid download URL)");
    }
    return up3.data as string;
  };

  // try to send image; fallback to text URL if needed
  const sendImageViaService = async (url: string, w?: number, h?: number) => {
    const anyMsg = Msg as any;
    if (typeof anyMsg.sendImageMessage === "function")
      return anyMsg.sendImageMessage(conversationId, url, w, h);
    if (typeof anyMsg.sendMessage === "function")
      return anyMsg.sendMessage(conversationId, {
        imageUrl: url,
        imageW: w,
        imageH: h,
      });
    if (typeof anyMsg.createMessage === "function")
      return anyMsg.createMessage(conversationId, {
        imageUrl: url,
        imageW: w,
        imageH: h,
      });
    if (typeof anyMsg.addMessage === "function")
      return anyMsg.addMessage(conversationId, {
        imageUrl: url,
        imageW: w,
        imageH: h,
      });
    if (typeof anyMsg.sendMediaMessage === "function")
      return anyMsg.sendMediaMessage(conversationId, {
        type: "image",
        url,
        width: w,
        height: h,
      });
    if (typeof anyMsg.sendTextMessage === "function")
      return anyMsg.sendTextMessage(conversationId, url);
    return {
      success: false,
      message: "No image send function found in messages.service.",
    };
  };

  const makeOptimistic = (localUri: string, w?: number, h?: number) => {
    const tempId = `local-${Date.now()}`;
    setOptimistic((prev) => [
      ...prev,
      {
        id: tempId,
        imageUrl: localUri,
        imageW: w || MAX_IMAGE_WIDTH,
        imageH: h || FALLBACK_IMG_H,
        fromMe: true,
        timeLabel: formatTime(new Date()),
        pending: true,
      },
    ]);
    return tempId;
  };

  // pick & send
  const onPickAndSendImage = useCallback(async () => {
    if (!conversationId) return;
    if (!(await ensureMediaPermission())) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        exif: false,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      const localUri = asset?.uri;
      if (!localUri) return;

      const scaled =
        asset?.width && asset?.height
          ? scaleImage(asset.width, asset.height)
          : { w: MAX_IMAGE_WIDTH, h: FALLBACK_IMG_H };
      const tempId = makeOptimistic(localUri, scaled.w, scaled.h);
      setSendingImage(true);

      const remoteUrl = await uploadAsset(localUri);

      let w = asset?.width || 0,
        h = asset?.height || 0;
      if (!w || !h) {
        try {
          const dim = await new Promise<{ w: number; h: number }>(
            (resolve, reject) =>
              Image.getSize(remoteUrl, (w, h) => resolve({ w, h }), reject)
          );
          w = dim.w;
          h = dim.h;
        } catch {}
      }

      const send = await sendImageViaService(remoteUrl, w, h);
      if (!send?.success) {
        setOptimistic((p) =>
          p.map((m) =>
            m.id === tempId ? { ...m, pending: false, error: true } : m
          )
        );
        throw new Error(send?.message || "Failed to send image");
      }
      setOptimistic((p) => p.filter((m) => m.id !== tempId));
    } catch (e: any) {
      Alert.alert("Image", e?.message || "Failed to send image");
    } finally {
      setSendingImage(false);
    }
  }, [conversationId]);

  // capture & send
  const onCaptureAndSendImage = useCallback(async () => {
    if (!conversationId) return;
    if (!(await ensureCameraPermission())) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      const localUri = asset?.uri;
      if (!localUri) return;

      const scaled =
        asset?.width && asset?.height
          ? scaleImage(asset.width, asset.height)
          : { w: MAX_IMAGE_WIDTH, h: FALLBACK_IMG_H };
      const tempId = makeOptimistic(localUri, scaled.w, scaled.h);
      setSendingImage(true);

      const remoteUrl = await uploadAsset(localUri);

      let w = asset?.width || 0,
        h = asset?.height || 0;
      if (!w || !h) {
        try {
          const dim = await new Promise<{ w: number; h: number }>(
            (resolve, reject) =>
              Image.getSize(remoteUrl, (w, h) => resolve({ w, h }), reject)
          );
          w = dim.w;
          h = dim.h;
        } catch {}
      }

      const send = await sendImageViaService(remoteUrl, w, h);
      if (!send?.success) {
        setOptimistic((p) =>
          p.map((m) =>
            m.id === tempId ? { ...m, pending: false, error: true } : m
          )
        );
        throw new Error(send?.message || "Failed to send image");
      }
      setOptimistic((p) => p.filter((m) => m.id !== tempId));
    } catch (e: any) {
      Alert.alert("Camera", e?.message || "Failed to send image");
    } finally {
      setSendingImage(false);
    }
  }, [conversationId]);

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
          data={listData}
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
            onPress={onPickAndSendImage}
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
            onPress={onCaptureAndSendImage}
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
