// services/sanity/interfaces.ts

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

export interface Article {
  _id: string;
  title: string;
  source: number;
  keywords: string[];
  documentId: number;
  coverImage: {
    imageType: string;
    url?: string;
    upload?: { asset: { url: string } };
  };
  sections?: Section[];
}

export interface Section {
  type: string;
  imageType?: string;
  srcUrl?: string;
  srcUpload?: { asset: { url: string } };
}
