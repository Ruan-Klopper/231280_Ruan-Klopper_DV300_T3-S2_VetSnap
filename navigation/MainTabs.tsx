import React, { useState } from "react";
import { View } from "react-native";
import Home from "../screen/Home";
import Search from "../screen/Search";
import BrowseArticles from "../screen/BrowseArticles";
import AllChats from "../screen/AllChats";
import UserProfile from "../screen/UserProfile";
import AppNavigation from "../components/global/AppNavigation";
import { TabContext, TabKey } from "../components/global/TabContext";

const screens = {
  home: Home,
  search: Search,
  book: BrowseArticles,
  chat: AllChats,
  profile: UserProfile,
};

export const MainTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  console.log("CURRENT", activeTab);

  const ActiveScreen = screens[activeTab];
  console.log(ActiveScreen);

  const rootScreens: TabKey[] = ["home", "search", "book", "chat", "profile"];
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
