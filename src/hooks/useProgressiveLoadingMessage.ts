import { useEffect, useMemo, useState } from "react";

export type ProgressiveLoadingMessageOptions = {
  /** thresholds in seconds */
  thresholds?: {
    connecting?: number;
    long?: number;
    veryLong?: number;
  };
};

export function useProgressiveLoadingMessage(
  active: boolean,
  options: ProgressiveLoadingMessageOptions = {}
) {
  const { thresholds } = options;

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }

    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const message = useMemo(() => {
    const t = {
      connecting: thresholds?.connecting ?? 5,
      long: thresholds?.long ?? 15,
      veryLong: thresholds?.veryLong ?? 30,
    };

    if (seconds < t.connecting) return "Loading…";
    if (seconds < t.long) return "Connecting to server…";
    if (seconds < t.veryLong) return "Still connecting (first load can take a bit)…";
    return "Almost there…";
  }, [seconds, thresholds]);

  return { seconds, message };
}
