import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Platform,
  StatusBar,
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type Variant = 1 | 2 | 3 | 4;

type AppHeaderProps = {
  variant?: Variant;
  title?: string;
  articleId?: string | null;
  isSaved?: boolean;
  leftLogo?: React.ReactNode;
  onBackPress?: () => void;
  onSavePress?: (articleId?: string | null) => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  enableSheen?: boolean;
  enableParticles?: boolean;
  topColor?: string;
  userAvatarUrl?: string;
  userName?: string;
  isOnline?: boolean;
};

const AppHeader: React.FC<AppHeaderProps> = ({
  variant = 1,
  title = "VetSnap",
  articleId = null,
  isSaved = false,
  leftLogo,
  onBackPress,
  onSavePress,
  onNotificationsPress,
  onProfilePress,
  containerStyle,
  titleStyle,
  enableSheen = false,
  enableParticles = false,
  topColor = "#1D301E",
  userAvatarUrl,
  userName,
  isOnline,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const sheenAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enableSheen) return;
    Animated.loop(
      Animated.timing(sheenAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [enableSheen, sheenAnim]);

  useEffect(() => {
    if (!enableParticles) return;
    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();
  }, [enableParticles, particleAnim]);

  const sheenTranslate = sheenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const particleY = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const renderLeft = () => {
    switch (variant) {
      case 1:
        return (
          <View style={styles.leftSection}>
            <Pressable style={styles.backButton} onPress={onBackPress}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        );
      case 2:
        return (
          <View style={styles.leftSection}>
            {leftLogo ?? (
              <Ionicons
                name="paw"
                size={24}
                color="white"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        );
      case 3:
        return (
          <View style={styles.leftSection}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        );
      case 4:
        return (
          <View style={styles.leftSection}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View style={styles.chatUserInfo}>
              {userAvatarUrl && (
                <View style={styles.avatarWrapper}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isOnline ? "#00C851" : "#ccc",
                      },
                    ]}
                  />
                  <View style={styles.avatarBorder}>
                    <Image
                      source={{ uri: userAvatarUrl }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              )}
              <View>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={styles.userStatus}>
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderRight = () => (
    <View style={styles.rightSection}>
      {variant === 3 && (
        <Pressable
          style={styles.iconButton}
          onPress={() => onSavePress?.(articleId)}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color="white"
          />
        </Pressable>
      )}
      <Pressable style={styles.iconButton} onPress={onNotificationsPress}>
        <Ionicons name="notifications-outline" size={24} color="white" />
      </Pressable>
      <Pressable style={styles.profileButton} onPress={onProfilePress}>
        <Ionicons name="person" size={22} color="black" />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.wrapper, containerStyle]} pointerEvents="box-none">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.container, { paddingTop: statusBarHeight }]}>
        <LinearGradient
          colors={[topColor, "transparent"]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {enableParticles && (
          <>
            <Animated.View
              style={[
                styles.particle,
                { transform: [{ translateY: particleY }, { translateX: 60 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                { transform: [{ translateY: particleY }, { translateX: 180 }] },
              ]}
            />
          </>
        )}
        {enableSheen && (
          <Animated.View
            style={[
              styles.sheen,
              { transform: [{ translateX: sheenTranslate }] },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <View style={styles.content}>
          {renderLeft()}
          {renderRight()}
        </View>
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 100,
  },
  container: {
    height: 110,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  sheen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 160,
    opacity: 0.25,
  },
  particle: {
    position: "absolute",
    top: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.4)",
    shadowColor: "#fff",
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  content: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: { marginRight: 10 },
  iconButton: { marginRight: 10 },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    maxWidth: 240,
  },
  chatUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 6,
  },
  avatarBorder: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  statusDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#1D301E",
    zIndex: 2,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userStatus: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
