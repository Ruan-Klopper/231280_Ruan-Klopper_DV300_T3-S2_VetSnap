import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logos/VetSnapLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>VetSnap</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FDEB",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#518649",
    letterSpacing: 1,
  },
});

