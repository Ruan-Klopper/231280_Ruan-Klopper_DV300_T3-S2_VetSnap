// services/sanity/utils.ts

import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { Article } from "./interfaces";

const sanityClient = createClient({
  projectId: "lx0o1rgf",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source).url();
}

const BASE_URL = "http://www.comrobi.com/vetsnap/data/item";

export const getBannerImagePath = (
  documentId: string,
  bannerImage: any
): string => {
  if (!bannerImage) return "";

  if (bannerImage.imageType === "url") {
    return `${BASE_URL}_${documentId}/${bannerImage.url}`;
  } else if (
    bannerImage.imageType === "upload" &&
    bannerImage.upload?.asset?._ref
  ) {
    return urlFor(bannerImage.upload);
  }

  return "";
};

/**
 * Returns array of full paths for image-block sections
 */
export const getSectionImagePaths = (
  documentId: string,
  sections: any[] = []
): string[] => {
  return sections
    .filter((s) => s.type === "image-block")
    .map((s) => {
      if (s.imageType === "url") {
        return `${BASE_URL}_${documentId}/${s.srcUrl}`;
      } else if (s.imageType === "upload") {
        return s.srcUpload?.asset?.url;
      }
      return null;
    })
    .filter(Boolean) as string[];
};
