/**
 * EduContest — Yandex.Metrika Event Tracking System
 *
 * Centralized utility for all metrica events.
 * Counter ID: 109495216
 *
 * Usage:
 *   import { metrica } from "@/lib/metrica";
 *   metrica.registerStarted({ method: "email" });
 *   metrica.testFinished({ subject: "Matematika", score: 85, total: 100 });
 */

const YM_ID = 109495216;

// ─── Helpers ──────────────────────────────────────────────────────────

function ym(method: string, ...args: unknown[]): void {
  if (typeof window.ym === "function") {
    window.ym(YM_ID, method, ...args);
  }
}

// ─── Event Param Types ────────────────────────────────────────────────

export interface RegisterStartedParams {
  method: "email" | "phone" | "google" | "telegram";
}

export interface RegisterCompletedParams {
  method: "email" | "phone" | "google" | "telegram";
  role?: string;
}

export interface LoginSuccessParams {
  method: "email" | "google" | "telegram";
}

export interface LogoutParams {
  reason?: "manual" | "expired" | "session_clear";
}

export interface TestStartedParams {
  subject: string;
  folderId?: string;
  folderName?: string;
  questionCount?: number;
  mode?: string;
}

export interface TestFinishedParams {
  subject: string;
  folderId?: string;
  folderName?: string;
  score: number;
  total: number;
  durationMs?: number;
  passed: boolean;
}

export interface TestPassedParams {
  subject: string;
  folderName?: string;
  score: number;
  total: number;
  percentage: number;
}

export interface TestFailedParams {
  subject: string;
  folderName?: string;
  score: number;
  total: number;
  percentage: number;
}

export interface CertificateViewedParams {
  subject?: string;
  certificateId?: string;
}

export interface CertificateDownloadedParams {
  subject?: string;
  certificateId?: string;
  format?: "pdf" | "image";
}

export interface PremiumClickedParams {
  source: string;
  plan?: string;
}

export interface PremiumPurchasedParams {
  plan: string;
  amount: number;
  method?: string;
}

export interface AiChatOpenedParams {
  source?: string;
}

export interface AiChatMessageSentParams {
  messageLength?: number;
  hasImage?: boolean;
}

export interface BlogOpenedParams {
  slug?: string;
  title?: string;
}

export interface BlogRead50PercentParams {
  slug?: string;
  title?: string;
  readTimeMs?: number;
}

export interface SearchUsedParams {
  query: string;
  resultCount?: number;
  source?: string;
}

export interface ProfileUpdatedParams {
  fields: string[];
}

// ─── Goal Constants (for Yandex Metrika Goals panel) ──────────────────

export const YM_GOALS = {
  REGISTER_STARTED: "register_started",
  REGISTER_COMPLETED: "register_completed",
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",
  TEST_STARTED: "test_started",
  TEST_FINISHED: "test_finished",
  TEST_PASSED: "test_passed",
  TEST_FAILED: "test_failed",
  CERTIFICATE_VIEWED: "certificate_viewed",
  CERTIFICATE_DOWNLOADED: "certificate_downloaded",
  PREMIUM_CLICKED: "premium_clicked",
  PREMIUM_PURCHASED: "premium_purchased",
  AI_CHAT_OPENED: "ai_chat_opened",
  AI_CHAT_MESSAGE_SENT: "ai_chat_message_sent",
  BLOG_OPENED: "blog_opened",
  BLOG_READ_50_PERCENT: "blog_read_50_percent",
  SEARCH_USED: "search_used",
  PROFILE_UPDATED: "profile_updated",
} as const;

// ─── Funnel Stages (for funnel visualization) ────────────────────────

export const FUNNEL_STAGES = {
  LANDING: "funnel_landing",
  REGISTRATION: "funnel_registration",
  FIRST_TEST_STARTED: "funnel_first_test_started",
  FIRST_TEST_COMPLETED: "funnel_first_test_completed",
  CERTIFICATE_EARNED: "funnel_certificate_earned",
} as const;

// ─── Tracking API ─────────────────────────────────────────────────────

