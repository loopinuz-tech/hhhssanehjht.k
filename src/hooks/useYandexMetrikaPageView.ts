import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const YM_ID = 109495216;

/**
 * Tracks SPA route changes with Yandex.Metrika.
 * Must be used INSIDE <BrowserRouter> so `useLocation()` works.
 *
 * Sends `ym("hit", fullPath)` on every client-side navigation
 * with pathname + search params + document title.
 *
 * The first render (initial page load) is skipped because tag.js already
 * records the first hit during `init`.
 */
export function useYandexMetrikaPageView() {
  const location = useLocation();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Build full path: /dashboard?tab=results
    const fullPath = location.pathname + location.search;

    const timeoutId = setTimeout(() => {
      if (typeof window.ym === "function") {
        window.ym(YM_ID, "hit", fullPath, {
          title: document.title,
          referrer: document.referrer,
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
}
