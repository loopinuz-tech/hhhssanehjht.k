import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateDeviceFingerprint, getClientIp } from "./useDeviceFingerprint";

export function useDeviceBlock() {
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const run = async () => {
      try {
        const [fp, ip] = await Promise.all([
          generateDeviceFingerprint(),
          getClientIp(),
        ]);

        // 1. RPC funksiya (Security Definer) orqali tekshirish
        let blocked = false;

        try {
          const { data: rpcData } = await (supabase as any).rpc("check_device_blocked", {
            p_fingerprint: fp,
            p_ip: ip
          });

          if (rpcData && typeof rpcData.is_blocked === "boolean") {
            blocked = rpcData.is_blocked;
          } else {
            // Fallback: Backend BFF endpoint
            const res = await fetch("/api/auth/check-device-block", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fingerprint: fp, ip_address: ip }),
            });
            const resData = await res.json();
            blocked = !!resData.blocked;
          }
        } catch (_) {
          // Direct query fallback if RPC unavailable
          const { data: fpMatch } = await (supabase as any)
            .from("blocked_devices")
            .select("id")
            .eq("fingerprint", fp)
            .maybeSingle();
          blocked = !!fpMatch;

          if (!blocked && ip) {
            const { data: ipMatch } = await (supabase as any)
              .from("blocked_devices")
              .select("id")
              .eq("ip_address", ip)
              .maybeSingle();
            if (ipMatch) blocked = true;
          }
        }

        if (blocked) {
          localStorage.setItem("ec_dev_blocked", "1");
        } else {
          localStorage.removeItem("ec_dev_blocked");
        }
        setIsDeviceBlocked(blocked);
      } catch (e) {
        setIsDeviceBlocked(localStorage.getItem("ec_dev_blocked") === "1");
      } finally {
        setIsChecking(false);
      }
    };

    run();
  }, []);

  return { isDeviceBlocked, isChecking };
}

// Foydalanuvchining qurilma barmoq izi va IP manzilini DB ga saqlash (login/kirganda chaqiriladi)
export async function saveDeviceLog(userId: string) {
  try {
    const [fp, ip] = await Promise.all([
      generateDeviceFingerprint(),
      getClientIp(),
    ]);

    await (supabase as any)
      .from("user_device_logs")
      .upsert({
        user_id: userId,
        fingerprint: fp,
        ip_address: ip,
        user_agent: navigator.userAgent.slice(0, 200),
        screen_info: `${window.screen.width}x${window.screen.height}`,
        last_seen: new Date().toISOString(),
      }, { onConflict: "user_id,fingerprint" });
  } catch {
    // silent
  }
}
