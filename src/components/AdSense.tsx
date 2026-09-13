import React, { useEffect, useRef } from "react";

interface AdSenseProps {
  client?: string;
  slot?: string;
  format?: string;
  responsive?: boolean;
  layout?: string;
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const DEFAULT_CLIENT_ID = "ca-pub-1854359524589028";

export const AdSense: React.FC<AdSenseProps> = ({
  client = DEFAULT_CLIENT_ID,
  slot,
  format = "auto",
  responsive = true,
  layout,
  layoutKey,
  className = "",
  style = {},
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const isPushed = useRef(false);

  useEffect(() => {
    // Prevent duplicate push calls on the same element instance
    if (isPushed.current) return;

    try {
      if (typeof window !== "undefined") {
        const insElement = insRef.current;
        
        // Ensure element exists and has not already been populated by AdSense
        if (
          insElement &&
          !insElement.getAttribute("data-ad-status") &&
          insElement.children.length === 0
        ) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isPushed.current = true;
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("AdSense push error (expected in development):", err);
      }
    }
  }, []);

  return (
    <div
      className={`adsense-wrapper my-6 w-full flex justify-center items-center overflow-hidden rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200/60 dark:border-slate-800/60 min-h-[90px] ${className}`}
      aria-label="Reklama"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          minWidth: "250px",
          textAlign: "center",
          ...style,
        }}
        data-ad-client={client}
        {...(slot ? { "data-ad-slot": slot } : {})}
        {...(format ? { "data-ad-format": format } : {})}
        {...(layout ? { "data-ad-layout": layout } : {})}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

export default AdSense;
