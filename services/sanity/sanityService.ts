// services/sanity/sanityService.ts

import { sanityClient } from "./sanityClient";
import { GET_ALL_ARTICLES, GET_ARTICLE_BY_ID } from "./queries";
import { getBannerImagePath } from "./utils";
import { ApiResponse, Article } from "./interfaces";

export const getAllArticles = async (): Promise<ApiResponse<Article[]>> => {
  try {
    const rawData: Article[] = await sanityClient.fetch(GET_ALL_ARTICLES);

    const transformed = rawData.map((article) => ({
      ...article,
      bannerImage: getBannerImagePath(article.documentId, article.bannerImage),
    }));

    return {
      success: true,
      statusCode: 200,
      message: "Articles retrieved successfully",
      data: transformed,
    };
  } catch (error) {
    console.error("[getAllArticles] ERROR:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve articles",
      error: (error as Error).message,
    };
  }
};

export const filterArticles = (
  articles: Article[],
  source?: number,
  keyword?: string
): Article[] => {
  return articles.filter((article) => {
    const matchesSource = source === undefined || article.source === source;
    const matchesKeyword =
      !keyword ||
      article.keywords?.some((kw) =>
        kw.toLowerCase().includes(keyword.toLowerCase())
      );

    return matchesSource && matchesKeyword;
  });
};

export async function getArticleById(id: string): Promise<ApiResponse<any>> {
  try {
    console.log("🟡 getArticleById() called with id:", id);

    // build query string with the id interpolated
    const query = GET_ARTICLE_BY_ID(id);
    console.log("🟡 GROQ Query String:", query);

    const data = await sanityClient.fetch(query);
    console.log("🟢 Sanity fetch result:", data);

    if (!data) {
      return { success: false, statusCode: 404, message: "Not found" };
    }

    return { success: true, statusCode: 200, message: "OK", data };
  } catch (err: any) {
    console.error("🔴 Sanity fetch error:", err?.message || err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve article",
      error: String(err?.message || err),
    };
  }
}
