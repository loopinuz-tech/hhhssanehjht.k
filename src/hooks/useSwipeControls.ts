import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

export function useSwipeControls() {
  const status = useGameStore(s => s.status);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  useEffect(() => {
    if (status !== 'playing') return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't trigger swipe logic if touch started on an interactive button/control element
      const target = e.target as HTMLElement;
      if (target && (target.closest('button') || target.closest('a') || target.closest('.pointer-events-auto'))) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const target = e.target as HTMLElement;
      if (target && (target.closest('button') || target.closest('a'))) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const now = Date.now();
      if (now - lastSwipeTimeRef.current < 100) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Swipe sensitivity threshold
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 25) {
        lastSwipeTimeRef.current = now;
        if (deltaX > 0) {
          useGameStore.getState().moveRight();
        } else {
          useGameStore.getState().moveLeft();
        }
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
        useGameStore.getState().triggerJump();
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status]);
}
