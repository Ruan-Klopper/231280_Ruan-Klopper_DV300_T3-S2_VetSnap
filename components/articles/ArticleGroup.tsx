import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { globalStyles } from "../../global/styles";

type ArticleGroupProps = {
  viewType: string;
  isLoading?: boolean;
  children: React.ReactNode;
};

const ArticleGroup = ({
  viewType,
  isLoading = false,
  children,
}: ArticleGroupProps) => {
  return (
    <View
      style={[
        globalStyles.globalContentBlock,
        globalStyles.globalContentBlockPadding,
      ]}
    >
      {/* Only show heading if not loading */}
      {!isLoading && (
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Viewing</Text>
            <Text style={styles.heading}>{viewType}</Text>
          </View>
        </View>
      )}

      {/* Children container */}
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
};

export default ArticleGroup;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
});
