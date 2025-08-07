import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { globalStyles } from "../../global/styles";

const ContentBlock = ({ onPress }: { onPress?: () => void }) => {
  return (
    <Pressable
      style={[
        globalStyles.globalContentBlock,
        globalStyles.globalContentBlockPadding,
      ]}
      onPress={onPress}
    >
      <Text style={styles.title}>Big Title</Text>
      <Text style={styles.subtitle}>Small subtitle</Text>
      <Text style={styles.description}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vel
        sapien vitae velit viverra facilisis. Fusce malesuada, nulla sed
        facilisis sagittis, sapien nisl fermentum augue, sit amet suscipit
        lectus augue in justo.
      </Text>
      {/* Sample images */}
    </Pressable>
  );
};

export default ContentBlock;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
});
