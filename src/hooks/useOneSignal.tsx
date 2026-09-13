import { useEffect, useState, useCallback } from "react";

export function useOneSignal() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    const check = setInterval(() => {
      const OS = (window as any).OneSignal;
      if (OS && OS.Notifications && OS.Notifications.permissionStatus) {
        setIsInitialized(true);
        setPermission(OS.Notifications.permissionStatus);
      }
    }, 1000);

    const timeout = setTimeout(() => clearInterval(check), 10000);

    return () => { clearInterval(check); clearTimeout(timeout); };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const OS = (window as any).OneSignal;
      if (!OS?.Notifications) return "denied";
      const result = await OS.Notifications.requestPermission();
      setPermission(result ? "granted" : "denied");
      return result ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }, []);

  const showSlidedown = useCallback(async () => {
    try {
      const OS = (window as any).OneSignal;
      if (!OS?.Slidedown) return;
      await OS.Slidedown.promptPush();
      setPermission(OS.Notifications.permissionStatus);
    } catch {}
  }, []);

  return {
    isInitialized,
    permission,
    isSupported,
    requestPermission,
    showSlidedown,
  };
}
