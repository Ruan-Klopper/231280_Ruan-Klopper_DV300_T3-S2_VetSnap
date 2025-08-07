import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Search from "../screen/Search";
import ArticleSingleView from "../screen/ArticleSingleView";
import AllChats from "../screen/AllChats";

const AllChatsStack = createNativeStackNavigator();
export function AllChatsStackScreen() {
  return (
    <AllChatsStack.Navigator screenOptions={{ headerShown: false }}>
      <AllChatsStack.Screen name="AllChats" component={AllChats} />
    </AllChatsStack.Navigator>
  );
}
