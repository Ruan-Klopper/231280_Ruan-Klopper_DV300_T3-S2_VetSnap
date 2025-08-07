import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import AppNavigation from "../components/global/AppNavigation";
import SectionBlock from "../components/articleComponent/SectionBlock";

const HeaderComponents = () => {
  const articleTitle = "Chapter 15: Amoebic infections";
  const author = "J J VAN DER LUGT";
  const categories = ["Muscidae", "Stomoxyinae", "Fanniinae"];

  return (
    <View style={styles.headerWrapper}>
      {/* Category Chips */}
      <View style={styles.categoryWrapper}>
        {categories.map((cat, idx) => (
          <View key={idx} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{cat}</Text>
          </View>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.title}>{articleTitle}</Text>

      {/* Author */}
      <Text style={styles.author}>
        By: <Text style={styles.authorName}>{author}</Text>
      </Text>
    </View>
  );
};

const ArticleSingleView = () => {
  const cropTitleByX = (title: string): string => {
    const xCount = 14;
    const cropLength = xCount > 0 ? xCount : title.length;
    return title.length > cropLength
      ? title.slice(0, cropLength) + "..."
      : title;
  };

  const [articleTitle, setArticleTitle] = useState(
    "Chapter 15: Amoebic infections"
  );
  return (
    <View style={globalStyles.root}>
      {/* Header */}
      <AppHeader
        variant={3}
        title={cropTitleByX(articleTitle)}
        articleId={"123"}
      />

      {/* Content Area */}
      <AppContentGroup
        headerBackground={{
          type: "image",
          value:
            "https://upload.wikimedia.org/wikipedia/commons/9/92/Male_cheetah_facing_left_in_South_Africa.jpg",
        }}
        headerComponents={<HeaderComponents />}
      >
        <SectionBlock
          type="text"
          title="Lifecycle of Amoebas"
          content={[
            {
              _type: "block",
              children: [
                {
                  _type: "span",
                  text: "Amoebas reproduce asexually through a process known as binary fission. ",
                },
                {
                  _type: "span",
                  marks: ["strong"],
                  text: "This allows a single cell to split and form two identical daughter cells.",
                },
              ],
            },
            {
              _type: "block",
              children: [
                {
                  _type: "span",
                  text: "This process occurs under favorable environmental conditions, such as optimal temperature and moisture.",
                },
              ],
            },
            {
              _type: "block",
              children: [
                {
                  _type: "span",
                  text: "In some species, ",
                },
                {
                  _type: "span",
                  marks: ["em"],
                  text: "encystment",
                },
                {
                  _type: "span",
                  text: " may occur — a survival strategy where the amoeba becomes dormant and forms a protective wall.",
                },
              ],
            },
            {
              _type: "block",
              children: [
                {
                  _type: "span",
                  text: "During this phase, the organism can endure harsh environments for extended periods.",
                },
              ],
            },
            {
              _type: "block",
              children: [
                {
                  _type: "span",
                  marks: ["strong", "em"],
                  text: "Important: ",
                },
                {
                  _type: "span",
                  text: "Pathogenic amoebas such as Entamoeba histolytica can cause serious diseases in humans.",
                },
              ],
            },
          ]}
        />

        <SectionBlock
          type="image"
          title="Example of Amoebic Structure"
          imageUrl="https://hips.hearstapps.com/hmg-prod/images/headshot-of-giraffe-sabi-sands-game-reserve-royalty-free-image-1573571198.jpg?crop=1.00xw:0.667xh;0,0.0760xh&resize=980:*"
        />

        <SectionBlock
          type="reference"
          title="References"
          content={[
            "Smith et al. (2020). Parasitology Review. Vol. 18, pp. 45–59.",
            "Van der Lugt J.J. (2021). Pathogen Atlas: Protozoa. Medical Science Press.",
            "WHO (2019). Guidelines on Waterborne Amoebas. World Health Organization.",
            "Gonzalez, R. & Chen, M. (2018). Protozoan Life Cycles. Journal of Microbial Research.",
          ]}
        />
      </AppContentGroup>
    </View>
  );
};

export default ArticleSingleView;

const styles = StyleSheet.create({
  headerWrapper: {
    gap: 15,
  },
  categoryWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  categoryChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 2,
    borderRadius: 100,
  },
  categoryText: {
    color: "#4A7C59",
    fontWeight: "900",
    fontSize: 14,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    lineHeight: 42,
  },
  author: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  authorName: {
    fontWeight: "800",
  },
});
