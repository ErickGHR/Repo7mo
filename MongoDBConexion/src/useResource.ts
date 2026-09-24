import { useEffect, useState } from 'react';
import { ApiError, request } from './api';
import { useSession } from './session';

export function useResource<T>(path: string) {
  const { session, expire } = useSession();
  const token = session?.token;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data: T | null; error: string } | null>(null);
  const key = `${token}:${path}:${attempt}`;
  useEffect(() => {
    let active = true;
    if (token) request<T>(path, token)
      .then((data) => { if (active) setResult({ key, data, error: '' }); })
      .catch((caught) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) expire();
        else setResult({ key, data: null, error: caught instanceof Error ? caught.message : 'Ocurrió un error.' });
      });
    return () => { active = false; };
  }, [path, token, key, expire]);
  const current = result?.key === key ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? '', loading: !current, retry: () => setAttempt((value) => value + 1) };
}
