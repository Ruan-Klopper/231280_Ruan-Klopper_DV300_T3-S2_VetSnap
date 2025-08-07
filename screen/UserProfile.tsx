import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Switch,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import AppNavigation from "../components/global/AppNavigation";
import LoadingIndicator from "../components/global/LoadingIndicator";
import ArticleGroup from "../components/articles/ArticleGroup";
import ArticleItem from "../components/articles/ArticleItem";

const articles = [
  {
    id: "1",
    title: "Chapter 15: Amoebic infections",
    categories: ["Muscidae", "Stomoxyinae", "Fanniinae"],
    image:
      "https://media.wired.com/photos/593261cab8eb31692072f129/3:2/w_2560%2Cc_limit/85120553.jpg",
  },
  {
    id: "2",
    title: "Chapter 16: Viral infections",
    categories: ["Retroviridae", "Flaviviridae"],
    image:
      "https://www.worldanimalprotection.org/cdn-cgi/image/width=1920,format=auto/globalassets/images/elephants/1033551-elephant.jpg",
  },
  {
    id: "3",
    title: "Chapter 17: Bacterial infections",
    categories: ["Bacillaceae", "Enterobacteriaceae"],
    image:
      "https://www.aaha.org/wp-content/uploads/2024/03/b5e516f1655346558958c939e85de37a.jpg",
  },
];

const HeaderComponents = () => {
  const [username, setUsername] = useState("Ruan Klopper");
  const [role, setRole] = useState("Student");
  return (
    <>
      <Text style={[styles.headerText]}>{username}</Text>
      <Text style={styles.headerSubText}>{role}</Text>
    </>
  );
};

const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timeout); // cleanup
  }, []);

  return (
    <View style={globalStyles.root}>
      {/* Header */}
      <AppHeader variant={2} title="Your profile 1" />

      {/* Content Area */}
      <AppContentGroup headerComponents={<HeaderComponents />}>
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>See your</Text>
              <Text style={styles.heading}>Saved Articles</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {isLoading ? (
              <LoadingIndicator progress={42} message="Loading articles..." />
            ) : (
              articles.map((item) => (
                <ArticleItem
                  key={item.id}
                  title={item.title}
                  categories={item.categories}
                  image={item.image}
                />
              ))
            )}
            {/* Add view more, to view more than 3 */}
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
              <Text style={styles.subtitle}>View or Change</Text>
              <Text style={styles.heading}>Personal Particulars</Text>
            </View>
          </View>
          <View style={styles.block}>
            <TextInput
              value="Ruan Klopper"
              editable={false}
              style={styles.input}
              placeholderTextColor="#A5CE67"
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              value="231280@virtualwindow.co.za"
              editable={false}
              style={styles.input}
              placeholderTextColor="#A5CE67"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              value="Hidden"
              secureTextEntry={true}
              editable={false}
              style={styles.input}
              placeholderTextColor="#A5CE67"
            />
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
              <Text style={styles.subtitle}>View or Change</Text>
              <Text style={styles.heading}>Settings</Text>
            </View>
          </View>
          <View style={styles.block}>
            {[
              { label: "Receive push emails", color: "#D1D1D1" },
              { label: "Other setting", color: "#D1D1D1" },
              { label: "Other setting", color: "#D1D1D1" },
              { label: "Other setting", color: "#D1D1D1" },
              { label: "Other setting", color: "#FFA24D" },
            ].map((setting, index) => (
              <View key={index} style={styles.settingRow}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                <View
                  style={[
                    styles.toggleIndicator,
                    { backgroundColor: setting.color },
                  ]}
                />
              </View>
            ))}

            <Pressable style={styles.optionBtn}>
              <Text style={styles.optionBtnText}>Clear saved history</Text>
            </Pressable>
            <Pressable style={styles.optionBtn}>
              <Text style={styles.optionBtnText}>Manage Payments</Text>
            </Pressable>
            <Pressable
              style={[styles.optionBtn, { backgroundColor: "#EAEAEA" }]}
            >
              <Text style={[styles.optionBtnText]}>Log out of VetSnap</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete account</Text>
            </Pressable>
          </View>
        </View>
      </AppContentGroup>
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
  },
  headerSubText: {
    color: "white",
    fontSize: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  block: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F9F9F6",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    color: "#A5CE67",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  settingLabel: {
    color: "#9AC341",
    fontSize: 16,
  },
  toggleIndicator: {
    width: 40,
    height: 20,
    borderRadius: 12,
  },
  optionBtn: {
    backgroundColor: "#F9F9F6",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  optionBtnText: {
    color: "#9AC341",
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: "#FFD69F",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  deleteBtnText: {
    color: "#9AC341",
    fontWeight: "600",
    fontSize: 16,
  },
});
