import { useEffect } from "react";

declare global {
  interface Window {
    ym: any;
  }
}

const YM_ID = 109495216;
const SCRIPT_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`;
const IMG_SRC = `https://mc.yandex.ru/watch/${YM_ID}`;

/**
 * Optimized init params for EduContest.
 *
 * - clickmap:       Records clicks on pages (for heatmap)
 * - trackLinks:     Tracks outbound/download/mailto/tel links
 * - accurateTrackBounce: Counts bounce accurately (user leaves without
 *                       a second pageview within 30s)
 * - webvisor:       Records user sessions (session replay)
 * - ecommerce:      Enables ecommerce data layer tracking
 * - childIframe:    Set true if the page has iframes that also need tracking
 * - defer:          Defers tag initialization until the page is fully loaded
 */
const INIT_PARAMS = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  ecommerce: "dataLayer",
};

function createYmStub(): void {
  if (typeof window.ym === "function" && window.ym.a) return;

  const ymStub = function () {
    // eslint-disable-next-line prefer-rest-params
    (window.ym.a = window.ym.a || []).push(arguments as unknown as unknown[]);
  } as Window["ym"];

  if (window.ym && Array.isArray((window.ym as unknown as { a?: unknown[][] }).a)) {
    ymStub.a = (window.ym as unknown as { a: unknown[][] }).a;
  }

  window.ym = ymStub;
}

function loadYmScript(): () => void {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  );
  if (existing) return () => existing.remove();

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = SCRIPT_SRC;
  script.onerror = (e: Event | string) => {
    // Silent catch when blocked by ad blockers or network CORS
    if (typeof e === 'object' && e && 'preventDefault' in e) {
      e.preventDefault();
    }
  };

  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode?.insertBefore(script, firstScript);

  return () => {
    script.parentNode?.removeChild(script);
  };
}

/**
 * YandexMetrika — top-level component.
 *
 * 1. Creates `ym` stub (before script loads)
 * 2. Injects tag.js exactly once
 * 3. Calls `ym(id, "init", params)`
 * 4. Renders <noscript> pixel
 *
 * Place OUTSIDE <BrowserRouter>.
 */
export default function YandexMetrika() {
  useEffect(() => {
    createYmStub();
    window.ym(YM_ID, "init", INIT_PARAMS);
    const cleanup = loadYmScript();
    return cleanup;
  }, []);

  return (
    <noscript>
      <div>
        <img src={IMG_SRC} style={{ position: "absolute", left: -9999 }} alt="" />
      </div>
    </noscript>
  );
}
