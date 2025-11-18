// /components/global/AppNavigation.tsx
import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { TabKey } from "./TabContext"; // 👈 use the shared TabKey

type AppNavigationProps = {
  activeTab: TabKey;
  onTabChange?: (key: TabKey) => void;
  tabsOverride?: {
    key: TabKey;
    icon: keyof typeof Ionicons.glyphMap;
    navigateTo: string;
    displayName?: string;
  }[];
};

// 👇 Ensure the order puts Pulse in the middle (3rd of 5)
const defaultTabs: {
  key: TabKey;
  icon: keyof typeof Ionicons.glyphMap;
  navigateTo: string;
  displayName: string;
}[] = [
  { key: "home", icon: "home", navigateTo: "Home", displayName: "Home" },
  {
    key: "book",
    icon: "book",
    navigateTo: "BrowseArticles",
    displayName: "Browse",
  },
  {
    key: "pulse",
    icon: "pulse",
    navigateTo: "AllPulses",
    displayName: "Pulse",
  }, // 👈 NEW
  {
    key: "chat",
    icon: "chatbox-ellipses",
    navigateTo: "AllChats",
    displayName: "Chats",
  },
  {
    key: "profile",
    icon: "person",
    navigateTo: "UserProfile",
    displayName: "Profile",
  },
];

const AppNavigation: React.FC<AppNavigationProps> = ({
  activeTab,
  onTabChange,
  tabsOverride,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const tabs = tabsOverride ?? defaultTabs;

  const screenWidth = Dimensions.get("window").width;
  const MARGIN = 30;

  const navWidthAnim = useRef(new Animated.Value(screenWidth - MARGIN)).current;

  const animations = useRef<Record<TabKey, Animated.Value>>(
    Object.fromEntries(
      tabs.map((tab) => [
        tab.key,
        new Animated.Value(tab.key === activeTab ? 1 : 0),
      ])
    ) as Record<TabKey, Animated.Value>
  ).current;

  useEffect(() => {
    Animated.timing(navWidthAnim, {
      toValue: screenWidth - MARGIN,
      duration: 300,
      useNativeDriver: false,
    }).start();

    Object.keys(animations).forEach((key) => {
      Animated.timing(animations[key as TabKey], {
        toValue: key === activeTab ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
  }, [activeTab]);

  return (
    <>
      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.0)"]}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      />

      <View style={[styles.container, { marginBottom: insets.bottom }]}>
        <Animated.View style={styles.navContainer}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            const backgroundColor = animations[tab.key].interpolate({
              inputRange: [0, 1],
              outputRange: ["transparent", "#518649"],
            });

            // Use small screen sizes globally
            const iconSize = isActive ? 22 : 16;

            return (
              <Animated.View
                key={tab.key}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor,
                    flexDirection: "row",
                    paddingHorizontal: isActive ? 6 : 0,
                    flex: 1,
                    flexShrink: isActive ? 0 : 1,
                    maxWidth: isActive ? "32%" : "14%",
                    minWidth: isActive ? undefined : 38,
                    height: !isActive ? 44 : 50,
                  },
                ]}
              >
                <Pressable
                  onPress={() => onTabChange?.(tab.key)}
                  style={({ pressed }) => [
                    styles.pressableArea,
                    pressed && Platform.OS === "ios" && { opacity: 0.8 },
                  ]}
                  android_ripple={{ color: "#eee", borderless: true }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={iconSize}
                    color={isActive ? "#FFFFFF" : "#518649"}
                  />
                  {isActive && (
                    <Animated.Text
                      style={[styles.tabLabel, styles.tabLabelSmall]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {tab.displayName || tab.key}
                    </Animated.Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </>
  );
};

export default AppNavigation;

const styles = StyleSheet.create({
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    zIndex: 100,
  },
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  navContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 35,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 200,
    padding: 10,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  iconButton: {
    minWidth: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 1,
  },
  pressableArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
    minWidth: 0,
    flexShrink: 0, // Don't shrink the pressable area
    flexGrow: 0, // Don't grow the pressable area, let parent handle it
  },
  tabLabel: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    marginLeft: 8,
    marginBottom: 2,
  },
  tabLabelSmall: {
    fontSize: 14,
    marginLeft: 5,
    flexShrink: 1,
  },
});
