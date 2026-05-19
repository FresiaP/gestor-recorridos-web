import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INACTIVITY_MS = 15 * 60 * 1000;
const DEFAULT_WARNING_MS = 30 * 1000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

export function useSessionTimeout({
  enabled,
  onTimeout,
  onExtendSession,
  inactivityMs = DEFAULT_INACTIVITY_MS,
  warningMs = DEFAULT_WARNING_MS,
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(warningMs / 1000),
  );

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const warningOpenRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  const onExtendSessionRef = useRef(onExtendSession);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    onExtendSessionRef.current = onExtendSession;
  }, [onExtendSession]);

  const clearTimers = useCallback(() => {
    clearTimeout(inactivityTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(countdownTimerRef.current);
  }, []);

  const resetCountdown = useCallback(() => {
    setRemainingSeconds(Math.floor(warningMs / 1000));
  }, [warningMs]);

  const startWarning = useCallback(() => {
    setShowWarning(true);
    warningOpenRef.current = true;
    resetCountdown();

    countdownTimerRef.current = setInterval(() => {
      setRemainingSeconds((current) => (current > 1 ? current - 1 : 0));
    }, 1000);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      warningOpenRef.current = false;
      onTimeoutRef.current?.();
    }, warningMs);
  }, [resetCountdown, warningMs]);

  const resetTimeout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    warningOpenRef.current = false;
    resetCountdown();

    if (enabled) {
      inactivityTimerRef.current = setTimeout(startWarning, inactivityMs);
    }
  }, [clearTimers, enabled, inactivityMs, resetCountdown, startWarning]);

  const continueSession = useCallback(async () => {
    await onExtendSessionRef.current?.();
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setShowWarning(false);
      warningOpenRef.current = false;
      return undefined;
    }

    const handleActivity = () => {
      if (!warningOpenRef.current) {
        resetTimeout();
      }
    };

    resetTimeout();
    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      );
      clearTimers();
    };
  }, [clearTimers, enabled, resetTimeout]);

  return {
    showWarning,
    remainingSeconds,
    continueSession,
    resetTimeout,
  };
}
