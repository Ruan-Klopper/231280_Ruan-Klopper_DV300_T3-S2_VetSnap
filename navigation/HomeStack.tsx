import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../screen/Home";
import AppNavigation from "../components/global/AppNavigation";
import { View, StyleSheet } from "react-native";

const HomeStack = createNativeStackNavigator();

export function HomeStackScreen() {
  return (
    <View style={styles.container}>
      <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="Home" component={Home} />
      </HomeStack.Navigator>

      {/* Floating AppNavigation at the bottom */}
      <View style={styles.navigationOverlay} pointerEvents="box-none">
        <AppNavigation activeTab="home" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative", // ensures absolute children position properly
  },
  navigationOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
