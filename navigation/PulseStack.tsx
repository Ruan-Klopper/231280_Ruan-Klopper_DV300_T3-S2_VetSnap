import { createNativeStackNavigator } from "@react-navigation/native-stack";
import YourPulses from "../screen/YourPulses";
import CreatePulse from "../screen/CreatePulse";
import AllPulses from "../screen/AllPulses";

// navigation/SearchStack.tsx
const PulseStack = createNativeStackNavigator();
export function BrowseArticlesStackScreen() {
  return (
    <PulseStack.Navigator screenOptions={{ headerShown: false }}>
      <PulseStack.Screen name="AllPulses" component={AllPulses} />
      <PulseStack.Screen name="YourPulses" component={YourPulses} />
      <PulseStack.Screen name="CreatePulse" component={CreatePulse} />
    </PulseStack.Navigator>
  );
}
