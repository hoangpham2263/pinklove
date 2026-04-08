export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status: "draft" | "published";
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
};