export const metrica = {
  /**
   * Send a reachGoal with params.
   * Also records the goal in Yandex.Metrika Goals panel.
   */
  goal(goalName: string, params?: Record<string, unknown>): void {
    ym("reachGoal", goalName, params);
  },

  // ── Auth Events ──

  registerStarted(params: RegisterStartedParams): void {
    ym("reachGoal", YM_GOALS.REGISTER_STARTED, params);
  },

  registerCompleted(params: RegisterCompletedParams): void {
    ym("reachGoal", YM_GOALS.REGISTER_COMPLETED, params);
    // Also track as funnel conversion
    ym("reachGoal", FUNNEL_STAGES.REGISTRATION);
  },

  loginSuccess(params: LoginSuccessParams): void {
    ym("reachGoal", YM_GOALS.LOGIN_SUCCESS, params);
  },

  logout(params?: LogoutParams): void {
    ym("reachGoal", YM_GOALS.LOGOUT, params);
  },

  // ── Test Events ──

  testStarted(params: TestStartedParams): void {
    ym("reachGoal", YM_GOALS.TEST_STARTED, params);
    // Funnel: first test started (only fires once per user via localStorage guard)
    if (!localStorage.getItem("ec_funnel_test_started")) {
      localStorage.setItem("ec_funnel_test_started", "1");
      ym("reachGoal", FUNNEL_STAGES.FIRST_TEST_STARTED);
    }
  },

  testFinished(params: TestFinishedParams): void {
    ym("reachGoal", YM_GOALS.TEST_FINISHED, params);
    if (params.passed) {
      metrica.testPassed({
        subject: params.subject,
        folderName: params.folderName,
        score: params.score,
        total: params.total,
        percentage: Math.round((params.score / params.total) * 100),
      });
    } else {
      metrica.testFailed({
        subject: params.subject,
        folderName: params.folderName,
        score: params.score,
        total: params.total,
        percentage: Math.round((params.score / params.total) * 100),
      });
    }
    // Funnel: first test completed
    if (!localStorage.getItem("ec_funnel_test_completed")) {
      localStorage.setItem("ec_funnel_test_completed", "1");
      ym("reachGoal", FUNNEL_STAGES.FIRST_TEST_COMPLETED);
    }
  },

  testPassed(params: TestPassedParams): void {
    ym("reachGoal", YM_GOALS.TEST_PASSED, params);
  },

  testFailed(params: TestFailedParams): void {
    ym("reachGoal", YM_GOALS.TEST_FAILED, params);
  },

  // ── Certificate Events ──

  certificateViewed(params?: CertificateViewedParams): void {
    ym("reachGoal", YM_GOALS.CERTIFICATE_VIEWED, params);
    // Funnel: certificate earned
    if (!localStorage.getItem("ec_funnel_certificate")) {
      localStorage.setItem("ec_funnel_certificate", "1");
      ym("reachGoal", FUNNEL_STAGES.CERTIFICATE_EARNED);
    }
  },

  certificateDownloaded(params?: CertificateDownloadedParams): void {
    ym("reachGoal", YM_GOALS.CERTIFICATE_DOWNLOADED, params);
  },

  // ── Premium Events ──

  premiumClicked(params: PremiumClickedParams): void {
    ym("reachGoal", YM_GOALS.PREMIUM_CLICKED, params);
  },

  premiumPurchased(params: PremiumPurchasedParams): void {
    ym("reachGoal", YM_GOALS.PREMIUM_PURCHASED, params);
  },

  // ── AI Chat Events ──

  aiChatOpened(params?: AiChatOpenedParams): void {
    ym("reachGoal", YM_GOALS.AI_CHAT_OPENED, params);
  },

  aiChatMessageSent(params?: AiChatMessageSentParams): void {
    ym("reachGoal", YM_GOALS.AI_CHAT_MESSAGE_SENT, params);
  },

  // ── Blog Events ──

  blogOpened(params?: BlogOpenedParams): void {
    ym("reachGoal", YM_GOALS.BLOG_OPENED, params);
  },

  blogRead50Percent(params?: BlogRead50PercentParams): void {
    ym("reachGoal", YM_GOALS.BLOG_READ_50_PERCENT, params);
  },

  // ── Search Events ──

  searchUsed(params: SearchUsedParams): void {
    ym("reachGoal", YM_GOALS.SEARCH_USED, params);
  },

  // ── Profile Events ──

  profileUpdated(params: ProfileUpdatedParams): void {
    ym("reachGoal", YM_GOALS.PROFILE_UPDATED, params);
  },

  // ── Funnel Tracking ──

  funnelLanding(): void {
    ym("reachGoal", FUNNEL_STAGES.LANDING);
  },

  // ── Pageview (for manual triggers) ──

  hit(path: string, params?: { title?: string; referrer?: string }): void {
    ym("hit", path, params);
  },
};
