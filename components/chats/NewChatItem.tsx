import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  Chat: undefined;
};

type NewChatItemProps = {
  name: string;
  position: string;
  imageUrl: string;
  rating: number;
  isOnline: boolean;
};

const NewChatItem: React.FC<NewChatItemProps> = ({
  name,
  position,
  imageUrl,
  rating,
  isOnline,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      style={styles.container}
      onPress={() => navigation.navigate("Chat")}
    >
      {/* Left Section */}
      <View style={styles.leftSection}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Ionicons name="star" size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.textBlock}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isOnline && styles.onlineDot]} />
            <Text style={styles.onlineText}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.positionText}>{position}</Text>
        </View>
      </View>

      {/* Right Arrow */}
      <Ionicons name="arrow-forward" size={20} color="#000" />
    </Pressable>
  );
};

export default NewChatItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F4F5EF",
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ratingBadge: {
    position: "absolute",
    bottom: -4,
    left: 8,
    backgroundColor: "#73C860",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    marginRight: 2,
    fontWeight: "bold",
  },
  textBlock: {
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    backgroundColor: "#ccc",
  },
  onlineDot: {
    backgroundColor: "#5DD069",
  },
  onlineText: {
    fontSize: 12,
    color: "#333",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  positionText: {
    fontSize: 14,
    color: "#666",
  },
});
