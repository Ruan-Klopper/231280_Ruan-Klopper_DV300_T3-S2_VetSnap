/* /screens/Chat.tsx */
import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/global/AppHeader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.75 - 32; // bubble width – padding

/* ---------- Types ---------- */
export type ChatMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  from: "user" | "bot";
  timestamp: string; // HH:mm
};

/* ---------- Helpers ---------- */
const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ---------- Message bubble ---------- */
const Bubble = ({ item }: { item: ChatMessage }) => {
  const { from, text, timestamp, imageUrl, imageWidth, imageHeight } = item;

  // scale image only when we know original dimensions
  let scaledW = 0,
    scaledH = 0;
  if (imageUrl && imageWidth && imageHeight) {
    const ratio = imageWidth / imageHeight;
    if (imageWidth > MAX_IMAGE_WIDTH) {
      scaledW = MAX_IMAGE_WIDTH - 14;
      scaledH = MAX_IMAGE_WIDTH / ratio;
    } else {
      scaledW = imageWidth;
      scaledH = imageHeight;
    }
  }

  return (
    <View
      style={[
        styles.bubbleWrapper,
        from === "user" ? styles.alignRight : styles.alignLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          from === "user" ? styles.userBubble : styles.botBubble,
        ]}
      >
        {imageUrl && !!scaledW && !!scaledH && (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: scaledW,
              height: scaledH,
              borderRadius: 12,
              marginBottom: 8,
            }}
          />
        )}

        {!!text && <Text style={styles.messageText}>{text}</Text>}

        <Text style={styles.timestamp}>
          {timestamp}
          {from === "bot" && " • Received"}
        </Text>
      </View>
    </View>
  );
};

/* ---------- Screen ---------- */
export default function Chat() {
  /* Seeded messages */
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Here are some cows – first time I saw these things, wow!",
      imageUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUGaKQYijLVxRAa8LkWgRnOYGWwQvLB0eV9A&s",
      from: "bot",
      timestamp: "17:31",
    },
    {
      id: "2",
      text: "Got it!",
      from: "bot",
      timestamp: "17:31",
    },
    {
      id: "3",
      text: "Camels!",
      imageUrl:
        "https://hips.hearstapps.com/hmg-prod/images/headshot-of-giraffe-sabi-sands-game-reserve-royalty-free-image-1573571198.jpg",
      from: "bot",
      timestamp: "17:32",
    },
  ]);

  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const BUBBLE_PADDING = 24; // ⬅︎ keep in one place
  const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.75 - 12;

  useEffect(() => {
    const withDimensions = async () => {
      const mapped = await Promise.all(
        messages.map(async (m) => {
          if (m.imageUrl && !m.imageWidth && !m.imageHeight) {
            try {
              const { w, h } = await new Promise<{ w: number; h: number }>(
                (res, rej) =>
                  Image.getSize(m.imageUrl!, (w, h) => res({ w, h }), rej)
              );

              const ratio = w / h;
              const scaledW = w > MAX_IMAGE_WIDTH ? MAX_IMAGE_WIDTH : w;
              const scaledH = scaledW / ratio;

              return { ...m, imageWidth: scaledW, imageHeight: scaledH };
            } catch {
              return m;
            }
          }
          return m;
        })
      );

      setMessages(mapped);
    };

    withDimensions();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  /* ---- Auto-scroll on new messages ---- */
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

  /* ---- Send message ---- */
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      from: "user",
      timestamp: now(),
    };

    setMessages((prev) => [userMsg, ...prev]);
    setInput("");

    // mock bot reply
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Got it!",
        from: "bot",
        timestamp: now(),
      };
      setMessages((prev) => [botMsg, ...prev]);
    }, 600);
  }, [input]);

  /* ---- Render ---- */
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <AppHeader
        variant={4}
        userAvatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
        userName="Jane Johnson"
        isOnline
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={Bubble}
          contentContainerStyle={styles.chatContent}
          inverted
        />

        {/* -------- Input Row -------- */}
        <View style={styles.inputRow}>
          <Pressable style={styles.mediaBtn}>
            <Text style={styles.mediaIcon}>🖼️</Text>
          </Pressable>

          <TextInput
            style={styles.textInput}
            placeholder="Type message"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />

          <Pressable onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f4ef" },
  flex: { flex: 1 },
  chatContent: {
    paddingHorizontal: 16,
    // To counter for the header
    paddingBottom: 112,
    gap: 12,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  /* Bubbles */
  bubbleWrapper: { maxWidth: "75%" },
  alignLeft: { alignSelf: "flex-start" },
  alignRight: { alignSelf: "flex-end" },
  bubble: { borderRadius: 20, padding: 12 },
  userBubble: { backgroundColor: "#DCF8C6" },
  botBubble: { backgroundColor: "#E5E5EA" },
  messageText: { fontSize: 16, color: "#111" },
  timestamp: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  /* Input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 50,
    elevation: 1,
  },
  mediaBtn: { padding: 10 },
  mediaIcon: { fontSize: 18 },
  textInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendBtn: { padding: 10 },
  sendIcon: { fontSize: 18, fontWeight: "bold", color: "#4CAF50" },
});
