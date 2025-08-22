import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert } from "react-native";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import AppNavigation from "../components/global/AppNavigation";
import SearchBar from "../components/global/SearchBar";
import NewChatItem from "../components/chats/NewChatItem";
import ChatItem from "../components/chats/ChatItem";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Auth
import { GetCurrentUserData } from "../services/auth/authService";

// Chat services (import directly; or export from a barrel if you prefer)
// Chat services
import {
  listenToConversations,
  getOrCreateConversation,
  markConversationRead,
} from "../services/chat/conversations.service";

// Users
import { listVets } from "../services/user/user.service";

// Presence (optional; types only used defensively)
import {
  listenToManyPresence,
  type UserPresenceDoc,
} from "../services/chat/presence.service";

import type { AppUser } from "../interfaces/user";
import type { Conversation } from "../interfaces/chat";

type RootStackParamList = {
  Chat: {
    conversationId: string;
    otherUserId?: string;
    otherUserName?: string;
    otherUserAvatar?: string;
  };
  // ...other screens
};

const AllChats: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // ----- local state
  const [me, setMe] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState<Map<string, AppUser>>(new Map());

  // Vets (for non‑vet users)
  const [vetQuery, setVetQuery] = useState("");
  const [vets, setVets] = useState<AppUser[]>([]);
  const vetsLoading = useRef(false);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const convUnsub = useRef<(() => void) | null>(null);

  // Presence map (userId -> { online, lastSeen })
  // Presence map (userId -> presence doc or null)
  const [presenceMap, setPresenceMap] = useState<
    Map<string, UserPresenceDoc | null>
  >(new Map());
  const presenceUnsub = useRef<(() => void) | null>(null);

  // ----- bootstrap: get current user
  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await GetCurrentUserData();
      if (!mounted) return;

      if (!res.success || !res.data) {
        Alert.alert("Auth", res.message || "Failed to load user");
        setLoading(false);
        return;
      }
      setMe(res.data);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ----- load vets (for non‑vet users)
  useEffect(() => {
    if (!me || me.role === "vet") return;

    let mounted = true;
    const run = async () => {
      try {
        vetsLoading.current = true;
        const res = await listVets(vetQuery);
        if (!mounted) return;

        if (!res.success || !res.data) {
          // silently ignore and keep old state
          return;
        }
        setVets(res.data);
      } finally {
        vetsLoading.current = false;
      }
    };

    // Debounce a bit for search UX
    const t = setTimeout(run, 150);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [me, vetQuery]);

  // ----- listen to my conversations (real‑time)
  useEffect(() => {
    if (!me) return;

    // cleanup any existing
    if (convUnsub.current) {
      convUnsub.current();
      convUnsub.current = null;
    }

    const res = listenToConversations(me.userId, (convos) => {
      setConversations(convos || []);
    });

    if (res.success && res.data) {
      convUnsub.current = res.data;
    }

    return () => {
      if (convUnsub.current) {
        convUnsub.current();
        convUnsub.current = null;
      }
    };
  }, [me]);

  // ----- presence for visible vets (optional; safe to keep if presence is enabled)
  useEffect(() => {
    if (!me) return;

    // We want presence for:
    // - the vets list (non‑vet users)
    // - the other party in each conversation
    const targetIds = new Set<string>();

    if (me.role !== "vet") {
      vets.forEach((v) => targetIds.add(v.userId));
    }

    conversations.forEach((c) => {
      (c.members as string[]).forEach((m) => {
        if (m !== me.userId) targetIds.add(m);
      });
    });

    // tear down previous
    if (presenceUnsub.current) {
      presenceUnsub.current();
      presenceUnsub.current = null;
    }

    if (targetIds.size === 0) {
      setPresenceMap(new Map());
      return;
    }

    const res = listenToManyPresence(Array.from(targetIds), (map) => {
      setPresenceMap(map);
    });

    if (res.success && res.data) {
      presenceUnsub.current = res.data;
    }

    return () => {
      if (presenceUnsub.current) {
        presenceUnsub.current();
        presenceUnsub.current = null;
      }
    };
  }, [me, vets, conversations]);

  // ----- helpers
  const myRole = me?.role;
  const isVet = myRole === "vet";

  const hasConversations = conversations && conversations.length > 0;

  const getUnreadFor = (c: Conversation, uid: string) =>
    ((c as any)?.unread?.[uid] ?? 0) as number;

  const unreadConversations = useMemo(() => {
    if (!me) return [];
    return conversations.filter((c) => getUnreadFor(c, me.userId) > 0);
  }, [conversations, me]);

  const readConversations = useMemo(() => {
    if (!me) return [];
    return conversations.filter((c) => getUnreadFor(c, me.userId) === 0);
  }, [conversations, me]);

  const handleStartChat = async (vetId: string) => {
    const res = await getOrCreateConversation(vetId);
    if (!res.success || !res.data) {
      Alert.alert("Chat", res.message || "Could not start chat");
      return;
    }

    // Optional hints for header
    const vet = vets.find((v) => v.userId === vetId);

    try {
      // @ts-ignore
      navigation.navigate("Chat", {
        conversationId: res.data.id,
        otherUserId: vetId,
        otherUserName: vet?.fullName,
        otherUserAvatar: vet?.photoURL ?? undefined,
      });
    } catch {
      // no-op
    }
  };

  const handleOpenConversation = async (conv: Conversation) => {
    await markConversationRead(conv.id);

    const otherId =
      (conv.members as string[]).find((m) => m !== me?.userId) || "";

    // Optional hints for header (works for non‑vet users where vets[] is loaded)
    const hint = vets.find((v) => v.userId === otherId);

    try {
      // @ts-ignore
      console.log("opening");
      console.log(conv.id);

      navigation.navigate("Chat", {
        conversationId: conv.id,
        otherUserId: otherId,
        otherUserName: hint?.fullName,
        otherUserAvatar: hint?.photoURL ?? undefined,
      });
    } catch {
      // no-op
    }
  };

  // Get the "other" participant id for a conversation
  const getOtherId = (c: Conversation, myId: string) =>
    (c.members as string[]).find((m) => m !== myId) || "";

  // Resolve name & avatar from vets list first, then from cache, otherwise fallback
  const getDisplayForUser = useCallback(
    (uid: string): { name: string; avatarUrl: string } => {
      const vet = vets.find((v) => v.userId === uid);
      if (vet) return { name: vet.fullName, avatarUrl: vet.photoURL ?? "" };

      const cached = userCache.get(uid);
      if (cached)
        return { name: cached.fullName, avatarUrl: cached.photoURL ?? "" };

      return { name: "Conversation", avatarUrl: "" };
    },
    [vets, userCache]
  );

  useEffect(() => {
    if (!me) return;

    // collect all other participant ids
    const ids = new Set<string>();
    conversations.forEach((c) => {
      const other = getOtherId(c, me.userId);
      if (other) ids.add(other);
    });

    // exclude any we already have from vets or cache
    const alreadyHave = new Set<string>([
      ...vets.map((v) => v.userId),
      ...Array.from(userCache.keys()),
    ]);
    const toFetch = Array.from(ids).filter((id) => !alreadyHave.has(id));
    if (toFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        // Lazy import to avoid circular deps if any
        const { getUserById } = await import("../services/user/user.service");
        const results = await Promise.all(toFetch.map((id) => getUserById(id)));
        const next = new Map(userCache);
        results.forEach((res, i) => {
          if (res.success && res.data) {
            next.set(toFetch[i], res.data);
          }
        });
        if (!cancelled) setUserCache(next);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, conversations, vets, userCache]);

  // ----- Render
  if (loading) {
    return (
      <View
        style={[
          globalStyles.root,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={globalStyles.root}>
      <AppHeader variant={2} title="Chats" />

      <AppContentGroup
        headerBackground={{ type: "color", value: "#518649" }}
        headerComponents={
          <HeaderComponents
            enabled={!isVet}
            query={vetQuery}
            onChangeQuery={setVetQuery}
          />
        }
      >
        {/* Non‑vet users can start a new chat */}
        {!isVet && (
          <View
            style={[
              globalStyles.globalContentBlock,
              globalStyles.globalContentBlockPadding,
            ]}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.subtitle}>Start a new chat</Text>
                <Text style={styles.heading}>Available Veterinarians</Text>
              </View>
            </View>

            {/* Vet list (from Firestore) */}
            <View style={styles.chatItemContainer}>
              {vets.length === 0 ? (
                <Text style={{ opacity: 0.6 }}>No veterinarians found.</Text>
              ) : (
                vets.map((v) => {
                  const pres = presenceMap.get(v.userId);
                  return (
                    <NewChatItem
                      key={v.userId}
                      name={v.fullName}
                      position={v.vetProfile?.clinicName || "Veterinarian"}
                      imageUrl={v.photoURL ?? ""} // ensure string
                      onPress={() => handleStartChat(v.userId)}
                    />
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* Conversations sections */}
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Your chats</Text>
              <Text style={styles.heading}>Unread messages</Text>
            </View>
          </View>

          <View style={styles.chatItemContainer}>
            {unreadConversations.length === 0 ? (
              <Text style={{ opacity: 0.6 }}>No unread messages.</Text>
            ) : (
              unreadConversations.map((c) => {
                const otherId =
                  (c.members as string[]).find((m) => m !== me?.userId) || "";

                const lastText =
                  c.lastMessage?.text ||
                  (c.lastMessage?.imageUrl ? "📷 Image" : "");
                const time = "13:11"; // format if you want
                const { name, avatarUrl } = getDisplayForUser(otherId);

                return (
                  <ChatItem
                    key={c.id}
                    name={name}
                    time={time}
                    message={lastText}
                    avatarUrl={avatarUrl}
                    isUnread={true}
                    onPress={() => handleOpenConversation(c)}
                  />
                );
              })
            )}
          </View>
        </View>

        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Your chats</Text>
              <Text style={styles.heading}>All Chats</Text>
            </View>
          </View>

          <View style={styles.chatItemContainer}>
            {!hasConversations ? (
              <Text style={{ opacity: 0.6 }}>You have no current chats.</Text>
            ) : (
              readConversations.map((c) => {
                const otherId =
                  (c.members as string[]).find((m) => m !== me?.userId) || "";

                const lastText =
                  c.lastMessage?.text ||
                  (c.lastMessage?.imageUrl ? "📷 Image" : "");
                const time = "03:00"; // format if you want
                const { name, avatarUrl } = getDisplayForUser(otherId);

                return (
                  <ChatItem
                    key={c.id}
                    name={name}
                    time={time}
                    message={lastText}
                    avatarUrl={avatarUrl}
                    isUnread={false}
                    onPress={() => handleOpenConversation(c)}
                  />
                );
              })
            )}
          </View>
        </View>
      </AppContentGroup>
    </View>
  );
};

export default AllChats;

// ----- header subcomponent (now controlled)
const HeaderComponents: React.FC<{
  enabled: boolean;
  query: string;
  onChangeQuery: (v: string) => void;
}> = ({ enabled, query, onChangeQuery }) => {
  return (
    <>
      <Text
        style={[styles.headerText, { fontWeight: "800", marginBottom: 20 }]}
      >
        Talk to a Veterinarian
      </Text>
      {enabled ? (
        <SearchBar
          value={query}
          onChangeText={onChangeQuery}
          onSearch={onChangeQuery}
        />
      ) : (
        <Text style={{ color: "white", opacity: 0.9 }}>
          You are signed in as a Veterinarian — you will receive chats from
          users.
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
  chatItemContainer: {
    gap: 10,
  },
});
