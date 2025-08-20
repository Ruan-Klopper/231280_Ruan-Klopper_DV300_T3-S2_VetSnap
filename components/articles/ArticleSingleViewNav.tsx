// components/articles/ArticleSingleViewNav.tsx
import React from "react";
import { StyleSheet, View, Pressable, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

type ArticleSingleViewNavProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBack?: () => void;
  onScrollToTop: () => void;
  fontSize?: number;
};

const ArticleSingleViewNav: React.FC<ArticleSingleViewNavProps> = ({
  onZoomIn,
  onZoomOut,
  onBack,
  onScrollToTop,
  fontSize = 16,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.absoluteWrapper} pointerEvents="box-none">
      {/* gradient fade at bottom — don’t block touches */}
      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.0)"]}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        pointerEvents="none"
      />

      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 6) },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.navContainer} pointerEvents="auto">
          {/* LEFT: zoom controls */}
          <View style={styles.zoomControls}>
            <Pressable
              onPress={onZoomOut}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && Platform.OS === "ios" && { opacity: 0.7 },
              ]}
              android_ripple={{ color: "#eee", borderless: true }}
            >
              <Ionicons name="remove" size={22} color="#4A7C59" />
            </Pressable>
            <Text style={styles.fontSizeLabel}>{fontSize}</Text>
            <Pressable
              onPress={onZoomIn}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && Platform.OS === "ios" && { opacity: 0.7 },
              ]}
              android_ripple={{ color: "#eee", borderless: true }}
            >
              <Ionicons name="add" size={22} color="#4A7C59" />
            </Pressable>
          </View>

          {/* MIDDLE: scroll-to-top */}
          <Pressable
            onPress={onScrollToTop}
            style={({ pressed }) => [
              styles.scrollTopButton,
              pressed && Platform.OS === "ios" && { opacity: 0.7 },
            ]}
            android_ripple={{ color: "#eee", borderless: true }}
          >
            <Ionicons name="arrow-up" size={22} color="#4A7C59" />
            <Text style={styles.scrollTopText}>Top</Text>
          </Pressable>

          {/* RIGHT: back */}
          <Pressable
            onPress={onBack ?? (() => (navigation as any)?.goBack?.())}
            style={({ pressed }) => [
              styles.backButton,
              pressed && Platform.OS === "ios" && { opacity: 0.7 },
            ]}
            android_ripple={{ color: "#eee", borderless: true }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default ArticleSingleViewNav;

const styles = StyleSheet.create({
  // NEW: pin the nav to the bottom above everything
  absoluteWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4000,
    elevation: 24,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 15,
  },
  navContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    padding: 12,
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A7C59",
    minWidth: 28,
    textAlign: "center",
  },
  scrollTopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scrollTopText: {
    color: "#4A7C59",
    fontWeight: "700",
    marginLeft: 6,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A7C59",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
  },
});
