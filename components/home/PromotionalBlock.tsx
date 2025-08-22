// PromotionalBlock.tsx
import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type PromotionalBlockProps = {
  image: ImageSourcePropType | string; // allow both
  title: string;
};

const PromotionalBlock = ({ image, title }: PromotionalBlockProps) => {
  const src = typeof image === "string" ? { uri: image } : image;

  return (
    <ImageBackground
      source={src}
      style={styles.card}
      imageStyle={{ borderRadius: 20 }}
    >
      <LinearGradient
        colors={["rgba(81,134,73,0.6)", "rgba(81,134,73,0.2)"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.overlay}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>VetSnap+</Text>
          <Pressable style={styles.arrow}>
            <Ionicons name="arrow-forward" size={24} color="#000" />
          </Pressable>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
    </ImageBackground>
  );
};

export default PromotionalBlock;

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  arrow: {
    backgroundColor: "#FFD233",
    width: 42,
    height: 42,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 30,
  },
});
