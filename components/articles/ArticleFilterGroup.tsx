import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { globalStyles } from "../../global/styles";
import { Ionicons } from "@expo/vector-icons";

const allFilters = [
  "Tabanidae",
  "Horse flies",
  "mechanical transmission",
  "Trypanosomiasis",
  "Blood-sucking insects",
  "Diptera",
  "Anthropods",
  "Larvae",
  "Zoonotic vectors",
  "Parasites",
];

const ITEMS_TO_SHOW = 6;

const ArticleFilterGroup = () => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_TO_SHOW);

  const visibleFilters = allFilters.slice(0, visibleCount);

  const handleViewMore = () => {
    setVisibleCount(allFilters.length);
  };

  const handleShowLess = () => {
    setVisibleCount(ITEMS_TO_SHOW);
  };

  return (
    <View
      style={[
        globalStyles.globalContentBlock,
        globalStyles.globalContentBlockPadding,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Filter by</Text>
          <Text style={styles.heading}>Keywords</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {visibleFilters.map((filter, index) => (
          <TouchableOpacity key={index} style={styles.filterCard}>
            <Ionicons name="bug-outline" size={24} color="white" />
            <Text style={styles.filterText} numberOfLines={2}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={
          visibleCount < allFilters.length ? handleViewMore : handleShowLess
        }
      >
        <Text style={styles.viewMore}>
          {visibleCount < allFilters.length ? "view more" : "show less"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ArticleFilterGroup;

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
    color: "#4A7C59",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4A7C59",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  filterCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#4A7C59",
    borderRadius: 16,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  filterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  viewMore: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
