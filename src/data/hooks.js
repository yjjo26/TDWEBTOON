import { useCallback, useEffect, useState } from "react";
import * as api from "./api";

// 소설 목록
export function useNovels() {
  const [novels, setNovels] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setNovels(await api.listNovels());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { novels, error, refresh };
}

// 단일 소설 + 모든 파일
export function useNovel(slug) {
  const [novel, setNovel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await api.getNovel(slug);
      setNovel(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { novel, error, loading, refresh };
}

// 로그
export function useLogs(slug) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      setLogs(await api.listLogs(slug));
    } catch (e) {
      setError(e.message);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { logs, error, refresh };
}

// 디바운스된 onChange — 입력 중 매 키스트로크마다 API 호출 안 하도록
export function useDebouncedSave(initialValue, save, delay = 600) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // 외부에서 initialValue 가 바뀌면 동기화 (다른 사용자 수정 등)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) return;
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        await save(value);
      } finally {
        setSaving(false);
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return [value, setValue, saving];
}
