import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { globalStyles } from "../global/styles";
import AppContentGroup from "../components/global/AppContentGroup";
import AppHeader from "../components/global/AppHeader";
import AppNavigation from "../components/global/AppNavigation";
import ContentBlock from "../components/global/ContentBlock";
import SearchBar from "../components/global/SearchBar";
import { useNavigation } from "@react-navigation/native";

const HeaderComponents = () => {
  const [query, setQuery] = useState("");
  return (
    <>
      <Text
        style={[styles.headerText, { fontWeight: "800", marginBottom: 20 }]}
      >
        Search for an article
      </Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSearch={(q) => console.log("Searching for:", q)}
      />
    </>
  );
};

const Search = () => {
  const navigation = useNavigation();
  return (
    <View style={globalStyles.root}>
      {/* Header */}
      <AppHeader variant={1} title="Search" />

      {/* Content Area */}
      <AppContentGroup
        headerBackground={{ type: "color", value: "#518649" }}
        headerComponents={<HeaderComponents />}
      >
        <ContentBlock
          onPress={() => navigation.navigate("ArticleSingleView")}
        />
        <ContentBlock />
        <ContentBlock />
        <ContentBlock />
        <ContentBlock />
      </AppContentGroup>
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
  },
});
