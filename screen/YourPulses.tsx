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
import YourPulseCard from "../components/pulse/YourPulseCard";
import { Ionicons } from "@expo/vector-icons";

// Pulse service
import {
  subscribeMyPosts,
  fetchMore,
  togglePulse,
  deletePost,
  batchGetMyPulseStates,
  formatForCard,
  type PulseListPage,
} from "../services/pulse/pulse.service";

type HeaderComponentsProps = {
  totalCount: number;
  onCreatePulse: () => void;
  onViewAll: () => void;
};

const HeaderComponents: React.FC<HeaderComponentsProps> = ({
  totalCount,
  onCreatePulse,
  onViewAll,
}) => (
  <View style={styles.headerBlock}>
    <Text style={styles.headerText}>View or manage your</Text>
    <Text style={styles.headerText}>Pulses</Text>

    <Text style={styles.headerCount}>
      Total Active: <Text style={styles.headerCountStrong}>{totalCount}</Text>
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
        onPress={onViewAll}
        style={({ pressed }) => [
          styles.hBtnSecondary,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="albums" size={16} color="#518649" />
        <Text style={styles.hBtnSecondaryLabel}>View All</Text>
      </Pressable>
    </View>
  </View>
);

const BRAND_GREEN = "#518649";

const YourPulses = () => {
  const [user, setUser] = React.useState<any>(null);
  const navigation = useNavigation();

  // Realtime list + cursor (only my posts)
  const [items, setItems] = React.useState<any[]>([]);
  const [cursor, setCursor] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // My per-post pulse state (for button fill)
  const [myPulseMap, setMyPulseMap] = React.useState<Record<string, boolean>>(
    {}
  );

  const unsubRef = React.useRef<() => void>();

  // Load current user
  React.useEffect(() => {
    (async () => {
      const res = await GetCurrentUserData();
      if (res?.success) setUser(res.data);
    })();
  }, []);

  // Subscribe to my posts once user is known
  React.useEffect(() => {
    if (!user?.userId) return;
    setIsLoading(true);

    const unsub = subscribeMyPosts(
      { userId: user.userId, pageSize: 20 },
      (page: PulseListPage) => {
        setItems(page.items);
        setCursor(page.cursor);
        setIsLoading(false);
      },
      (err) => {
        console.warn("[subscribeMyPosts] error", err);
        setIsLoading(false);
        Alert.alert("Error", "Unable to load your pulses.");
      }
    );

    unsubRef.current = unsub;
    return () => {
      try {
        unsubRef.current?.();
      } catch {}
    };
  }, [user?.userId]);

  // Batch grab my pulse states for current list
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

  const totalCount = items.length;

  // Pagination
  const loadMore = async () => {
    if (!cursor || isLoadingMore || !user?.userId) return;
    try {
      setIsLoadingMore(true);
      const res = await fetchMore({
        authorId: user.userId, // your service can branch on this for "my posts"
        sort: "Recent",
        pageSize: 20,
        cursor,
      });
      if (res.success && res.data) {
        setItems((prev) => [...prev, ...res.data.items]);
        setCursor(res.data.cursor);
      } else {
        Alert.alert("Error", res.error ?? "Could not load more.");
      }
    } catch (e) {
      console.warn("[YourPulses.loadMore] error", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Toggle my pulse (optimistic)
  const onPressPulse = async (postId: string) => {
    if (!user?.userId) return;
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
      // pulseCount changes will stream via the realtime listener
    }
  };

  // Edit: navigate to CreatePulse with initialData prefilled
  const onEdit = (postId: string) => {
    const post = items.find((p) => p.id === postId);
    if (!post) return;
    const photoUrl = post.media?.photoUrl ?? undefined;

    // @ts-ignore
    navigation.navigate("CreatePulse", {
      initialData: {
        id: post.id,
        category: post.category,
        title: post.title,
        description: post.description ?? "",
        photoUrl,
      },
    });
  };

  // Delete with confirm
  const onDelete = (postId: string) => {
    Alert.alert("Delete Pulse", "Are you sure you want to delete this pulse?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await deletePost(postId);
          if (!res.success) {
            Alert.alert("Error", res.error ?? res.message ?? "Delete failed.");
          } else {
            // Realtime listener will remove it from the list
          }
        },
      },
    ]);
  };

  const renderCards = () => {
    return (
      <View style={styles.pulseContainer}>
        {items.map((post) => {
          const vm = formatForCard(post, myPulseMap);
          const displayTitle = `${vm.title}${
            typeof post.pulseCount === "number"
              ? ` - ${post.pulseCount} Pulses`
              : ""
          }`;

          return (
            <YourPulseCard
              key={vm.postId}
              postId={vm.postId}
              category={vm.category as any}
              title={displayTitle}
              description={vm.description}
              photoUrl={vm.photoUrl ?? undefined}
              authorName={user?.fullName}
              authorRole={undefined} // add if you store roles on user
              createdAt={(vm.createdAt?.toDate?.() ?? vm.createdAt) as any}
              isPulsedByMe={vm.isPulsedByMe}
              pulseCount={post.pulseCount}
              onPressPulse={() => onPressPulse(vm.postId)}
              onEdit={onEdit}
              onDelete={onDelete}
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
      />

      <AppContentGroup
        headerComponents={
          <HeaderComponents
            totalCount={totalCount}
            // @ts-ignore
            onCreatePulse={() => navigation.navigate("CreatePulse")}
            // @ts-ignore
            onViewAll={() => navigation.navigate("AllPulses")}
          />
        }
      >
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.subtitle}>Your Active</Text>
              <Text style={styles.heading}>Pulses</Text>
            </View>
            {isLoading && <ActivityIndicator />}
          </View>

          {isLoading ? <View /> : renderCards()}

          {/* Load more (if you have more pages) */}
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
              !isLoading && (
                <Text style={{ textAlign: "center", color: "#6B7280" }}>
                  You’re all caught up.
                </Text>
              )
            )}
          </View>
        </View>
      </AppContentGroup>
    </View>
  );
};

export default YourPulses;

const styles = StyleSheet.create({
  // Header area inside AppContentGroup (keeps left-aligned layout)
  headerBlock: { alignItems: "flex-start", gap: 8 },
  headerText: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
  },
  headerCount: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 2 },
  headerCountStrong: { fontWeight: "800" },
  headerButtonsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  hBtnPrimary: {
    backgroundColor: "#518649",
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
    borderColor: "#518649",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hBtnSecondaryLabel: { color: "#518649", fontWeight: "800", fontSize: 14 },

  // Section content
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
