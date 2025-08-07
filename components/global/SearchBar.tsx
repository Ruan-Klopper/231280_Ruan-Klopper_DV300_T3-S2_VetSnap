import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Animated,
  Easing,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTab } from "./TabContext";

type SearchBarProps = {
  navigateOnFocus?: boolean;
  onSearch?: (query: string) => void;
  value?: string;
  onChangeText?: (text: string) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({
  navigateOnFocus = false,
  onSearch,
  value,
  onChangeText,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { setActiveTab } = useTab();

  const animateIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 1.02,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleNavigate = () => {
    if (navigateOnFocus) {
      setActiveTab("search");
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    animateIn();
  };

  const handleBlur = () => {
    setIsFocused(false);
    animateOut();
  };

  const handleSubmit = (e: any) => {
    onSearch?.(e.nativeEvent.text);
  };

  const Wrapper = navigateOnFocus ? TouchableWithoutFeedback : React.Fragment;

  return (
    <Wrapper {...(navigateOnFocus ? { onPress: handleNavigate } : {})}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
            ...(isFocused ? styles.shadowFocused : styles.shadowDefault),
          },
        ]}
      >
        <TextInput
          placeholder="Search for something"
          placeholderTextColor="#999"
          style={styles.input}
          onFocus={navigateOnFocus ? undefined : handleFocus}
          onBlur={navigateOnFocus ? undefined : handleBlur}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          value={value}
          onChangeText={onChangeText}
          editable={!navigateOnFocus}
          pointerEvents={navigateOnFocus ? "none" : "auto"}
        />
        <Ionicons name="search" size={20} color="#999" style={styles.icon} />
      </Animated.View>
    </Wrapper>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 50,
    backgroundColor: "#FAFAFA",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  shadowDefault: {
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  shadowFocused: {
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  icon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
});
