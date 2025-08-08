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

export const GET_ARTICLE_BY_ID = `
  query GET_ARTICLE_BY_ID($id: string) {
    "article": *[_type == "article" && _id == $id][0] {
      _id,
      title,
      source,
      keywords,
      documentId,
      coverImage,
      sections
    }
  }
`;
