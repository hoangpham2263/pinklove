import "server-only";

import type { BlogPost } from "@/features/blog/types";
import { listPublishedBlogPosts } from "@/features/blog/server/service";
import type { Offering } from "@/features/offerings/types";
import { listPublishedOfferings } from "@/features/offerings/server/service";
import type { ManagedPage } from "@/lib/managed-pages";
import { listManagedPages } from "@/lib/managed-pages";

export type GuestSearchResult = {
  offerings: Offering[];
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
      offerings: [],
      posts: [],
      pages: [],
    };
  }

  const [offerings, posts, pages] = await Promise.all([
    listPublishedOfferings(),
    listPublishedBlogPosts(),
    listManagedPages(),
  ]);

  return {
    offerings: offerings.filter((offering) =>
      matchesSearchTerm(query, [
        offering.name,
        offering.excerpt,
        offering.description,
        offering.templateKey,
        offering.offeringType,
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
