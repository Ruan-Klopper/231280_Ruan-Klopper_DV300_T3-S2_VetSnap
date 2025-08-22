import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Chat: undefined;
};

export type ChatItemProps = {
  name: string;
  time: string;
  message: string;
  avatarUrl: string;
  isUnread: boolean;
  // optional navigation params (used if onPress not provided)
  navigationParams?: {
    conversationId?: string;
    otherUserId?: string;
  };
  onPress?: () => void;
};

const ChatItem: React.FC<ChatItemProps> = ({
  name,
  time,
  message,
  avatarUrl,
  isUnread,
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

  const cropTitleByX = (title: string, count: number): string => {
    const xCount = count;
    const cropLength = xCount > 0 ? xCount : title.length;
    return title.length > cropLength
      ? title.slice(0, cropLength) + "..."
      : title;
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        style={[
          styles.container,
          isUnread ? styles.unreadBorder : styles.readBorder,
        ]}
      >
        {!!avatarUrl && (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.row}>
            <Text style={styles.time}>{time}</Text>
            {isUnread && <View style={styles.dot} />}
            <Text style={styles.message} numberOfLines={1}>
              {cropTitleByX(message, 30)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default ChatItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: "#2d2d2d",
    marginBottom: 8,
    gap: 12,
  },
  unreadBorder: {
    borderColor: "#3399FF",
  },
  readBorder: {
    borderColor: "#fff",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ratingBadge: {
    position: "absolute",
    left: 8,
    bottom: -4,
    backgroundColor: "#8BC34A",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  star: {
    fontSize: 12,
    marginLeft: 2,
    color: "white",
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#90C248",
    marginRight: 6,
  },
  message: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
});
