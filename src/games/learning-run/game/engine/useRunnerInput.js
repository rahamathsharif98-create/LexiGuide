import { useEffect, useRef } from 'react';

// Captures keyboard and touch/swipe input and forwards discrete intents via
// callbacks. Kept outside the R3F render tree so listeners attach once.
export function useRunnerInput({ onLeft, onRight, onJump, onSlide, onPause, enabled = true }) {
  const touchStart = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    function handleKeyDown(e) {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          onLeft?.();
          break;
        case 'ArrowRight':
        case 'KeyD':
          onRight?.();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          onJump?.();
          break;
        case 'ArrowDown':
        case 'KeyS':
          onSlide?.();
          break;
        case 'Escape':
          onPause?.();
          break;
        default:
          break;
      }
    }

    function handleTouchStart(e) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    }

    function handleTouchEnd(e) {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 30;

      if (Math.max(absX, absY) < threshold) {
        touchStart.current = null;
        return; // tap, not a swipe
      }

      if (absX > absY) {
        if (dx > 0) onRight?.();
        else onLeft?.();
      } else if (dy > 0) {
        onSlide?.();
      } else {
        onJump?.();
      }
      touchStart.current = null;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onLeft, onRight, onJump, onSlide, onPause]);
}

export default useRunnerInput;
