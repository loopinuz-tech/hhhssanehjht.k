import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SESSION_KEY = "edu_anon_session";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== "undefined"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * usePageTracking — har route o'zgarganda avtomatik qayd etadi.
 * App.tsx ichidagi BrowserRouter children'iga qo'shing.
 */
export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const viewIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    
    // Guard: Only track page view when pathname actually changes
    if (prevPathnameRef.current === path) {
      return;
    }
    prevPathnameRef.current = path;

    const sessionId = getSessionId();
    const device = getDeviceType();
    const title = document.title || path;
    const referrer = document.referrer || null;
    const userId = user?.id ?? null;
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || null;

    startTimeRef.current = Date.now();

    (supabase as any)
      .rpc("track_page_view", {
        p_session_id: sessionId,
        p_user_id: userId,
        p_page_path: path,
        p_page_title: title,
        p_referrer: referrer,
        p_device_type: device,
      })
      .then(({ data }: any) => {
        if (data) viewIdRef.current = Number(data);
      });

    // Update active session with user name
    if (fullName) {
      (supabase as any).rpc("upsert_active_session", {
        p_session_id: sessionId,
        p_user_id: userId,
        p_full_name: fullName,
        p_page: path,
        p_page_title: title,
        p_device_type: device,
      }).then(() => { });
    }

    // Cleanup: update duration when leaving page
    return () => {
      const durationMs = Date.now() - startTimeRef.current;
      const vid = viewIdRef.current;
      if (vid && durationMs > 500) {
        // fire & forget — update duration_ms
        (supabase as any)
          .from("page_views")
          .update({ duration_ms: durationMs })
          .eq("id", vid)
          .then(() => { });
      }
    };
  }, [location.pathname, user?.id]);
}
