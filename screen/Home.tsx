import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import AppNavigation from "../components/global/AppNavigation";
import { globalStyles } from "../global/styles";
import ContentBlock from "../components/global/ContentBlock";
import SearchBar from "../components/global/SearchBar";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import QuickActions from "../components/home/QuickActions";
import ExploreArticles from "../components/home/ExploreArticles";
import PromotionalBlock from "../components/home/PromotionalBlock";

// Media and content
import promoImage1 from "../assets/images/vetsnap1.png";
import promoImage2 from "../assets/images/vetsnap2.png";
import { GetCurrentUserData } from "../services/auth/authService";

const HeaderComponents = () => {
  const [username, setUsername] = useState("Ruan");
  return (
    <>
      <Text style={styles.headerText}>Hey {username} 👋</Text>
      <Text
        style={[styles.headerText, { fontWeight: "800", marginBottom: 20 }]}
      >
        Ready to Explore!
      </Text>
      <SearchBar navigateOnFocus={true} />
    </>
  );
};

const Home = () => {
  const [user, setUser] = React.useState<any>(null);
  const navigation = useNavigation();

  React.useEffect(() => {
    (async () => {
      const res = await GetCurrentUserData();
      if (res.success) {
        setUser(res.data);
      }
    })();
  }, []);
  return (
    <View style={globalStyles.root}>
      {/* Header */}
      <AppHeader
        title="VetSnap"
        userAvatarUrl={user?.photoURL}
        userName={user?.fullName}
        onProfilePress={() => navigation.navigate("Chat")}
      />

      {/* Content Area */}
      <AppContentGroup
        headerBackground={{ type: "color", value: "#518649" }}
        headerComponents={<HeaderComponents />}
      >
        <QuickActions />
        <ExploreArticles />
        <PromotionalBlock
          title="Talk to Veterinarian"
          image="../assets/images/vetsnap2.png"
        />

        <PromotionalBlock
          title="Get Full access to all resources"
          image="../assets/images/vetsnap2.png"
        />
      </AppContentGroup>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
  },
  quickActionItemsContainer: {
    // Must display the items in a 2x2 grid
  },
  quickActionItems: {
    width: "auto", // Must play with the 2x2 grid
    height: 100,
    borderRadius: 12,
    backgroundColor: "#518649",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 14,
  },
  quickActionItemsText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});
