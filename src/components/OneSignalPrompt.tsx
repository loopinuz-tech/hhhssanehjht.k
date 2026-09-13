import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOneSignal } from "@/hooks/useOneSignal";
import { Button } from "@/components/ui/button";
import { X, Bell, BellOff, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISS_KEY = "onesignal_prompt_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function OneSignalPrompt() {
  const { t } = useTranslation();
  const { permission, isSupported, isInitialized, requestPermission } =
    useOneSignal();
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!isSupported || !isInitialized) return;
    if (permission === "granted") {
      setVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION) return;
    }

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [isSupported, isInitialized, permission]);

  const handleAllow = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!isSupported || permission === "granted" || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:max-w-sm"
      >
        <div className="rounded-2xl border border-border bg-card shadow-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {t("onesignal.title")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("onesignal.description")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAllow}
              disabled={isRequesting}
            >
              <Bell className="h-4 w-4 mr-1.5" />
              {isRequesting ? t("onesignal.requesting") : t("onesignal.allow")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              {t("onesignal.later")}
            </Button>
          </div>

          {permission === "denied" && (
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <Info className="h-3 w-3 mr-1" />
                {t("onesignal.how_to_enable")}
              </Button>

              <AnimatePresence>
                {showInstructions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1.5">
                      <p className="font-medium text-foreground">
                        {t("onesignal.instructions_title")}
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{t("onesignal.step1")}</li>
                        <li>{t("onesignal.step2")}</li>
                        <li>{t("onesignal.step3")}</li>
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
