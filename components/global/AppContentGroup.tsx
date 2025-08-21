import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  LayoutChangeEvent,
  ImageBackground,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type AppContentGroupProps = {
  headerBackground?: {
    type: "color" | "image";
    value: string | ImageSourcePropType;
  };
  headerComponents?: React.ReactNode;
  children?: React.ReactNode;
};

const AppContentGroup: React.FC<AppContentGroupProps> = ({
  headerBackground = { type: "color", value: "#518649" },
  headerComponents,
  children,
}) => {
  const [topGroupHeight, setTopGroupHeight] = useState(0);

  const TopGroupWrapper = ({ children }: { children: React.ReactNode }) => {
    if (headerBackground.type === "image") {
      return (
        <ImageBackground
          source={
            typeof headerBackground.value === "string"
              ? { uri: headerBackground.value }
              : headerBackground.value
          }
          style={appContentStyles.topGroup}
        >
          {/* Dark overlay */}
          <View style={appContentStyles.imageOverlay} />

          {children}
        </ImageBackground>
      );
    }

    return (
      <View
        style={[
          appContentStyles.topGroup,
          { backgroundColor: headerBackground.value as string },
        ]}
      >
        {children}
      </View>
    );
  };

  return (
    <ScrollView
      style={appContentStyles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TopGroupWrapper>
        <View style={appContentStyles.topGroupContainer}>
          {headerComponents}
        </View>
        <LinearGradient
          colors={["transparent", "#F3F4EF"]}
          style={appContentStyles.linearGradientBottom}
        />
      </TopGroupWrapper>

      <View style={[appContentStyles.contentContainer, { marginTop: -240 }]}>
        {children}
      </View>
    </ScrollView>
  );
};

export default AppContentGroup;

export const appContentStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F3F4EF",
    minHeight: "100%",
  },
  topGroup: {
    backgroundColor: "#518649",
    paddingTop: 90,
    zIndex: 0,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // adjust for darkness
    zIndex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  topGroupContainer: {
    padding: 25,
    zIndex: 3,
  },
  linearGradientBottom: {
    height: 240,
    zIndex: 5,
  },
  contentContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 140,
  },
  sampleBlock: {
    width: "100%",
    height: 440,
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
  },
});
