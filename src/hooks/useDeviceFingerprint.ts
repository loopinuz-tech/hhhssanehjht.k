import { useEffect, useState } from "react";

// Cross-browser hardware-only fingerprint (barcha brauzerlarda bir xil kompyuter ID)
// User-Agent o'rniga faqat o'zgarmas apparat parametrlari ishlatiladi!

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    canvas.width = 240;
    canvas.height = 60;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial', 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("EduContest 🎓 Security Check", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("https://educontest.uz", 4, 35);
    return canvas.toDataURL();
  } catch {
    return "canvas-error";
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "no-webgl";
    const info = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (!info) return "no-info";
    const vendor = (gl as WebGLRenderingContext).getParameter(info.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = (gl as WebGLRenderingContext).getParameter(info.UNMASKED_RENDERER_WEBGL) || "";
    return `${vendor}:::${renderer}`;
  } catch {
    return "webgl-error";
  }
}

function hashCode(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// IP manzilini olish
export async function getClientIp(): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem("ec_client_ip");
    if (cached) return cached;

    // 1. Own BFF Server Endpoint (CSP safe, instant)
    try {
      const res0 = await fetch("/api/auth/client-ip");
      if (res0.ok) {
        const data0 = await res0.json();
        if (data0?.ip) {
          sessionStorage.setItem("ec_client_ip", data0.ip);
          return data0.ip;
        }
      }
    } catch (_) {}

    // 2. Secondary fallback: ipify
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(tId);
    const data = await res.json();
    if (data?.ip) {
      sessionStorage.setItem("ec_client_ip", data.ip);
      return data.ip;
    }
  } catch {
    // 3. Fallback to ipapi
    try {
      const res2 = await fetch("https://ipapi.co/json/");
      const data2 = await res2.json();
      if (data2?.ip) {
        sessionStorage.setItem("ec_client_ip", data2.ip);
        return data2.ip;
      }
    } catch (_) {}
  }
  return null;
}

export async function generateDeviceFingerprint(): Promise<string> {
  const CACHE_KEY = "ec_hw_fp_v2";
  const existing = localStorage.getItem(CACHE_KEY);
  if (existing) return existing;

  const nav = navigator;
  const scr = window.screen;

  // E'TIBOR: User-Agent olib tashlandi! Endi Chrome, Edge, Firefox, Brave, Opera barchasi bir xil kompyuter ID beradi
  const components = [
    `${scr.width}x${scr.height}x${scr.colorDepth}`,
    scr.pixelDepth?.toString() || "",
    new Date().getTimezoneOffset().toString(),
    nav.hardwareConcurrency?.toString() || "",
    (nav as any).deviceMemory?.toString() || "",
    nav.platform || "",
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ];

  const raw = components.join("||");
  const fp = hashCode(raw);
  localStorage.setItem(CACHE_KEY, fp);
  return fp;
}

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    generateDeviceFingerprint().then((fp) => {
      setFingerprint(fp);
      setIsReady(true);
    });
  }, []);

  return { fingerprint, isReady };
}
