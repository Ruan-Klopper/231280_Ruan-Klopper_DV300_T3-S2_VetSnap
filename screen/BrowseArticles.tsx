import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  documentId?: number;
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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [viewType, setViewType] = useState("All Articles");
  const [activeFilter, setActiveFilter] = useState("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [showToTop, setShowToTop] = useState(false);

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

  const showRef = useRef(false);

  const handleScroll = useCallback((e: any) => {
    const y = e?.nativeEvent?.contentOffset?.y ?? 0;
    const next = y > 120;
    if (showRef.current !== next) {
      showRef.current = next;
      setShowToTop(next);
    }
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const bottomOffset = 80 + insets.bottom;

  return (
    <View style={globalStyles.root}>
      <AppHeader variant={2} title="Browse" />

      {/* Single scroll view controlling the page */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true} // ✅ helps on Android for long lists
        overScrollMode="never" // optional: avoid bounce jank on Android
      >
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
                    id={item._id}
                    documentId={item.documentId}
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
      </ScrollView>

      {/* Floating Scroll-To-Top button */}
      <View style={styles.fabOverlay} pointerEvents="box-none">
        {showToTop && (
          <Pressable
            onPress={scrollToTop}
            style={[styles.fab, { bottom: bottomOffset }]}
            android_ripple={{ color: "#e0e0e0", borderless: true }}
          >
            <Ionicons name="arrow-up" size={24} color="#2F3E46" />
          </Pressable>
        )}
      </View>
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

  // Floating Action Button (scroll to top)
  fabOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // no background; sits above content but doesn't block touches except on the button itself
  },
  fab: {
    position: "absolute",
    left: "50%", // center horizontally
    marginLeft: -26, // half of width to perfectly center (width = 52)
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },
});
