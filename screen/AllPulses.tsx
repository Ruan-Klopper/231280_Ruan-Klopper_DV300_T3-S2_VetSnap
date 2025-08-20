import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import React from "react";
import AppHeader from "../components/global/AppHeader";
import { globalStyles } from "../global/styles";
import AppContentGroup from "../components/global/AppContentGroup";
import { GetCurrentUserData } from "../services/auth/authService";
import { useNavigation } from "@react-navigation/native";
import { useTab } from "../components/global/TabContext";
import { Ionicons } from "@expo/vector-icons";
import PulseCard from "../components/pulse/PulseCard";

// Pulse service
import {
  subscribeAllPosts,
  fetchMore,
  batchGetMyPulseStates,
  togglePulse,
  formatForCard,
  type PulseListPage,
} from "../services/pulse/pulse.service";

// ✅ Use your user service
import { getUserById } from "../services/user/user.service";

type HeaderComponentsProps = {
  totalCount: number;
  onCreatePulse: () => void;
  onYourPulses: () => void;
};

const HeaderComponents: React.FC<HeaderComponentsProps> = ({
  totalCount,
  onCreatePulse,
  onYourPulses,
}) => (
  <View style={styles.headerBlock}>
    <Text style={styles.headerText}>Latest Pulses</Text>
    <Text style={styles.headerCount}>
      Total Pulses: <Text style={styles.headerCountStrong}>{totalCount}</Text>
    </Text>

    <View style={styles.headerButtonsRow}>
      <Pressable
        onPress={onCreatePulse}
        style={({ pressed }) => [
          styles.hBtnPrimary,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.hBtnPrimaryLabel}>Create Pulse</Text>
      </Pressable>

      <Pressable
        onPress={onYourPulses}
        style={({ pressed }) => [
          styles.hBtnSecondary,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="albums" size={16} color="#518649" />
        <Text style={styles.hBtnSecondaryLabel}>Your Pulses</Text>
      </Pressable>
    </View>
  </View>
);

const BRAND_GREEN = "#518649";

const AllPulses = () => {
  const [user, setUser] = React.useState<any>(null);
  const navigation = useNavigation();
  const { setActiveTab } = useTab();

  // Realtime list + pagination cursor
  const [items, setItems] = React.useState<any[]>([]);
  const [cursor, setCursor] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // My pulse states
  const [myPulseMap, setMyPulseMap] = React.useState<Record<string, boolean>>(
    {}
  );

  // Author cache: { [userId]: { fullName?: string; role?: string } }
  const [authorMap, setAuthorMap] = React.useState<
    Record<string, { fullName?: string; role?: string }>
  >({});

  const unsubscribeRef = React.useRef<() => void>();

  // ─── Load current user ─────────────────────────────────────────
  React.useEffect(() => {
    (async () => {
      const res = await GetCurrentUserData();
      if (res?.success) setUser(res.data);
    })();
  }, []);

  // ─── Realtime subscription (Recent, All categories) ────────────
  React.useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeAllPosts(
      { category: "All", sort: "Recent", pageSize: 20 },
      (page: PulseListPage) => {
        setItems(page.items);
        setCursor(page.cursor);
        setIsLoading(false);
      },
      (err) => {
        console.warn("[subscribeAllPosts] error", err);
        setIsLoading(false);
        Alert.alert("Error", "Unable to load pulses.");
      }
    );
    unsubscribeRef.current = unsub;
    return () => {
      try {
        unsubscribeRef.current?.();
      } catch {}
    };
  }, []);

  // ─── Fetch my pulse states (batch) whenever list or user changes ─
  React.useEffect(() => {
    (async () => {
      if (!user?.userId || items.length === 0) {
        setMyPulseMap({});
        return;
      }
      const ids = items.map((p) => p.id);
      const res = await batchGetMyPulseStates(ids, user.userId);
      if (res.success && res.data) setMyPulseMap(res.data);
    })();
  }, [items, user?.userId]);

  // ─── Hydrate missing authors into cache (no async in render) ───
  React.useEffect(() => {
    (async () => {
      const missing = Array.from(
        new Set(
          items.map((p) => p.authorId).filter((id) => id && !authorMap[id])
        )
      );
      if (missing.length === 0) return;

      // Fetch sequentially or in small parallel batches to avoid quota bursts
      const entries: Array<[string, { fullName?: string; role?: string }]> = [];
      for (const id of missing) {
        try {
          const u = await getUserById(id);
          // adapt to your returned shape
          entries.push([
            id,
            { fullName: u?.fullName ?? u?.fullname ?? "", role: u?.role ?? "" },
          ]);
        } catch (e) {
          entries.push([id, { fullName: "", role: "" }]);
        }
      }
      setAuthorMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]); // (intentionally not depending on authorMap to avoid loops)

  // ─── Load more (pagination) ────────────────────────────────────
  const loadMore = async () => {
    if (!cursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await fetchMore({
        category: "All",
        sort: "Recent",
        pageSize: 20,
        cursor,
      });
      if (res.success && res.data) {
        setItems((prev) => [...prev, ...res.data!.items]);
        setCursor(res.data!.cursor);
      } else {
        Alert.alert("Error", res.error ?? "Could not load more.");
      }
    } catch (e) {
      console.warn("[loadMore] error", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ─── Optimistic toggle handler ─────────────────────────────────
  const onPressPulse = async (postId: string) => {
    if (!user?.userId) {
      Alert.alert("Not signed in", "Please sign in and try again.");
      return;
    }
    // optimistic flip
    setMyPulseMap((m) => ({ ...m, [postId]: !m[postId] }));
    const resp = await togglePulse(postId, user.userId);
    if (!resp.success) {
      setMyPulseMap((m) => ({ ...m, [postId]: !m[postId] }));
      Alert.alert(
        "Error",
        resp.error ?? resp.message ?? "Could not update pulse."
      );
    } else {
      setMyPulseMap((m) => ({ ...m, [postId]: !!resp.data?.isPulsed }));
      // pulseCount will update via realtime listener thanks to the transaction update
    }
  };

  // ─── Render helpers ────────────────────────────────────────────
  const totalCount = items.length;

  const renderCards = (filter: "alert" | "tips_suggestion") => {
    const filtered = items.filter((p) =>
      filter === "alert" ? p.category === "alert" : p.category !== "alert"
    );

    return (
      <View style={styles.pulseContainer}>
        {filtered.map((post) => {
          const vm = formatForCard(post, myPulseMap);
          const author = authorMap[vm.authorId] ?? {};

          return (
            <PulseCard
              key={vm.postId}
              postId={vm.postId}
              category={vm.category as any}
              title={vm.title} // ← title with realtime count
              description={vm.description ?? ""}
              photoUrl={vm.photoUrl ?? undefined}
              authorName={author.fullName || undefined}
              authorRole={author.role || undefined}
              createdAt={(vm.createdAt?.toDate?.() ?? vm.createdAt) as any}
              isPulsedByMe={vm.isPulsedByMe}
              pulseCount={post.pulseCount}
              onPressPulse={() => onPressPulse(vm.postId)}
              onPressCard={() => {}}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={globalStyles.root}>
      <AppHeader
        variant={2}
        title="Pulses"
        userAvatarUrl={user?.photoURL}
        userName={user?.fullName}
        onProfilePress={() => setActiveTab("profile")}
      />

      <AppContentGroup
        headerComponents={
          <HeaderComponents
            totalCount={totalCount}
            // @ts-ignore
            onCreatePulse={() => navigation.navigate("CreatePulse")}
            // @ts-ignore
            onYourPulses={() => navigation.navigate("YourPulses")}
          />
        }
      >
        {/* Alerts */}
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.subtitle}>Latest</Text>
              <Text style={styles.heading}>Alerts</Text>
            </View>
            {isLoading && <ActivityIndicator />}
          </View>
          {isLoading ? <View /> : renderCards("alert")}
        </View>

        {/* Suggestions & Tips */}
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.subtitle}>Latest</Text>
              <Text style={styles.heading}>Suggestions & Tips</Text>
            </View>
          </View>
          {isLoading ? <View /> : renderCards("tips_suggestion")}

          {/* Load more */}
          <View style={{ marginTop: 12 }}>
            {cursor ? (
              <Pressable
                onPress={loadMore}
                disabled={isLoadingMore}
                style={({ pressed }) => [
                  styles.hBtnSecondary,
                  { alignSelf: "center" },
                  pressed && { opacity: 0.9 },
                ]}
              >
                {isLoadingMore ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={BRAND_GREEN}
                    />
                    <Text style={styles.hBtnSecondaryLabel}>Load more</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Text style={{ textAlign: "center", color: "#6B7280" }}>
                You’re all caught up.
              </Text>
            )}
          </View>
        </View>
      </AppContentGroup>
    </View>
  );
};

export default AllPulses;

const styles = StyleSheet.create({
  headerBlock: { alignItems: "flex-start", gap: 8 },
  headerText: { color: "white", fontSize: 32, fontWeight: "800" },
  headerCount: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 2 },
  headerCountStrong: { fontWeight: "800" },
  headerButtonsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  hBtnPrimary: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hBtnPrimaryLabel: { color: "#fff", fontWeight: "800", fontSize: 14 },
  hBtnSecondary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: BRAND_GREEN,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hBtnSecondaryLabel: { color: BRAND_GREEN, fontWeight: "800", fontSize: 14 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: { fontSize: 15, fontWeight: "300" },
  heading: { fontSize: 24, fontWeight: "800" },
  pulseContainer: { gap: 10 },
});
