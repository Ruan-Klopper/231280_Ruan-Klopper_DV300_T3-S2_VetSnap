// screen/ArticleSingleView.tsx
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import SectionBlock from "../components/articleComponent/SectionBlock";
import { getArticleById } from "../services/sanity/sanityService";
import { getSectionImagePaths } from "../services/sanity/utils";
import ArticleSingleViewNav from "../components/articles/ArticleSingleViewNav";

type RootStackParamList = {
  ArticleSingleView: { id: string; documentId?: number };
};

type FullArticle = {
  _id: string;
  title: string;
  author?: string;
  keywords?: string[];
  documentId?: number;
  coverImage?: {
    imageType: "upload" | "string";
    url?: string;
    upload?: { asset?: { url?: string } };
  };
  sections?: Array<any>;
};

/**
 * Header content inside AppContentGroup
 * - Shows categories, title, author
 * - Shows a centered loading state while fetching
 */
const HeaderComponents = ({
  title,
  author,
  categories,
  isLoading,
}: {
  title: string;
  author?: string;
  categories: string[];
  isLoading?: boolean;
}) => (
  <View style={[styles.headerWrapper, isLoading && { alignItems: "center" }]}>
    {isLoading ? (
      <>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </>
    ) : (
      <>
        <View style={styles.categoryWrapper}>
          {categories.map((cat, idx) => (
            <View key={idx} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.title}>{title}</Text>
        {author ? (
          <Text style={styles.author}>
            By: <Text style={styles.authorName}>{author}</Text>
          </Text>
        ) : null}
      </>
    )}
  </View>
);

const ArticleSingleView = () => {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RootStackParamList, "ArticleSingleView">>();
  const { id, documentId } = params;

  // -------- State --------
  const [loading, setLoading] = useState(true);
  const [articleTitle, setArticleTitle] = useState<string>("Loading...");
  const [author, setAuthor] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<string[]>([]);
  const [headerImage, setHeaderImage] = useState<string | undefined>(undefined);
  const [sections, setSections] = useState<any[]>([]);
  const [docId, setDocId] = useState<string | undefined>(undefined);

  // Zoom state: scale entire article content (text + inline images)
  const [contentScale, setContentScale] = useState(1);
  const fontPx = Math.round(16 * contentScale);

  // Scroll ref for "Top" action
  const scrollRef = useRef<ScrollView>(null);

  // -------- Derived values --------
  // utils.ts expects imageType "url" (your schema says "string"), so normalize
  const normalizedSections = useMemo(
    () =>
      (sections ?? []).map((s) =>
        s?.type === "image-block"
          ? { ...s, imageType: s.imageType === "string" ? "url" : s.imageType }
          : s
      ),
    [sections]
  );

  // Precompute all section image URLs using the helper
  const sectionImagePaths = useMemo(() => {
    if (!docId) return [];
    return getSectionImagePaths(docId, normalizedSections);
  }, [docId, normalizedSections]);

  // Truncate header title in AppHeader bar
  const cropTitleByX = (title: string): string => {
    const xCount = 15;
    const cropLength = xCount > 0 ? xCount : title.length;
    return title.length > cropLength
      ? title.slice(0, cropLength) + "..."
      : title;
  };

  // -------- Data fetch --------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getArticleById(id);
        if (res?.success && res.data) {
          const a = res.data as FullArticle;

          setArticleTitle(a.title);
          setAuthor(a.author);
          setCategories(a.keywords ?? []);
          setDocId(a.documentId ? String(a.documentId) : undefined);

          const header =
            a.coverImage?.imageType === "upload"
              ? a.coverImage?.upload?.asset?.url
              : a.coverImage?.url
              ? `http://www.comrobi.com/vetsnap/data/item_${a.documentId}/${a.coverImage.url}`
              : undefined;

          setHeaderImage(header);
          setSections(a.sections ?? []);
        }
      } catch (err) {
        console.error("💥 Error fetching article:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, documentId]);

  // -------- Nav handlers --------
  const handleZoomIn = () =>
    setContentScale((s) => Math.min(1.6, +(s + 0.1).toFixed(2)));
  const handleZoomOut = () =>
    setContentScale((s) => Math.max(0.8, +(s - 0.1).toFixed(2)));
  const handleScrollTop = () => {
    // always include x so both axes are explicit
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };
  const handleBack = () => {
    // prefer parent nav if present
    // @ts-ignore
    if (navigation && "goBack" in navigation) (navigation as any).goBack();
  };

  return (
    <View style={globalStyles.root}>
      {/* Top app header */}
      <AppHeader
        variant={3}
        title={cropTitleByX(articleTitle)}
        articleId={documentId ? String(documentId) : id}
      />

      {/* Single scroll view for the entire screen content */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }} // keep space for bottom nav
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppContentGroup
          headerBackground={
            headerImage
              ? { type: "image", value: headerImage }
              : { type: "color", value: "#4A7C59" }
          }
          headerComponents={
            <HeaderComponents
              title={articleTitle}
              author={author}
              categories={categories}
              isLoading={loading}
            />
          }
        >
          <View style={{ gap: 8 }}>
            {!loading &&
              (() => {
                let imgPtr = 0;
                return sections.map((s, i) => {
                  if (s.type === "title-paragraph") {
                    return (
                      <SectionBlock
                        key={i}
                        type="text"
                        title={s.title}
                        content={s.content}
                        fontSize={fontPx}
                      />
                    );
                  }
                  if (s.type === "image-block") {
                    const imgUrl = sectionImagePaths[imgPtr++] || "";
                    return (
                      <SectionBlock
                        key={i}
                        type="image"
                        title={s.title}
                        imageUrl={imgUrl}
                        fontSize={fontPx} // only affects caption/title text
                      />
                    );
                  }
                  if (s.type === "list") {
                    return (
                      <SectionBlock
                        key={i}
                        type="reference"
                        title={s.title}
                        content={s.items}
                        fontSize={fontPx}
                      />
                    );
                  }
                  if (s.type === "table") {
                    const htmlAsText =
                      typeof s.html === "string"
                        ? s.html.replace(/<[^>]+>/g, "")
                        : "";
                    return (
                      <SectionBlock
                        key={i}
                        type="text"
                        title={s.title}
                        content={[
                          {
                            _type: "block",
                            children: [{ _type: "span", text: htmlAsText }],
                          },
                        ]}
                        fontSize={fontPx}
                      />
                    );
                  }
                  if (s.type === "reference-list") {
                    return (
                      <SectionBlock
                        key={i}
                        type="reference"
                        title={s.title}
                        content={s.items}
                        fontSize={fontPx}
                      />
                    );
                  }
                  return null;
                });
              })()}
          </View>
        </AppContentGroup>
      </ScrollView>

      {/* Bottom navigation (gradient + rounded body) */}
      <ArticleSingleViewNav
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onScrollToTop={handleScrollTop}
        onBack={handleBack}
        fontSize={fontPx}
      />
    </View>
  );
};

export default ArticleSingleView;

const styles = StyleSheet.create({
  // Header styling inside the hero area
  headerWrapper: {
    gap: 15,
  },
  categoryWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  categoryChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  categoryText: {
    color: "#4A7C59",
    fontWeight: "900",
    fontSize: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    lineHeight: 42,
    textAlign: "center",
  },
  author: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  authorName: {
    fontWeight: "800",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
