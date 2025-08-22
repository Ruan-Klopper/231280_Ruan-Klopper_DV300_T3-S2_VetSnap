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
    // build query string with the id interpolated
    const query = GET_ARTICLE_BY_ID(id);

    const data = await sanityClient.fetch(query);

    if (!data) {
      return { success: false, statusCode: 404, message: "Not found" };
    }

    return { success: true, statusCode: 200, message: "OK", data };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve article",
      error: String(err?.message || err),
    };
  }
}

export async function getRandomArticles(limit = 10) {
  const query = `
    *[_type == "article" && defined(title)] 
    | order(random()) [0...$limit]{
      _id,
      title,
      "keywords": coalesce(keywords, []),
      source,
      documentId,
      // Prefer your existing image resolver if you have one;
      // this selects an URL from your coverImage structure:
      "bannerImage": select(
        coverImage.imageType == "upload" => coverImage.srcUpload.asset->url,
        coverImage.imageType == "string" => "http://www.comrobi.com/vetsnap/data/item_"+string(documentId)+"/"+coverImage.srcUrl,
        null
      )
    }
  `;

  try {
    const data = await sanityClient.fetch(query, { limit });
    return { success: true, statusCode: 200, message: "OK", data };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed",
      error: String(error),
    };
  }
}
