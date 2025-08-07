import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ArticleSingleView from "../screen/ArticleSingleView";
import BrowseArticles from "../screen/BrowseArticles";

// navigation/SearchStack.tsx
const BrowseArticlesStack = createNativeStackNavigator();
export function BrowseArticlesStackScreen() {
  return (
    <BrowseArticlesStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseArticlesStack.Screen
        name="BrowseArticles"
        component={BrowseArticles}
      />
      <BrowseArticlesStack.Screen
        name="ArticleSingleView"
        component={ArticleSingleView}
      />
    </BrowseArticlesStack.Navigator>
  );
}
