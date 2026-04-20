import "server-only";

import type { BlogPost } from "@/features/blog/types";
import { listPublishedBlogPosts } from "@/features/blog/server/service";
import type { Product } from "@/features/products/types";
import { listPublishedProducts } from "@/features/products/server/service";
import type { ManagedPage } from "@/lib/managed-pages";
import { listManagedPages } from "@/lib/managed-pages";

export type GuestSearchResult = {
  products: Product[];
  posts: BlogPost[];
  pages: ManagedPage[];
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesSearchTerm(term: string, candidates: Array<string | undefined>) {
  if (!term) {
    return false;
  }

  return candidates.some((candidate) => normalizeSearchValue(candidate ?? "").includes(term));
}

export async function searchGuestContent(rawQuery: string): Promise<GuestSearchResult> {
  const query = normalizeSearchValue(rawQuery);

  if (!query) {
    return {
      products: [],
      posts: [],
      pages: [],
    };
  }

  const [products, posts, pages] = await Promise.all([
    listPublishedProducts(),
    listPublishedBlogPosts(),
    listManagedPages(),
  ]);

  return {
    products: products.filter((product) =>
      matchesSearchTerm(query, [
        product.name,
        product.excerpt,
        product.description,
        product.templateKey,
        product.productType,
      ])
    ),
    posts: posts.filter((post) =>
      matchesSearchTerm(query, [
        post.title,
        post.excerpt,
        post.content,
        post.categoryName,
      ])
    ),
    pages: pages
      .filter((page) => page.status === "published" && !["home", "login", "register"].includes(page.slug))
      .filter((page) =>
        matchesSearchTerm(query, [
          page.name,
          page.title,
          page.excerpt,
          page.body,
        ])
      ),
  };
}
