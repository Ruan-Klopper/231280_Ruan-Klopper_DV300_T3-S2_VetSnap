import React from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../../global/styles";
import { useNavigation } from "@react-navigation/native";
import { useTab } from "../global/TabContext";

// Example data
const articles = [
  {
    id: "1",
    title: "Chapter 15: Amoebic infections",
    categories: ["Muscidae", "Stomoxyinae", "Fanniinae"],
    image:
      "https://media.wired.com/photos/593261cab8eb31692072f129/3:2/w_2560%2Cc_limit/85120553.jpg",
  },
  {
    id: "2",
    title: "Chapter 16: Viral infections",
    categories: ["Retroviridae", "Flaviviridae"],
    image:
      "https://www.worldanimalprotection.org/cdn-cgi/image/width=1920,format=auto/globalassets/images/elephants/1033551-elephant.jpg",
  },
  {
    id: "3",
    title: "Chapter 16: Viral infections",
    categories: ["Retroviridae", "Flaviviridae"],
    image:
      "https://www.aaha.org/wp-content/uploads/2024/03/b5e516f1655346558958c939e85de37a.jpg",
  },
];

const ArticlesItem = ({ article }: { article: (typeof articles)[0] }) => {
  const navigation = useNavigation();
  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate("ArticleSingleView" as never)}
    >
      <ImageBackground
        source={{ uri: article.image }}
        style={styles.image}
        imageStyle={{ borderRadius: 20 }}
      >
        <LinearGradient
          colors={["rgba(81,134,73,0.6)", "rgba(81,134,73,0.2)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {article.categories.map((cat) => (
            <View key={cat} style={styles.tag}>
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{article.title}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const ExploreArticles = () => {
  const navigation = useNavigation();
  const { setActiveTab } = useTab();
  return (
    <View style={[globalStyles.globalContentBlock]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Explore</Text>
          <Text style={styles.heading}>Articles</Text>
        </View>
        <Pressable
          style={styles.arrowButton}
          onPress={() => setActiveTab("book")}
        >
          <Ionicons name="arrow-forward" size={24} color="#000" />
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={articles}
        renderItem={({ item }) => <ArticlesItem article={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16 }}
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 20, paddingBottom: 20 }}
      />
    </View>
  );
};

export default ExploreArticles;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#FFD233",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    height: 225,
    width: 199,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: "white",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  titleContainer: {
    padding: 15,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});
