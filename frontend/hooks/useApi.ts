'use client';

import useSWR from 'swr';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetcher(url: string, token: string) {
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }

  return res.json();
}

export function useApi<T>(endpoint: string) {
  const token = useAuthStore((s) => s.token);

  const { data, error, isLoading } = useSWR<T>(
    token ? [endpoint, token] : null,
    () => fetcher(endpoint, token as string),
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error.message as string) : null,
  };
}
