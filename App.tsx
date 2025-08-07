import React, { useState } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import ArticleSingleView from "./screen/ArticleSingleView";
import Chat from "./screen/Chat";
import SignIn from "./screen/SignIn";
import SignUp from "./screen/SignUp";

// Navigation
import { MainTabs } from "./navigation/MainTabs";

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

export default function App() {
  const [userAuth, setIsUserAuth] = useState(true);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navRef}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!userAuth ? (
            <>
              <Stack.Screen name="SignIn">
                {(props) => <SignIn {...props} setIsUserAuth={setIsUserAuth} />}
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
  );
}
