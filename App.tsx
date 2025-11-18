// App.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// If you're using react-native-gesture-handler widely, keep this wrapper:
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";

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

// Components
import CustomSplashScreen from "./components/global/SplashScreen";

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

export default function App() {
  const [userAuth, setIsUserAuth] = useState<boolean>(false);
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appIsReady, setAppIsReady] = useState<boolean>(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    async function prepare() {
      try {
        // Listen for Firebase Auth state changes
        unsub = onAuthStateChanged(auth, (fbUser) => {
          setCurrentUser(fbUser);
          setIsUserAuth(!!fbUser);
        });

        // Add a minimum delay to ensure splash screen is visible
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setBootstrapping(false);
        setAppIsReady(true);

        // Hide the native splash screen
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
        setBootstrapping(false);
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This callback is called after the root view has been laid out
      // We can hide the native splash screen here if it's still visible
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (bootstrapping || !appIsReady) {
    // Show splash screen while we determine auth state
    return (
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <CustomSplashScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
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
                <Stack.Screen name="YourPulses" component={YourPulses} />
                <Stack.Screen name="CreatePulse" component={CreatePulse} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
