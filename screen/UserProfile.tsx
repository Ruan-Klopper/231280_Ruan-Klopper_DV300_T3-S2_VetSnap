import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import LoadingIndicator from "../components/global/LoadingIndicator";
import {
  DeleteAccount,
  GetCurrentUserData,
  Logout,
  UpdateOwnProfile,
} from "../services/auth/authService";

const UserProfile = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // ✅ new state

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dirty, setDirty] = useState(false);

  const [chatNotifs, setChatNotifs] = useState(false);
  const [marketingNotifs, setMarketingNotifs] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await GetCurrentUserData();
      if (res.success) {
        const u = res.data;
        setUser(u);
        setFullName(u.fullName);
        setEmail(u.email);
        setChatNotifs(u.preferences?.notifications?.chat ?? false);
        setMarketingNotifs(u.preferences?.notifications?.marketing ?? false);
      }
      setIsLoading(false);
    })();
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true); // start spinner
    try {
      const res = await UpdateOwnProfile({ fullName });
      if (res.success) {
        setUser(res.data);
        setDirty(false);
        alert("Profile updated!");
      } else {
        alert("Update failed: " + res.message);
      }
    } finally {
      setIsUpdating(false); // stop spinner
    }
  };

  if (isLoading) {
    return (
      <View style={[globalStyles.root, { justifyContent: "center" }]}>
        <LoadingIndicator progress={50} message="Loading profile..." />
      </View>
    );
  }

  return (
    <View style={globalStyles.root}>
      {/* ✅ Header */}
      <AppHeader variant={2} title="Profile" />

      <ScrollView>
        <AppContentGroup
          headerBackground={{
            type: "image",
            value: user?.photoURL,
          }}
          headerComponents={
            <View style={styles.profileCard}>
              <Image
                source={{ uri: user?.photoURL }}
                style={styles.profileImage}
              />
              <Text style={styles.headerText}>{user?.fullName}</Text>
              <Text style={styles.headerSubText}>{user?.role}</Text>
            </View>
          }
        >
          <View style={{ gap: 12 }}>
            {/* 🔹 Saved Articles: To be implemented in the future */}
            {/* <View
              style={[
                globalStyles.globalContentBlock,
                globalStyles.globalContentBlockPadding,
              ]}
            >
              <Text style={styles.cardTitle}>Saved Articles</Text>
              <Text style={styles.cardHint}>Coming soon...</Text>
            </View> */}

            {/* 🔹 Personal Info */}
            <View
              style={[
                globalStyles.globalContentBlock,
                globalStyles.globalContentBlockPadding,
              ]}
            >
              <Text style={styles.cardTitle}>Personal Info</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={(txt) => {
                    setFullName(txt);
                    setDirty(true);
                  }}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  editable={false} // keep immutable
                  style={[styles.input, { backgroundColor: "#EEE" }]}
                />
              </View>

              {dirty && (
                <Pressable
                  style={[styles.updateBtn, isUpdating && { opacity: 0.6 }]}
                  onPress={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <LoadingIndicator progress={50} message="Updating..." />
                  ) : (
                    <Text style={styles.updateBtnText}>Update Profile</Text>
                  )}
                </Pressable>
              )}
            </View>

            {/* 🔹 Settings */}
            <View
              style={[
                globalStyles.globalContentBlock,
                globalStyles.globalContentBlockPadding,
              ]}
            >
              <Text style={styles.cardTitle}>Settings</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Chat Notifications</Text>
                <Switch value={chatNotifs} onValueChange={setChatNotifs} />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Marketing Notifications</Text>
                <Switch
                  value={marketingNotifs}
                  onValueChange={setMarketingNotifs}
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Theme</Text>
                <Text style={styles.valueText}>{user?.preferences?.theme}</Text>
              </View>

              {/* Actions */}
              <Pressable style={styles.optionBtn}>
                <Text style={styles.optionBtnText}>Clear Saved History</Text>
              </Pressable>
              <Pressable style={styles.optionBtn}>
                <Text style={styles.optionBtnText}>Manage Payments</Text>
              </Pressable>
              <Pressable
                style={[styles.optionBtn, { backgroundColor: "#F2F2F2" }]}
                onPress={async () => {
                  await Logout();
                  navigation.replace("Login");
                }}
              >
                <Text style={[styles.optionBtnText, { color: "#444" }]}>
                  Log out of Anipedia
                </Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={async () => {
                  const res = await DeleteAccount();
                  if (res.success) {
                    navigation.replace("Login");
                  } else {
                    alert("Failed to delete account: " + res.message);
                  }
                }}
              >
                <Text style={styles.deleteBtnText}>Delete Account</Text>
              </Pressable>
            </View>
          </View>
        </AppContentGroup>
      </ScrollView>
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerText: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
  },
  headerSubText: {
    color: "#D9E7D5",
    fontSize: 16,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
  cardHint: {
    color: "#777",
    fontSize: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#888",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F9F9F6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  settingLabel: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  valueText: {
    fontWeight: "600",
    color: "#444",
  },
  optionBtn: {
    backgroundColor: "#F9F9F6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  optionBtnText: {
    color: "#4A8C2C",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#FFE5D9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  deleteBtnText: {
    color: "#C0392B",
    fontWeight: "700",
    fontSize: 15,
  },
  updateBtn: {
    marginTop: 10,
    backgroundColor: "#4A8C2C",
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  updateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
