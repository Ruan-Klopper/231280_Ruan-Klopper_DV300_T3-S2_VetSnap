import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../../global/styles";
import { useNavigation } from "@react-navigation/native";
import { useTab } from "../global/TabContext";
import ArticleItem from "../articles/ArticleItem";

// Services
import {
  getRandomArticles,
  getAllArticles,
} from "../../services/sanity/sanityService";

// ─── Types (match your service) ─────────────────────────
type ArticleThumb = {
  _id: string;
  title: string;
  keywords?: string[];
  source: number; // 0 anipedia, 1 public, 2 vets
  bannerImage?: string;
  documentId?: number;
};

const ExploreArticles: React.FC = () => {
  const { setActiveTab } = useTab();
  const navigation = useNavigation();

  const [items, setItems] = useState<ArticleThumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pick10 = (arr: ArticleThumb[]) => arr.slice(0, 10);

  const loadRandom = useCallback(async () => {
    try {
      setLoading(true);
      // Prefer the dedicated random endpoint if present:
      const resp = await getRandomArticles?.(10);
      if (resp?.success && resp.data) {
        setItems(resp.data);
      } else {
        // Fallback: get all, shuffle, take 10
        const all = await getAllArticles();
        if (all.success && all.data) {
          const shuffled = [...all.data].sort(() => Math.random() - 0.5);
          setItems(pick10(shuffled));
        } else {
          setItems([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRandom();
  }, [loadRandom]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRandom();
    setRefreshing(false);
  }, [loadRandom]);

  return (
    <View style={[globalStyles.globalContentBlock, styles.block]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Explore</Text>
          <Text style={styles.heading}>Articles</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Re-roll random selection */}
          <Pressable onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="shuffle" size={18} color="#1D301E" />
            <Text style={styles.refreshText}>Shuffle</Text>
          </Pressable>

          {/* Go to full list */}
          <Pressable
            style={styles.arrowButton}
            onPress={() => setActiveTab("book")}
          >
            <Ionicons name="arrow-forward" size={22} color="#000" />
          </Pressable>
        </View>
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={({ item }) => (
          <View style={{ width: 300 }}>
            <ArticleItem
              id={item._id}
              documentId={item.documentId}
              title={item.title}
              categories={item.keywords || []}
              image={item.bannerImage}
              source={
                item.source === 0
                  ? "Anipedia"
                  : item.source === 1
                  ? "Public"
                  : "Veterinarian"
              }
            />
          </View>
        )}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !loading}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : (
            <Text style={styles.muted}>No articles found.</Text>
          )
        }
      />
    </View>
  );
};

export default ExploreArticles;

const styles = StyleSheet.create({
  block: { paddingBottom: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  subtitle: { fontSize: 15, fontWeight: "300" },
  heading: { fontSize: 24, fontWeight: "800" },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#FFD233",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF4E8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  refreshText: { fontWeight: "700", color: "#1D301E" },
  muted: { color: "#6B7280", paddingHorizontal: 20 },
});
