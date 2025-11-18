// components/articles/ArticleItem.tsx
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
  id: string; // Sanity _id
  documentId?: number; // numeric doc id (optional)
  title: string;
  categories: string[];
  image?: string;
  source?: "Anipedia" | "Public" | "Veterinarian";
};

type RootStackParamList = {
  ArticleSingleView: { id: string; documentId?: number };
};

const ArticleItem = ({
  id,
  documentId,
  title,
  categories,
  image,
  source,
}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 414; // iPhone 11 Pro and smaller

  // Limit number of pills displayed based on screen size
  const maxPills = isSmallScreen ? 3 : 5;
  const visibleCategories = categories.slice(0, maxPills);

  // Truncate category text to 7 characters (only on small screens)
  const truncateCategory = (cat: string): string => {
    if (!isSmallScreen) return cat; // No truncation on larger screens
    if (cat.length <= 7) return cat;
    return cat.slice(0, 7) + "...";
  };

  const Content = () => (
    <>
      <LinearGradient
        colors={["rgba(81,134,73,0.9)", "rgba(81,134,73,0.0)"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Categories - Limited to 3 on small, 5 on large */}
      <View style={styles.tagsContainer}>
        {visibleCategories.map((cat, index) => (
          <View key={`${cat}-${index}`} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {truncateCategory(cat)}
            </Text>
          </View>
        ))}
      </View>

      {/* Title + Source */}
      <View style={styles.titleContainer}>
        {source && (
          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>{source}</Text>
          </View>
        )}
        <Text
          style={[styles.title, isSmallScreen && styles.titleSmall]}
          numberOfLines={isSmallScreen ? 1 : 2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
    </>
  );

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("ArticleSingleView", { id, documentId });
        console.log("ID", id);
        console.log("DocumentID", documentId);
      }}
      style={styles.card}
    >
      {image ? (
        <ImageBackground
          source={{ uri: image }}
          style={styles.image}
          imageStyle={{ borderRadius: 12 }}
        >
          <Content />
        </ImageBackground>
      ) : (
        <View style={[styles.image, { backgroundColor: "#518649" }]}>
          <Content />
        </View>
      )}
    </Pressable>
  );
};

export default ArticleItem;

const styles = StyleSheet.create({
  card: {
    height: 170,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 12,
  },
  tag: {
    backgroundColor: "white",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  tagText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  titleContainer: {
    padding: 12,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 28,
  },
  titleSmall: {
    fontSize: 20,
    lineHeight: 24,
  },
  sourcePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D301E",
    textTransform: "uppercase",
  },
});
