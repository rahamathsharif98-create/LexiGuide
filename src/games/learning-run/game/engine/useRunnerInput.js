import { useEffect, useRef } from 'react';

const SWIPE_THRESHOLD = 25; // pixels

function isGameplayTarget(target) {
  if (!target || typeof target.closest !== 'function') return true;
  return Boolean(
    target.closest('.learning-run-container') ||
    target.closest('[data-testid="learning-run-page"]') ||
    target.closest('canvas')
  );
}

// Captures keyboard and touch/swipe input and forwards discrete intents via
// callbacks. Kept outside the R3F render tree so listeners attach once.
export function useRunnerInput({ onLeft, onRight, onJump, onSlide, onPause, enabled = true }) {
  const touchState = useRef(null);

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
      if (!t) return;

      const isGameTouch = isGameplayTarget(e.target);
      if (!isGameTouch) {
        touchState.current = null;
        return;
      }

      touchState.current = {
        startX: t.clientX,
        startY: t.clientY,
        time: Date.now(),
        triggered: false,
        isGameTouch: true,
      };
    }

    function handleTouchMove(e) {
      if (!touchState.current || !touchState.current.isGameTouch) return;

      // Prevent pull-to-refresh and native scroll over the gameplay area
      if (e.cancelable) {
        e.preventDefault();
      }

      if (touchState.current.triggered) return;

      const t = e.touches[0];
      if (!t) return;

      const dx = t.clientX - touchState.current.startX;
      const dy = t.clientY - touchState.current.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) >= SWIPE_THRESHOLD) {
        touchState.current.triggered = true;
        if (absX > absY) {
          if (dx > 0) onRight?.();
          else onLeft?.();
        } else {
          if (dy > 0) onSlide?.();
          else onJump?.();
        }
      }
    }

    function handleTouchEnd(e) {
      if (!touchState.current || !touchState.current.isGameTouch) {
        touchState.current = null;
        return;
      }

      // If swipe wasn't already triggered during touchmove (e.g. quick flick or test event)
      if (!touchState.current.triggered) {
        const t = e.changedTouches?.[0];
        if (t) {
          const dx = t.clientX - touchState.current.startX;
          const dy = t.clientY - touchState.current.startY;
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);

          if (Math.max(absX, absY) >= SWIPE_THRESHOLD) {
            touchState.current.triggered = true;
            if (absX > absY) {
              if (dx > 0) onRight?.();
              else onLeft?.();
            } else {
              if (dy > 0) onSlide?.();
              else onJump?.();
            }
          }
        }
      }

      touchState.current = null;
    }

    function handleTouchCancel() {
      touchState.current = null;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, onLeft, onRight, onJump, onSlide, onPause]);
}

export default useRunnerInput;
