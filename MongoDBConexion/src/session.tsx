import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ApiError, request, Session } from './api';

type Auth = {
  session: Session | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  expire: () => void;
};
const Context = createContext<Auth | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const expire = useCallback(() => setSession(null), []);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(expire, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session, expire]);

  async function signIn(username: string, password: string) {
    const result = await request<Session>('/auth/login', undefined, { username, password });
    setSession(result);
  }
  async function signOut() {
    if (!session) return;
    try { await request('/auth/logout', session.token, {}); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
    setSession(null);
  }
  return <Context.Provider value={{ session, signIn, signOut, expire }}>{children}</Context.Provider>;
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Falta SessionProvider');
  return value;
}
