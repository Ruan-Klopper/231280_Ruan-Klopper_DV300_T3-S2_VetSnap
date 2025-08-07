import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import SearchBar from "../components/global/SearchBar";
import ArticleGroup from "../components/articles/ArticleGroup";
import ArticleItem from "../components/articles/ArticleItem";
import LoadingIndicator from "../components/global/LoadingIndicator";
import ArticleFilterGroup from "../components/articles/ArticleFilterGroup";

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
    title: "Chapter 17: Bacterial infections",
    categories: ["Bacillaceae", "Enterobacteriaceae"],
    image:
      "https://www.aaha.org/wp-content/uploads/2024/03/b5e516f1655346558958c939e85de37a.jpg",
  },
];

const HeaderComponents = () => {
  const [query, setQuery] = useState("");
  return (
    <>
      <Text
        style={[styles.headerText, { fontWeight: "800", marginBottom: 20 }]}
      >
        Browse all Articles
      </Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSearch={(q) => console.log("Searching for:", q)}
      />
    </>
  );
};

const BrowseArticles = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState("All Articles");
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Public", "Anipedia", "Veterinarians"];

  useEffect(() => {
    // Simulate loading delay
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timeout); // cleanup
  }, []);

  return (
    <View style={globalStyles.root}>
      {/* Header */}
      <AppHeader variant={2} title="Browse" />

      {/* Content Area */}
      <AppContentGroup headerComponents={<HeaderComponents />}>
        <ArticleFilterGroup />
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          {/* Filter Pills */}

          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Viewing</Text>
              <Text style={styles.heading}>{viewType}</Text>
            </View>
          </View>

          <View style={styles.pillsContainer}>
            {filters.map((filter) => (
              <Text
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.pill,
                  activeFilter === filter && styles.activePill,
                ]}
              >
                {filter}
              </Text>
            ))}
          </View>
          {isLoading ? (
            <LoadingIndicator progress={42} message="Loading articles..." />
          ) : (
            <View style={{ gap: 8 }}>
              {articles
                // Optional: actual filter logic here if needed
                .map((item) => (
                  <ArticleItem
                    key={item.id}
                    title={item.title}
                    categories={item.categories}
                    image={item.image}
                    source="Anipedia"
                  />
                ))}
            </View>
          )}
        </View>
      </AppContentGroup>
    </View>
  );
};

export default BrowseArticles;

const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 16,
  },

  pill: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 20,
    fontSize: 14,
  },

  activePill: {
    backgroundColor: "#39B54A",
    color: "#fff",
  },
});
