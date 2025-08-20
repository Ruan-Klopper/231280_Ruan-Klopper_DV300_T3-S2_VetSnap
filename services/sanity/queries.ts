// services/sanity/queries.ts

export const GET_ALL_ARTICLES = `
  *[_type == "article"] {
    _id,
    title,
    source,
    "keywords": keywords[],
    "documentId": documentId,
    "bannerImage": coverImage
  }
`;

// queries.ts
export const GET_ARTICLE_BY_ID = (id: string) => {
  if (!id) {
    console.warn("⚠️ GET_ARTICLE_BY_ID called with empty id");
  }

  return `
  *[_type == "article" && _id == ${JSON.stringify(id)}][0]{
    _id,
    title,
    author,
    source,
    keywords,
    documentId,
    coverImage,
    sections
  }
`.trim();
};
