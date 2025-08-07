import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View, StyleSheet, Text } from "react-native";
import { useTab } from "../global/TabContext";
import { globalStyles } from "../../global/styles";

const QuickActions = () => {
  const navigation = useNavigation();
  const { setActiveTab } = useTab();

  return (
    <View
      style={[
        styles.container,
        globalStyles.globalContentBlock,
        globalStyles.globalContentBlockPadding,
      ]}
    >
      <Text style={styles.title}>Quick actions</Text>
      <View style={styles.grid}>
        <Pressable
          style={styles.item}
          onPress={() => navigation.navigate("Chat" as never)}
        >
          <Ionicons name="chatbubbles" size={24} color="white" />
          <Text style={styles.text}>Talk to a Veterinarian</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setActiveTab("book")}>
          <Ionicons name="book" size={24} color="white" />
          <Text style={styles.text}>Explore Resources</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setActiveTab("profile")}>
          <Ionicons name="bookmark" size={24} color="white" />
          <Text style={styles.text}>See your saved Articles</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setActiveTab("profile")}>
          <Ionicons name="person-circle" size={24} color="white" />
          <Text style={styles.text}>Access your Profile</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default QuickActions;

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 24,
    marginBottom: 12,
    fontWeight: "900",
    color: "#518649",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    width: "48%",
    height: 100,
    borderRadius: 12,
    backgroundColor: "#518649",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 14,
    marginBottom: 12,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
