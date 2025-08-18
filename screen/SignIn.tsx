import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { SignInUser, SignInOrUpWithGoogle } from "../services/auth/authService";

WebBrowser.maybeCompleteAuthSession();

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const navigation = useNavigation();

  const onEmailSignIn = async () => {
    if (!email || !password)
      return Alert.alert("Missing info", "Email and password are required.");
    try {
      setLoading(true);
      const res = await SignInUser({ email, password });
      if (!res.success)
        return Alert.alert("Sign in failed", res.error ?? res.message);
      // onAuthStateChanged in App.tsx will navigate to MainTabs automatically
    } catch (e: any) {
      Alert.alert("Sign in error", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ---- Google Sign-In (Expo AuthSession -> Firebase) ----
  // Configure Google in Firebase Console & add redirect URIs in Expo Dev Tools if needed
  const onGoogleSignIn = async () => {
    try {
      setGLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const discovery = {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      };

      const params = {
        clientId: "<YOUR_GOOGLE_OAUTH_CLIENT_ID>", // iOS/Android Client ID
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
      if (result.type !== "success" || !result.params?.id_token) {
        return; // user cancelled or no token
      }

      const api = await SignInOrUpWithGoogle({
        idToken: result.params.id_token as string,
      });
      if (!api.success)
        return Alert.alert("Google sign-in failed", api.error ?? api.message);
      // Auth listener will drive navigation
    } catch (e: any) {
      Alert.alert("Google sign-in error", e?.message ?? "Unknown error");
    } finally {
      setGLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrapper}>
        <Image
          source={require("../assets/logos/VetSnapLogo.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.welcome}>Welcome back to</Text>
      <Text style={styles.appName}>VetSnap</Text>

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

      {/* Continue */}
      <Pressable
        style={styles.continueBtn}
        onPress={onEmailSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.continueText}>Continue</Text>
        )}
      </Pressable>

      <Text style={styles.orText}>or</Text>

      {/* Google Sign in */}
      <Pressable
        style={styles.googleBtn}
        onPress={onGoogleSignIn}
        disabled={gLoading}
      >
        {gLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="black" />
            <Text style={styles.googleText}>Sign In with Google</Text>
          </>
        )}
      </Pressable>

      {/* Link to Sign Up */}
      <Text style={styles.signupText}>
        Don’t have an account{" "}
        <Text
          style={styles.signupLink}
          onPress={() => navigation.navigate("SignUp" as never)}
        >
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FDEB",
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  logoWrapper: { alignItems: "center", marginBottom: 30 },
  logo: { width: 60, height: 60, resizeMode: "contain" },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    color: "#A5CE67",
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: "600",
    color: "#73C860",
    textAlign: "center",
    marginBottom: 24,
  },
  label: { marginTop: 10, marginBottom: 10, fontSize: 14, color: "#73C860" },
  input: {
    borderWidth: 1,
    borderColor: "#73C860",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: "#333",
    marginBottom: 8,
  },
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
  signupText: {
    marginTop: 40,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
  },
  signupLink: {
    color: "#2E2E2E",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
