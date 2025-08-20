// components/articleComponent/SectionBlock.tsx
import {
  StyleSheet,
  Text,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { globalStyles } from "../../global/styles";
import { PortableText } from "@portabletext/react-native";

type SectionType = "text" | "image" | "reference";

type SectionBlockProps = {
  type: SectionType;
  title?: string;
  content?: any;
  imageUrl?: string;
  fontSize?: number; // 👈 controls text size only
};

const SectionBlock: React.FC<SectionBlockProps> = ({
  type,
  title,
  content,
  imageUrl,
  fontSize = 16, // base body size
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (type === "image" && imageUrl) {
      Image.getSize(
        imageUrl,
        (width, height) => setImageDimensions({ width, height }),
        (error) => console.warn("Failed to get image size", error)
      );
    }
  }, [imageUrl, type]);

  const aspectRatio =
    imageDimensions.width && imageDimensions.height
      ? imageDimensions.width / imageDimensions.height
      : 1;

  return (
    <View
      style={[
        globalStyles.globalContentBlock,
        globalStyles.globalContentBlockPadding,
        styles.sectionContainer,
      ]}
    >
      {/* TEXT */}
      {type === "text" && (
        <>
          {title && (
            <Text style={[styles.sectionTitle, { fontSize: fontSize + 8 }]}>
              {title}
            </Text>
          )}
          {content && (
            <PortableText
              value={content}
              components={{
                block: {
                  normal: ({ children }) => (
                    <Text
                      style={{
                        fontSize,
                        lineHeight: fontSize * 1.5,
                        color: "#2F3E46",
                      }}
                    >
                      {children}
                    </Text>
                  ),
                  h1: ({ children }) => (
                    <Text
                      style={{
                        fontSize: fontSize + 10,
                        fontWeight: "800",
                        color: "#2F3E46",
                        marginBottom: 6,
                      }}
                    >
                      {children}
                    </Text>
                  ),
                  h2: ({ children }) => (
                    <Text
                      style={{
                        fontSize: fontSize + 6,
                        fontWeight: "700",
                        color: "#2F3E46",
                        marginBottom: 6,
                      }}
                    >
                      {children}
                    </Text>
                  ),
                },
                marks: {
                  strong: ({ children }) => (
                    <Text style={{ fontWeight: "700" }}>{children}</Text>
                  ),
                  em: ({ children }) => (
                    <Text style={{ fontStyle: "italic" }}>{children}</Text>
                  ),
                },
                list: {
                  bullet: ({ children }) => (
                    <View style={{ gap: 6 }}>{children}</View>
                  ),
                  number: ({ children }) => (
                    <View style={{ gap: 6 }}>{children}</View>
                  ),
                },
                listItem: {
                  bullet: ({ children }) => (
                    <Text style={{ fontSize, lineHeight: fontSize * 1.5 }}>
                      • {children}
                    </Text>
                  ),
                  number: ({ children, index }) => (
                    <Text style={{ fontSize, lineHeight: fontSize * 1.5 }}>
                      {index + 1}. {children}
                    </Text>
                  ),
                },
              }}
            />
          )}
        </>
      )}

      {/* IMAGE (does not scale with font) */}
      {type === "image" && imageUrl && (
        <>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: screenWidth - 40, // assumes 20px horizontal padding each side
                height: (screenWidth - 40) / aspectRatio,
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
          </View>
          {title && (
            <Text
              style={[
                styles.imageCaption,
                { fontSize: Math.max(12, fontSize - 2) },
              ]}
            >
              {title}
            </Text>
          )}
        </>
      )}

      {/* REFERENCE LIST */}
      {type === "reference" && Array.isArray(content) && (
        <>
          {title && (
            <Text style={[styles.sectionTitle, { fontSize: fontSize + 8 }]}>
              {title}
            </Text>
          )}
          <View style={styles.referenceList}>
            {content.map((ref: string, index: number) => (
              <Text
                key={index}
                style={[
                  styles.referenceItem,
                  { fontSize, lineHeight: fontSize * 1.5 },
                ]}
              >
                • {ref}
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default SectionBlock;

const styles = StyleSheet.create({
  sectionContainer: { gap: 0 },
  sectionTitle: {
    fontSize: 24, // will be overridden by inline style
    fontWeight: "700",
    color: "#2F3E46",
    marginBottom: 8,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  imageCaption: {
    marginTop: 16,
    fontSize: 14, // will be overridden by inline
    fontStyle: "italic",
    color: "#555",
    textAlign: "center",
  },
  referenceList: { gap: 8 },
  referenceItem: {
    fontSize: 16, // will be overridden by inline
    color: "#333",
    lineHeight: 24, // will be overridden by inline
  },
});
