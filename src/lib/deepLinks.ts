/** Canonical section ids (English) used in DOM `id` and URL hash. */
export const LANDING_SECTIONS = {
  hero: "hero",
  benefits: "benefits",
  opportunities: "opportunities",
  oppCourses: "opp-courses",
  oppTests: "opp-tests",
  oppPayments: "opp-payments",
  oppCertification: "opp-certification",
  faq: "faq",
  contact: "contact",
} as const;

export type LandingSectionId = (typeof LANDING_SECTIONS)[keyof typeof LANDING_SECTIONS];

/** Uzbek / English path aliases → canonical section id */
export const LANDING_SECTION_ALIASES: Record<string, LandingSectionId> = {
  hero: "hero",
  bosh: "hero",
  benefits: "benefits",
  afzalliklar: "benefits",
  opportunities: "opportunities",
  imkoniyatlar: "opportunities",
  "opp-courses": "opp-courses",
  kurslar: "opp-courses",
  "opp-tests": "opp-tests",
  testlar: "opp-tests",
  "opp-payments": "opp-payments",
  tolovlar: "opp-payments",
  "opp-certification": "opp-certification",
  sertifikat: "opp-certification",
  faq: "faq",
  contact: "contact",
  aloqa: "contact",
};

export function resolveLandingSection(raw?: string | null): LandingSectionId | null {
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/^#/, "");
  return LANDING_SECTION_ALIASES[key] ?? null;
}

/** Path-based landing deep link (shareable, works without hash). */
export function landingSectionPath(section: LandingSectionId | string): string {
  const resolved = resolveLandingSection(section) ?? (section as LandingSectionId);
  const slug =
    Object.entries(LANDING_SECTION_ALIASES).find(([, id]) => id === resolved)?.[0] ?? resolved;
  return `/bosh/${slug}`;
}

export function withHash(path: string, section?: string | null): string {
  if (!section) return path;
  const hash = section.startsWith("#") ? section : `#${section}`;
  return `${path.replace(/#.*$/, "")}${hash}`;
}

/** Platform routes — pages and in-page sections */
export const APP_LINKS = {
  home: "/",
  login: "/login",
  dashboard: "/tests",
  tests: "/tests",
  testsSubject: (subject: string) => `/tests/${subject.toLowerCase().replace(/\s+/g, "-")}`,
  courses: "/courses",
  resources: "/resources",
  leaderboard: "/leaderboard",
  results: "/results",
  resultsGeneral: "/results/general",
  resultsCourse: "/results/course",
  resultsErrors: "/results/errors",
  ai: "/ai",
  messages: "/messages",
  olympiads: "/olympiads",
  support: "/support",
  supportMessages: "/support#messages",
  supportComplaints: "/support#complaints",
  errors: "/errors",
  planner: "/planner",
  settings: "/settings",
  settingsProfile: "/settings/profil",
  settingsSubscription: "/settings/obuna",
  settingsWallet: "/settings/hamyon",
  settingsNotifications: "/settings/bildirishnoma",
  settingsInterface: "/settings/interfeys",
  settingsSecurity: "/settings/xavfsizlik",
  settingsLegal: "/settings/huquqiy",
  privacy: "/privacy",
  terms: "/terms",
  offerta: "/offerta",
  studentDashboard: "/student/dashboard",
  admin: "/admin",
} as const;

export const ALL_LANDING_SECTION_IDS = Object.values(LANDING_SECTIONS);
