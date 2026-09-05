import { useCallback, useRef } from "react";
import { metrica } from "@/lib/metrica";
import type {
  RegisterStartedParams,
  RegisterCompletedParams,
  LoginSuccessParams,
  LogoutParams,
  TestStartedParams,
  TestFinishedParams,
  CertificateViewedParams,
  CertificateDownloadedParams,
  PremiumClickedParams,
  PremiumPurchasedParams,
  AiChatOpenedParams,
  AiChatMessageSentParams,
  BlogOpenedParams,
  BlogRead50PercentParams,
  SearchUsedParams,
  ProfileUpdatedParams,
} from "@/lib/metrica";

/**
 * React hook for Yandex.Metrika event tracking.
 *
 * Provides memoized callbacks that wrap `metrica.*` methods.
 * Safe to use in any component — calls are no-ops if `ym` is not loaded.
 *
 * Usage:
 *   const { testStarted, testFinished, loginSuccess } = useMetrica();
 *
 *   <Button onClick={() => testStarted({ subject: "Matematika" })}>
 *     Start Test
 *   </Button>
 */
export function useMetrica() {
  const startTime = useRef<number>(0);

  const registerStarted = useCallback(
    (params: RegisterStartedParams) => metrica.registerStarted(params),
    []
  );

  const registerCompleted = useCallback(
    (params: RegisterCompletedParams) => metrica.registerCompleted(params),
    []
  );

  const loginSuccess = useCallback(
    (params: LoginSuccessParams) => metrica.loginSuccess(params),
    []
  );

  const logout = useCallback(
    (params?: LogoutParams) => metrica.logout(params),
    []
  );

  // ── Test lifecycle helpers ──

  const testStarted = useCallback((params: TestStartedParams) => {
    startTime.current = Date.now();
    metrica.testStarted(params);
  }, []);

  const testFinished = useCallback(
    (params: Omit<TestFinishedParams, "durationMs">) => {
      const durationMs = Date.now() - startTime.current;
      metrica.testFinished({ ...params, durationMs });
      startTime.current = 0;
    },
    []
  );

  const certificateViewed = useCallback(
    (params?: CertificateViewedParams) => metrica.certificateViewed(params),
    []
  );

  const certificateDownloaded = useCallback(
    (params?: CertificateDownloadedParams) => metrica.certificateDownloaded(params),
    []
  );

  const premiumClicked = useCallback(
    (params: PremiumClickedParams) => metrica.premiumClicked(params),
    []
  );

  const premiumPurchased = useCallback(
    (params: PremiumPurchasedParams) => metrica.premiumPurchased(params),
    []
  );

  const aiChatOpened = useCallback(
    (params?: AiChatOpenedParams) => metrica.aiChatOpened(params),
    []
  );

  const aiChatMessageSent = useCallback(
    (params?: AiChatMessageSentParams) => metrica.aiChatMessageSent(params),
    []
  );

  const blogOpened = useCallback(
    (params?: BlogOpenedParams) => metrica.blogOpened(params),
    []
  );

  const blogRead50Percent = useCallback(
    (params?: BlogRead50PercentParams) => metrica.blogRead50Percent(params),
    []
  );

  const searchUsed = useCallback(
    (params: SearchUsedParams) => metrica.searchUsed(params),
    []
  );

  const profileUpdated = useCallback(
    (params: ProfileUpdatedParams) => metrica.profileUpdated(params),
    []
  );

  return {
    registerStarted,
    registerCompleted,
    loginSuccess,
    logout,
    testStarted,
    testFinished,
    certificateViewed,
    certificateDownloaded,
    premiumClicked,
    premiumPurchased,
    aiChatOpened,
    aiChatMessageSent,
    blogOpened,
    blogRead50Percent,
    searchUsed,
    profileUpdated,
  };
}
