import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  progress?: number;
  size?: number;
  color?: string;
  message?: string;
  containerStyle?: ViewStyle;
};

const LoadingIndicator = ({
  progress,
  size = 48,
  color = "#518649",
  message = "Loading...",
  containerStyle,
}: Props) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {progress !== undefined && (
        <Text style={styles.progressText}>{`${progress}%`}</Text>
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default LoadingIndicator;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#518649",
  },
  message: {
    fontSize: 14,
    color: "#555",
  },
});
