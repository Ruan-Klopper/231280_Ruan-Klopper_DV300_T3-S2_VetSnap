import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Search from "../screen/Search";
import ArticleSingleView from "../screen/ArticleSingleView";
import BrowseArticles from "../screen/BrowseArticles";

// navigation/SearchStack.tsx
const SearchStack = createNativeStackNavigator();
export function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={BrowseArticles} />
      <SearchStack.Screen
        name="ArticleSingleView"
        component={ArticleSingleView}
      />
    </SearchStack.Navigator>
  );
}
