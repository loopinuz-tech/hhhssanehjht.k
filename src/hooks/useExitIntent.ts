import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';

const EXIT_SURVEY_KEY = 'exitSurveyShown';
const MIN_TIME_ON_PAGE_MS = 10_000; // 10 seconds
const EXCLUDED_PATHS = ['/login', '/register', '/onboarding', '/complete-profile'];

interface UseExitIntentOptions {
  user: User | null;
}

export function useExitIntent({ user }: UseExitIntentOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const triggeredRef = useRef(false);

  const shouldTrigger = (): boolean => {
    if (!user) return false;
    if (sessionStorage.getItem(EXIT_SURVEY_KEY)) return false;
    if (triggeredRef.current) return false;
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < MIN_TIME_ON_PAGE_MS) return false;
    const currentPath = window.location.pathname;
    if (EXCLUDED_PATHS.some((p) => currentPath.startsWith(p))) return false;
    return true;
  };

  const trigger = () => {
    if (!shouldTrigger()) return;
    triggeredRef.current = true;
    setIsVisible(true);
  };

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(EXIT_SURVEY_KEY, '1');
  };

  useEffect(() => {
    // Reset mount time on each mount
    mountTimeRef.current = Date.now();
    triggeredRef.current = false;

    // Desktop: mouse leaves the top of the viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        trigger();
      }
    };

    // Mobile: tab goes to background (back button / app switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trigger();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { isVisible, dismiss };
}