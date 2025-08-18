import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as ImagePicker from "expo-image-picker";
import {
  SignUpUser,
  SignInOrUpWithGoogle,
  UploadAndSetProfilePhoto,
} from "../services/auth/authService";
// ↑ uncomment UploadAndSetProfilePhoto if you want to auto-upload after signup

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
WebBrowser.maybeCompleteAuthSession();

const roles = ["farmer", "student", "paravet", "vet"] as const;
type Role = (typeof roles)[number];

const SignUp = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Vet details
  const [clinicName, setClinicName] = useState("");
  const [practiceId, setPracticeId] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [bio, setBio] = useState("");

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const navigation = useNavigation();

  const handleRoleSelect = (r: Role) => {
    LayoutAnimation.easeInEaseOut();
    setRole(r);
  };

  const onPickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Allow photo library access to add a profile image."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // enables native crop UI
      aspect: [1, 1], // 1:1 crop
      quality: 0.9,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onEmailSignUp = async () => {
    if (!role)
      return Alert.alert(
        "Choose a role",
        "Please select your role before continuing."
      );
    if (!fullName || !email || !password) {
      return Alert.alert(
        "Missing info",
        "Full name, email and password are required."
      );
    }

    try {
      setLoading(true);

      // Build vetProfile only if role === 'vet'
      const vetProfile =
        role === "vet"
          ? {
              specialties: specialties
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              clinicName: clinicName || undefined,
              practiceId: practiceId || undefined,
              bio: bio || undefined,
            }
          : undefined;

      // 👉 Pass imageUri into SignUpUser
      const res = await SignUpUser({
        email,
        password,
        fullName,
        role,
        vetProfile,
        imageUri: imageUri ?? undefined,
      });

      if (!res.success) {
        return Alert.alert("Sign up failed", res.error ?? res.message);
      }

      // Navigation is handled by your onAuthStateChanged in App.tsx
    } catch (e: any) {
      Alert.alert("Sign up error", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUp = async () => {
    if (!role)
      return Alert.alert(
        "Choose a role",
        "Please select your role before using Google."
      );
    try {
      setGLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const discovery = {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      };

      const params = {
        clientId: "<YOUR_GOOGLE_OAUTH_CLIENT_ID>",
        redirectUri,
        responseType: "id_token",
        scopes: ["openid", "email", "profile"],
        extraParams: { nonce: Math.random().toString(36).slice(2) },
      };

      const authUrl =
        `${discovery.authorizationEndpoint}` +
        `?client_id=${encodeURIComponent(params.clientId)}` +
        `&redirect_uri=${encodeURIComponent(params.redirectUri)}` +
        `&response_type=${encodeURIComponent(params.responseType)}` +
        `&scope=${encodeURIComponent(params.scopes.join(" "))}` +
        `&nonce=${encodeURIComponent(params.extraParams.nonce)}`;

      const result = await AuthSession.startAsync({ authUrl });
      if (result.type !== "success" || !result.params?.id_token) return;

      const api = await SignInOrUpWithGoogle({
        idToken: result.params.id_token as string,
      });
      if (!api.success)
        return Alert.alert("Google sign-in failed", api.error ?? api.message);

      // (Optional) You can handle image upload post-google sign-in similarly if desired
    } catch (e: any) {
      Alert.alert("Google sign-in error", e?.message ?? "Unknown error");
    } finally {
      setGLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require("../assets/logos/VetSnapLogo.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.appName}>VetSnap</Text>

        {/* STEP 1: Role Selection */}
        <Text style={styles.label}>Select your role</Text>
        <View style={styles.rolesWrapper}>
          {roles.map((r) => (
            <Pressable
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => handleRoleSelect(r)}
            >
              <Text
                style={[styles.roleText, role === r && styles.roleTextActive]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* STEP 2: Account Info (shown only if role is selected) */}
        {role && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Create your account</Text>

            {/* Avatar picker */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Pressable onPress={onPickImage} style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "#E6F7D9",
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: "#73C860",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Ionicons name="camera" size={28} color="#73C860" />
                  )}
                </View>
                <Text
                  style={{
                    color: "#73C860",
                    marginTop: 8,
                    textDecorationLine: "underline",
                  }}
                >
                  {imageUri ? "Change photo" : "Add photo"}
                </Text>
              </Pressable>
            </View>

            {/* Full Name */}
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Ruan Klopper"
              placeholderTextColor="#A5CE67"
              value={fullName}
              onChangeText={setFullName}
            />

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#A5CE67"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A5CE67"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Vet Details Accordion */}
            {role === "vet" && (
              <View style={styles.vetBlock}>
                <Text style={styles.blockTitle}>Veterinarian Details</Text>

                <Text style={styles.subLabel}>Clinic Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sunrise Animal Clinic"
                  placeholderTextColor="#A5CE67"
                  value={clinicName}
                  onChangeText={setClinicName}
                />

                <Text style={styles.subLabel}>Practice ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12345"
                  placeholderTextColor="#A5CE67"
                  value={practiceId}
                  onChangeText={setPracticeId}
                />

                <Text style={styles.subLabel}>Specialties</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Livestock, Surgery"
                  placeholderTextColor="#A5CE67"
                  value={specialties}
                  onChangeText={setSpecialties}
                />

                <Text style={styles.subLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Short introduction..."
                  placeholderTextColor="#A5CE67"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                />
              </View>
            )}

            {/* Continue */}
            <Pressable
              style={styles.continueBtn}
              onPress={onEmailSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </Pressable>

            <Text style={styles.orText}>or</Text>

            {/* Google Sign Up */}
            <Pressable
              style={styles.googleBtn}
              onPress={onGoogleSignUp}
              disabled={gLoading}
            >
              {gLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="black" />
                  <Text style={styles.googleText}>Sign Up with Google</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Link to Sign In */}
        <Text style={styles.footerText}>
          Already have an account{" "}
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate("SignIn" as never)}
          >
            Sign In
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FDEB",
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 100,
  },
  logoWrapper: { alignItems: "center", marginBottom: 20 },
  logo: { width: 70, height: 70, resizeMode: "contain" },
  welcome: { fontSize: 18, textAlign: "center", color: "#A5CE67" },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#73C860",
    textAlign: "center",
    marginBottom: 20,
  },
  block: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  vetBlock: {
    backgroundColor: "#F1FCE6",
    padding: 14,
    borderRadius: 12,
    marginVertical: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  label: { marginTop: 10, marginBottom: 10, fontSize: 14, color: "#73C860" },
  subLabel: { marginTop: 8, marginBottom: 8, fontSize: 13, color: "#A5CE67" },
  input: {
    borderWidth: 1,
    borderColor: "#73C860",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 10,
    color: "#333",
    marginBottom: 8,
  },
  rolesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    gap: 10,
  },
  roleBtn: {
    borderWidth: 1,
    borderColor: "#73C860",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  roleBtnActive: { backgroundColor: "#73C860" },
  roleText: { color: "#73C860", fontSize: 13 },
  roleTextActive: { color: "#fff" },
  continueBtn: {
    backgroundColor: "#FEEB3D",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 16,
    alignItems: "center",
  },
  continueText: { fontSize: 16, fontWeight: "600", color: "#333" },
  orText: { textAlign: "center", color: "#444", marginVertical: 12 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 12,
    gap: 10,
  },
  googleText: { fontSize: 15, color: "#000" },
  footerText: {
    marginTop: 30,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
  },
  footerLink: {
    color: "#2E2E2E",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
