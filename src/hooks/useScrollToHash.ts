import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_HEADER_OFFSET = 88;

export function scrollToSection(
  sectionId: string,
  options?: { offset?: number; behavior?: ScrollBehavior }
) {
  const el = document.getElementById(sectionId);
  if (!el) return false;

  const offset = options?.offset ?? DEFAULT_HEADER_OFFSET;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: options?.behavior ?? "smooth" });
  return true;
}

/**
 * Scrolls to `#sectionId` or a resolved id when `sectionId` is passed directly.
 * Re-runs on route/hash changes.
 */
export function useScrollToHash(
  sectionId?: string | null,
  options?: { offset?: number; enabled?: boolean }
) {
  const location = useLocation();
  const enabled = options?.enabled ?? true;

  const scroll = useCallback(
    (id: string) => {
      const tryScroll = (attempt = 0) => {
        const ok = scrollToSection(id, { offset: options?.offset });
        if (!ok && attempt < 12) {
          window.setTimeout(() => tryScroll(attempt + 1), 80);
        }
      };
      tryScroll();
    },
    [options?.offset]
  );

  useEffect(() => {
    if (!enabled) return;

    const fromHash = location.hash.replace(/^#/, "");
    const id = sectionId || fromHash;
    if (!id) return;

    scroll(id);
  }, [location.pathname, location.hash, sectionId, scroll, enabled]);
}
