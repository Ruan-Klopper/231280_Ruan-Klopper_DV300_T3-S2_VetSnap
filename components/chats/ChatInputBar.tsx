import React, { useState } from "react";
import { StyleSheet, TextInput, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ChatInputBarProps = {
  onSend: (message: string) => void;
  onImagePress?: () => void;
  placeholder?: string;
};

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  onImagePress,
  placeholder = "Type message",
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onImagePress} style={styles.iconButton}>
        <Ionicons name="image" size={24} color="black" />
      </Pressable>

      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#8BC34A"
          style={styles.input}
          value={message}
          onChangeText={setMessage}
        />
        <Pressable onPress={handleSend}>
          <Ionicons name="send" size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
};

export default ChatInputBar;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 12,
    backgroundColor: "#F5F5F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#4CAF50",
  },
});
