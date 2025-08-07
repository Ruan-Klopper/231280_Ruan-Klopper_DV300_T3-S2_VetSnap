import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrapper}>
        <Image
          source={require("../assets/logos/VetSnapLogo.png")} // replace with correct path
          style={styles.logo}
        />
      </View>

      <Text style={styles.welcome}>Welcome to</Text>
      <Text style={styles.appName}>VetSnap</Text>

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
      <Pressable style={styles.continueBtn}>
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>

      {/* OR Divider */}
      <Text style={styles.orText}>or</Text>

      {/* Google Sign Up */}
      <Pressable style={styles.googleBtn}>
        <Ionicons name="logo-google" size={20} color="black" />
        <Text style={styles.googleText}>Sign Up with Google</Text>
      </Pressable>

      {/* Link to Sign In */}
      <Text style={styles.footerText}>
        Already have an account{" "}
        <Text
          style={styles.footerLink}
          onPress={() => navigation.navigate("SignIn")}
        >
          Sign In
        </Text>
      </Text>
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FDEB",
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
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
  label: {
    marginTop: 10,
    fontSize: 14,
    color: "#73C860",
  },
  input: {
    borderWidth: 1,
    borderColor: "#73C860",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: "#73C860",
    marginBottom: 8,
  },
  continueBtn: {
    backgroundColor: "#FEEB3D",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 16,
    alignItems: "center",
  },
  continueText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  orText: {
    textAlign: "center",
    color: "#444",
    marginVertical: 12,
  },
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
  googleText: {
    fontSize: 15,
    color: "#000",
  },
  footerText: {
    marginTop: 40,
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
