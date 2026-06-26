import "server-only";

import type { BlogPost } from "@/features/blog/types";
import { listPublishedBlogPosts } from "@/features/blog/server/service";
import type { Offering } from "@/features/offerings/types";
import { listPublishedOfferings } from "@/features/offerings/server/service";
import { getEndpointCacheTtlSeconds, getEndpointSearchResultLimit } from "@/lib/endpoint-protection";
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

const globalForGuestSearch = globalThis as typeof globalThis & {
  guestSearchCache?: Map<string, { expiresAt: number; value: GuestSearchResult }>;
};

function getGuestSearchCache() {
  if (!globalForGuestSearch.guestSearchCache) {
    globalForGuestSearch.guestSearchCache = new Map();
  }
  return globalForGuestSearch.guestSearchCache;
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

  const [cacheTtlSeconds, maxResultsPerGroup] = await Promise.all([
    getEndpointCacheTtlSeconds("search"),
    getEndpointSearchResultLimit(),
  ]);
  const cache = getGuestSearchCache();
  const cacheKey = query;
  const cached = cache.get(cacheKey);
  if (cacheTtlSeconds > 0 && cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const [offerings, posts, pages] = await Promise.all([
    listPublishedOfferings(),
    listPublishedBlogPosts(),
    listManagedPages(),
  ]);

  const result = {
    offerings: offerings.filter((offering) =>
      matchesSearchTerm(query, [
        offering.name,
        offering.excerpt,
        offering.description,
        offering.templateKey,
        offering.offeringType,
      ])
    ).slice(0, maxResultsPerGroup),
    posts: posts.filter((post) =>
      matchesSearchTerm(query, [
        post.title,
        post.excerpt,
        post.content,
        post.categoryName,
      ])
    ).slice(0, maxResultsPerGroup),
    pages: pages
      .filter((page) => page.status === "published" && !["home", "login", "register"].includes(page.slug))
      .filter((page) =>
        matchesSearchTerm(query, [
          page.name,
          page.title,
          page.excerpt,
          page.body,
        ])
      )
      .slice(0, maxResultsPerGroup),
  };

  if (cacheTtlSeconds > 0) {
    cache.set(cacheKey, {
      expiresAt: Date.now() + cacheTtlSeconds * 1000,
      value: result,
    });
  }

  return result;
}
