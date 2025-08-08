# VetSnap Sanity API – Documentation & Planning

## Overview

This document outlines the structure, responsibilities, and design of the VetSnap Sanity CMS API. It strictly adheres to the SOLID principles to ensure a scalable, maintainable backend system. The Sanity schema and endpoint behaviors are documented below.

---

## ✅ API Response Interface

```ts
interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}
```

---

## 📦 Sanity Schema: `article`

Defined in `schemas/article.ts`, this document structure includes fields for metadata, images, structured content sections, and classification attributes.

Refer to the original schema for full implementation. Key fields:

- `documentId`: Unique identifier
- `title`: Title string
- `slug`: Auto-generated slug from `title + documentId`
- `source`: Enum for article origin (Anipedia = 0, Public = 1, Veterinarian = 2)
- `coverImage`: Object with support for uploaded or linked images
- `sections[]`: Typed sections supporting multiple formats

---

## 🔍 Category 1: **Read Endpoints**

### 1.1 Get Image Path (Utility Function)

**Responsibility:** Resolve a proper image URL depending on `imageType`

**Logic:**

```ts
if (imageType === "string") => "http://www.comrobi.com/vetsnap/data/item_{documentId}/{url}"
if (imageType === "upload") => imageAssetUrl
```

Applies to:

- `coverImage`
- `sections[].srcUpload | sections[].srcUrl`

---

### 1.2 Get All Articles (Thumbnails View)

**Params:**

- `keywords?: string[]`
- `source?: number`
- `range?: [number, number]` (pagination)

**Returns:**

```ts
ApiResponse<
  Array<{
    id: string;
    title: string;
    source: string;
    bannerImage: string;
    keywords: string[];
    documentId: number;
  }>
>;
```

---

### 1.3 Get Full Article by ID

**Params:**

- `articleId: string`

**Returns:**
Full article object from Sanity, with transformed image URLs

```ts
ApiResponse<Article>;
```

---

### 1.4 Search for Article

**Params:**

- `query: string` (search in `title`, `keywords`, `author`)
- `source?: number`
- `range?: [number, number]`

**Returns:**
Same as 1.2

---

## ✍️ Category 2: **Create Endpoint**

### 2.1 Create an Article

**Params:**

- Article object (validated against schema)

**Returns:**

```ts
ApiResponse<{ id: string; createdAt: string }>;
```

---

## 🛠️ Category 3: **Update Endpoint**

### 3.1 Update Article by ID

**Params:**

- `articleId: string`
- Partial article fields to update

**Returns:**

```ts
ApiResponse<{ id: string; updatedAt: string }>;
```

---

## 🗑️ Category 4: **Delete Endpoint**

### 4.1 Delete Article by ID

**Params:**

- `articleId: string`

**Returns:**

```ts
ApiResponse<{ id: string }>;
```

---

## ⚙️ Adherence to SOLID Principles

- **S – Single Responsibility**: Each endpoint or utility function does one thing (e.g., image resolver vs article fetch).
- **O – Open/Closed**: Easy to extend filtering/searching without modifying core logic.
- **L – Liskov Substitution**: API responses maintain a consistent structure across all endpoints.
- **I – Interface Segregation**: Client only calls what’s needed (e.g., thumbnails vs full view).
- **D – Dependency Inversion**: API consumers don’t depend on Sanity directly — they consume sanitized API wrappers.

---
