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
};

const SectionBlock: React.FC<SectionBlockProps> = ({
  type,
  title,
  content,
  imageUrl,
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
        (width, height) => {
          setImageDimensions({ width, height });
        },
        (error) => {
          console.warn("Failed to get image size", error);
        }
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
      {/* Text Section */}
      {type === "text" && (
        <>
          {title && <Text style={styles.sectionTitle}>{title}</Text>}
          {content && <PortableText value={content} />}
        </>
      )}

      {/* Image Section */}
      {type === "image" && imageUrl && (
        <>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: screenWidth - 40, // Assuming 20px horizontal padding
                height: (screenWidth - 40) / aspectRatio,
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
          </View>
          {title && <Text style={styles.imageCaption}>{title}</Text>}
        </>
      )}

      {/* Reference Section */}
      {type === "reference" && Array.isArray(content) && (
        <>
          {title && <Text style={styles.sectionTitle}>{title}</Text>}
          <View style={styles.referenceList}>
            {content.map((ref: string, index: number) => (
              <Text key={index} style={styles.referenceItem}>
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
  sectionContainer: {
    gap: 0,
  },
  sectionTitle: {
    fontSize: 24,
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
    fontSize: 14,
    fontStyle: "italic",
    color: "#555",
    textAlign: "center",
  },
  referenceList: {
    gap: 8,
  },
  referenceItem: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
});
