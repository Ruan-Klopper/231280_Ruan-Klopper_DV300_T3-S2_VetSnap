import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  Chat: undefined;
};

export type NewChatItemProps = {
  name: string;
  position: string;
  imageUrl: string;
  rating: number;
  // If provided, component can navigate after conversation creation by parent
  navigationParams?: {
    conversationId?: string;
    otherUserId?: string;
  };
  onPress?: () => void; // usually starts the conversation in the parent
};

const NewChatItem: React.FC<NewChatItemProps> = ({
  name,
  position,
  imageUrl,
  rating,
  onPress,
  navigationParams,
}) => {
  const handlePress = () => {
    if (onPress) return onPress();
    if (navigationParams?.conversationId) {
      navigation.navigate("Chat" as any, navigationParams);
    }
  };

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        <View style={styles.imageWrapper}>
          {!!imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
          )}
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Ionicons name="star" size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.textBlock}>
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
