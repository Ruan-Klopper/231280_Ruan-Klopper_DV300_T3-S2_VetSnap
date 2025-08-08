import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import SearchBar from "../components/global/SearchBar";
import ArticleItem from "../components/articles/ArticleItem";
import LoadingIndicator from "../components/global/LoadingIndicator";
import ArticleFilterGroup from "../components/articles/ArticleFilterGroup";
import { getAllArticles } from "../services/sanity/sanityService";

// ─── Types ─────────────────────────────
type Article = {
  _id: string;
  title: string;
  keywords?: string[];
  source: number;
  bannerImage?: string;
};

// ─── Constants ────────────────────────
const filters = ["All", "Public", "Anipedia", "Veterinarians"];
const filterSourceMap: Record<string, number | null> = {
  All: null,
  Public: 1,
  Anipedia: 0,
  Veterinarians: 2,
};

// ─── Header ───────────────────────────
const HeaderComponents = () => {
  const [query, setQuery] = useState("");
  return (
    <>
      <Text style={styles.headerText}>Browse all Articles</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSearch={(q) => console.log("Searching for:", q)}
      />
    </>
  );
};

// ─── Main Screen ──────────────────────
const BrowseArticles = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [viewType, setViewType] = useState("All Articles");
  const [activeFilter, setActiveFilter] = useState("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  // Initial fetch
  useEffect(() => {
    const fetchArticles = async () => {
      const result = await getAllArticles();
      if (result.success && result.data) {
        setArticles(result.data);
        setFilteredArticles(result.data);
      }
      setIsLoading(false);
    };
    fetchArticles();
  }, []);

  // Filtering logic with slight delay
  useEffect(() => {
    setIsFiltering(true);
    const timeout = setTimeout(() => {
      const filtered = articles.filter((article) =>
        filterSourceMap[activeFilter] === null
          ? true
          : article.source === filterSourceMap[activeFilter]
      );
      setFilteredArticles(filtered);
      setIsFiltering(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeFilter, articles]);

  return (
    <View style={globalStyles.root}>
      <AppHeader variant={2} title="Browse" />
      <AppContentGroup headerComponents={<HeaderComponents />}>
        <ArticleFilterGroup />

        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          {/* View Type Heading */}
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Viewing</Text>
              <Text style={styles.heading}>{viewType}</Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.pillsContainer}>
            {filters.map((filter) => (
              <Text
                key={filter}
                onPress={() => {
                  setActiveFilter(filter);
                  setViewType(`${filter} Articles`);
                }}
                style={[
                  styles.pill,
                  activeFilter === filter && styles.activePill,
                ]}
              >
                {filter}
              </Text>
            ))}
          </View>

          {/* Content */}
          {isLoading ? (
            <LoadingIndicator progress={42} message="Loading articles..." />
          ) : isFiltering ? (
            <LoadingIndicator progress={20} message="Filtering articles..." />
          ) : (
            <View style={{ gap: 8, paddingBottom: 32 }}>
              {filteredArticles.map((item) => (
                <ArticleItem
                  key={item._id}
                  title={item.title}
                  categories={item.keywords || []}
                  image={item.bannerImage || ""}
                  source={
                    item.source === 0
                      ? "Anipedia"
                      : item.source === 1
                      ? "Public"
                      : "Veterinarians"
                  }
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

// ─── Styles ────────────────────────────
const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 20,
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
