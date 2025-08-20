// App.tsx
import React, { useEffect, useState } from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// If you're using react-native-gesture-handler widely, keep this wrapper:
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Firebase
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./config/firebase"; // <- update path if different

// Screens
import ArticleSingleView from "./screen/ArticleSingleView";
import Chat from "./screen/Chat";
import YourPulses from "./screen/YourPulses";
import CreatePulse from "./screen/CreatePulse";
import SignIn from "./screen/SignIn";
import SignUp from "./screen/SignUp";

// Navigation
import { MainTabs } from "./navigation/MainTabs";

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

export default function App() {
  const [userAuth, setIsUserAuth] = useState<boolean>(false);
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setCurrentUser(fbUser);
      setIsUserAuth(!!fbUser);
      setBootstrapping(false);
    });

    return () => unsub();
  }, []);

  if (bootstrapping) {
    // Simple splash/loading while we determine auth state
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#F8FDEB",
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navRef}>
          {/* If you use expo-status-bar, import from 'expo-status-bar' instead */}
          <StatusBar />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!userAuth ? (
              <>
                {/* You no longer need to pass setIsUserAuth via props,
                    the onAuthStateChanged listener will handle it globally.
                    Keeping compatibility: SignIn can still accept it if you want. */}
                <Stack.Screen name="SignIn">
                  {(props) => (
                    <SignIn {...props} setIsUserAuth={setIsUserAuth} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="SignUp" component={SignUp} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen
                  name="ArticleSingleView"
                  component={ArticleSingleView}
                />
                <Stack.Screen name="Chat" component={Chat} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
