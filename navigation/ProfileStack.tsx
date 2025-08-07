import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Search from "../screen/Search";
import ArticleSingleView from "../screen/ArticleSingleView";
import UserProfile from "../screen/UserProfile";

// navigation/SearchStack.tsx
const ProfileStack = createNativeStackNavigator();
export function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="UserProfile" component={UserProfile} />
    </ProfileStack.Navigator>
  );
}
