import { useEffect, useRef, useState, useCallback } from "react";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options?: { delay?: number; enabled?: boolean }
) {
  const delay = options?.delay ?? 2000;
  const enabled = options?.enabled ?? true;
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const dataRef = useRef(data);
  const saveFnRef = useRef(saveFn);

  dataRef.current = data;
  saveFnRef.current = saveFn;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!enabled) return;
    setStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveFnRef.current(dataRef.current);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, enabled]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("saving");
    try {
      await saveFnRef.current(dataRef.current);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  const markSaved = useCallback(() => {
    isFirstRender.current = true;
    setStatus("saved");
  }, []);

  return { status, saveNow, markSaved };
}
