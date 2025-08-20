// /navigation/MainTabs.tsx (or wherever this file lives)
import React, { useState } from "react";
import { View } from "react-native";
import Home from "../screen/Home";
import Search from "../screen/Search";
import BrowseArticles from "../screen/BrowseArticles";
import AllChats from "../screen/AllChats";
import UserProfile from "../screen/UserProfile";
import AllPulses from "../screen/AllPulses";
import AppNavigation from "../components/global/AppNavigation";
import { TabContext, TabKey } from "../components/global/TabContext";

const screens: Record<TabKey, React.ComponentType<any>> = {
  home: Home,
  book: BrowseArticles,
  pulse: AllPulses, // 👈 NEW: Pulse page
  chat: AllChats,
  profile: UserProfile,
  search: Search, // (kept for completeness; not in bottom bar by default)
};

export const MainTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const ActiveScreen = screens[activeTab];

  // 👇 Make Pulse a root screen so the back button hides on it
  const rootScreens: TabKey[] = ["home", "book", "pulse", "chat", "profile"];
  const showBackButton = !rootScreens.includes(activeTab);

  return (
    <TabContext.Provider value={{ setActiveTab }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          pointerEvents="box-none"
        >
          <AppNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </View>
    </TabContext.Provider>
  );
};
