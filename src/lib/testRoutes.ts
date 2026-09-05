/** Test browse & session URL helpers */

export const TEST_CATEGORIES = [
  "mavzulashtirilgan",
  "attestatsiya",
  "pedagogik",
  "my-tests",
] as const;

export type TestCategory = (typeof TEST_CATEGORIES)[number];

export const TEST_MODES = ["imtixon", "mashq"] as const;
export type TestMode = (typeof TEST_MODES)[number];

import { slugify } from "./utils";
export { slugify };

export function parseFolderName(name: string): { code: string; title: string } {
  const match = name.match(/^(\d+\.\d+\.\d+)\s*(.*)/);
  if (match) {
    return { code: match[1], title: match[2].trim() || name };
  }
  return { code: "", title: name };
}

export function folderPathSlug(folder: { name: string }): string {
  const { title } = parseFolderName(folder.name);
  return slugify(title || folder.name);
}

export function subjectPathSlug(subject: string): string {
  return slugify(subject);
}

/**
 * Builds SEO-friendly slug for a mock test in the format:
 * `subject-mock-test-name-count`
 * Example: `matematika-milliy-sertifikat-mock-test-1-45`
 */
export function buildMockTestSlug(mockTest: {
  subject?: string | null;
  title: string;
  questions_count?: number | null;
}): string {
  if (!mockTest || !mockTest.title) return "mock-test";
  const subjectSlug = mockTest.subject ? slugify(mockTest.subject) : "";
  const titleSlug = slugify(mockTest.title || "");
  const countStr = mockTest.questions_count ? `${mockTest.questions_count}` : "";

  let parts: string[] = [];
  if (subjectSlug && !titleSlug.startsWith(subjectSlug)) {
    parts.push(subjectSlug);
  }
  parts.push(titleSlug);
  if (countStr && !titleSlug.endsWith(countStr)) {
    parts.push(countStr);
  }

  return parts.join("-").replace(/-+/g, "-");
}

export function resolveSubjectFromSlug(
  slug: string | undefined,
  subjectNames: string[]
): string | null {
  if (!slug) return null;
  const lower = slug.toLowerCase();
  if (TEST_CATEGORIES.includes(lower as TestCategory)) return null;
  return subjectNames.find((s) => slugify(s) === lower) ?? null;
}

export function isTestCategorySlug(slug?: string | null): slug is TestCategory {
  if (!slug) return false;
  return TEST_CATEGORIES.includes(slug.toLowerCase() as TestCategory);
}

export type TestsBrowseFilters = {
  cat?: TestCategory;
  q?: string;
  difficulty?: "all" | "oson" | "osrta" | "qiyin";
  payment?: "all" | "paid" | "free" | "purchased" | "not-purchased";
  status?: "all" | "worked" | "not-worked";
  view?: "grid" | "list";
  random?: boolean;
  attempts?: boolean;
  resource?: string | null;
};

export function filtersFromSearchParams(params: URLSearchParams): TestsBrowseFilters {
  return {
    cat: (params.get("cat") as TestCategory) || undefined,
    q: params.get("q") || undefined,
    difficulty: (params.get("difficulty") as TestsBrowseFilters["difficulty"]) || "all",
    payment: (params.get("payment") as TestsBrowseFilters["payment"]) || "all",
    status: (params.get("status") as TestsBrowseFilters["status"]) || "all",
    view: params.get("view") === "list" ? "list" : "grid",
    random: params.get("random") === "1",
    attempts: params.get("attempts") !== "0",
    resource: params.get("resource"),
  };
}

export function searchParamsFromFilters(filters: TestsBrowseFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.cat && filters.cat !== "mavzulashtirilgan") p.set("cat", filters.cat);
  if (filters.q) p.set("q", filters.q);
  if (filters.difficulty && filters.difficulty !== "all") p.set("difficulty", filters.difficulty);
  if (filters.payment && filters.payment !== "all") p.set("payment", filters.payment);
  if (filters.status && filters.status !== "all") p.set("status", filters.status);
  if (filters.view === "list") p.set("view", "list");
  if (filters.random) p.set("random", "1");
  if (filters.attempts === false) p.set("attempts", "0");
  if (filters.resource) p.set("resource", filters.resource);
  return p;
}

export type TestsPathOptions = {
  subject?: string | null;
  chapterSlug?: string | null;
  folder?: { name: string } | null;
  start?: boolean;
  mode?: TestMode | null;
  questionIndex?: number;
  filters?: TestsBrowseFilters;
};

/** Build shareable tests path */
export function buildTestsPath(opts: TestsPathOptions): string {
  const { subject, chapterSlug, folder, start, mode, questionIndex, filters } = opts;
  let path = "/tests";

  if (subject) {
    path += `/${subjectPathSlug(subject)}`;
    if (chapterSlug) {
      path += `/${chapterSlug}`;
      if (folder) {
        path += `/${folderPathSlug(folder)}`;
        if (start && !mode) {
          path += "/start";
        } else if (mode) {
          path += `/${mode}`;
          if (questionIndex != null && questionIndex >= 0) {
            path += `/${questionIndex + 1}-savol`;
          }
        }
      }
    }
  }

  const qs = filters ? searchParamsFromFilters(filters).toString() : "";
  return qs ? `${path}?${qs}` : path;
}

export function chapterSlugFromBob(bobKey: string, bobTitle?: string): string {
  return slugify(bobTitle || bobKey);
}

export function resolveBobFromChapterSlug(
  chapterSlug: string,
  bobKeys: string[],
  bobTitles: Record<string, string>
): string | null {
  const lower = chapterSlug.toLowerCase();
  for (const bob of bobKeys) {
    if (slugify(bob) === lower || slugify(bobTitles[bob] || bob) === lower) {
      return bob;
    }
  }
  return null;
}

export function findFolderBySlugs(
  folders: Array<{ id: string; name: string; subject?: string | null }>,
  subject: string,
  folderSlug: string
): (typeof folders)[0] | undefined {
  const subjectSlug = subjectPathSlug(subject);
  return folders.find((f) => {
    const sub = f.subject || "Informatika";
    if (subjectPathSlug(sub) !== subjectSlug) return false;
    return folderPathSlug(f) === folderSlug.toLowerCase();
  });
}
