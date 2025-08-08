// services/sanity/sanityService.ts

import { sanityClient } from "./api";
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

export const getArticleById = async (
  id: string
): Promise<ApiResponse<Article>> => {
  try {
    const data: Article = await sanityClient.fetch(GET_ARTICLE_BY_ID, { id });

    return {
      success: true,
      statusCode: 200,
      message: "Article retrieved successfully",
      data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve article",
      error: (error as Error).message,
    };
  }
};
