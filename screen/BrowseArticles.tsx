// /screens/BrowseArticles.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/global/AppHeader";
import SearchBar from "../components/global/SearchBar";
import ArticleItem from "../components/articles/ArticleItem";
import LoadingIndicator from "../components/global/LoadingIndicator";
import { globalStyles } from "../global/styles";
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

const BrowseArticles = () => {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Article>>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);

  // Search states
  const [inputValue, setInputValue] = useState(""); // immediate keystrokes
  const [query, setQuery] = useState(""); // debounced applied query
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false); // loader in list area
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Category chips
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Initial fetch
  useEffect(() => {
    (async () => {
      const result = await getAllArticles();
      if (result.success && result.data) setArticles(result.data);
      setIsLoading(false);
    })();
  }, []);

  // Build category list from keywords
  const categories = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a) => (a.keywords || []).forEach((k) => s.add(k.trim())));
    return ["All", ...Array.from(s).filter(Boolean).sort().slice(0, 30)];
  }, [articles]);

  // Debounced search handler (keeps keyboard open)
  const handleChangeQuery = useCallback((text: string) => {
    setInputValue(text);
    setIsSearching(!!text.trim());
    setIsFiltering(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(text);
      setIsFiltering(false);
    }, 250);
  }, []);

  const handleCancel = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue("");
    setQuery("");
    setIsSearching(false);
    setIsFiltering(false);
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? "All" : cat));
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Filter using the DEBOUNCED query + category
  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesQuery =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        (a.keywords || []).some((k) => k.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "All" ||
        (a.keywords || []).map((k) => k.trim()).includes(selectedCategory);

      return matchesQuery && matchesCategory;
    });
  }, [articles, query, selectedCategory]);

  const bottomOffset = 80 + insets.bottom;

  const cropTitleByX = (title: string): string => {
    const xCount = 9;
    const cropLength = xCount > 0 ? xCount : title.length;
    return title.length > cropLength
      ? title.slice(0, cropLength) + "..."
      : title;
  };

  return (
    <View style={styles.root}>
      <AppHeader variant={2} title="Browse" />

      {/* Nicer, compact header (outside FlatList to preserve focus) */}
      <View style={styles.topWrap}>
        <Text style={styles.pageTitle}>Browse all Articles</Text>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={inputValue}
              onChangeText={handleChangeQuery}
              onSearch={handleChangeQuery}
              onCancel={handleCancel as any}
              // @ts-ignore – if your SearchBar forwards these
              blurOnSubmit={false}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          {/* Inline cancel button */}
          {isSearching && (
            <Pressable onPress={handleCancel} style={styles.cancelPill}>
              <Ionicons name="close" size={16} color="#2F3E46" />
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        {!!categories.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="always"
          >
            {categories.map((cat) => {
              const selected = cat === selectedCategory;
              return (
                <Pressable
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: 24 }}>
          <LoadingIndicator progress={42} message="Loading articles..." />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={isFiltering ? [] : filteredArticles} // show loader via ListEmptyComponent while filtering
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ArticleItem
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
          )}
          // Clean white card that holds the list
          contentContainerStyle={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
            styles.blockContainer,
          ]}
          // Small header inside the card
          ListHeaderComponent={
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.subtitle}>
                  {isSearching || selectedCategory !== "All"
                    ? "Filtered view"
                    : "Viewing"}
                </Text>
                <Text style={styles.heading}>
                  {isSearching ? `"${inputValue.trim()}"` : "All Articles"}
                  {selectedCategory !== "All"
                    ? ` · ${cropTitleByX(selectedCategory)}`
                    : ""}
                </Text>
              </View>
              {(isSearching || selectedCategory !== "All") && (
                <Pressable
                  onPress={() => {
                    handleCancel();
                    setSelectedCategory("All");
                  }}
                >
                  <Text style={styles.clearFilters}>Clear</Text>
                </Pressable>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            isFiltering ? (
              <LoadingIndicator progress={66} message="Searching articles..." />
            ) : (
              <Text style={styles.emptyText}>
                No articles match your filters.
              </Text>
            )
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false} // keeps focus reliable on Android
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          overScrollMode="never"
        />
      )}

      {/* Always-visible Scroll-To-Top button (centered) */}
      <View style={styles.fabOverlay} pointerEvents="box-none">
        <Pressable
          onPress={scrollToTop}
          style={[styles.fab, { bottom: bottomOffset }]}
          android_ripple={{ color: "#e0e0e0", borderless: true }}
        >
          <Ionicons name="arrow-up" size={24} color="#2F3E46" />
        </Pressable>
      </View>
    </View>
  );
};

export default BrowseArticles;

// ─── Styles ────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F4EF",
    paddingTop: 110,
  },

  // Top section
  topWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2F3E46",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cancelText: {
    fontWeight: "700",
    color: "#2F3E46",
  },

  // Chips
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  chipSelected: {
    backgroundColor: "#518649",
    borderColor: "#518649",
  },
  chipText: {
    color: "#2F3E46",
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },

  // White content block (the list lives inside this card)
  blockContainer: {
    marginHorizontal: 20,
    paddingBottom: 140,
  },

  // Block header (inside white card)
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
    color: "#2F3E46",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F3E46",
  },
  clearFilters: {
    color: "#518649",
    fontWeight: "700",
  },

  // Empty state
  emptyText: {
    textAlign: "center",
    paddingVertical: 32,
    color: "#666",
    fontSize: 16,
  },

  // FAB
  fabOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  fab: {
    position: "absolute",
    left: "50%",
    marginLeft: -26,
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
