import { LeaderboardResponse, RefreshStatus, SortBy, SortOrder } from '@/types/leaderboard';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://enigma-leetcode-2.onrender.com';

const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
const API_V1_BASE = normalizedBase.endsWith('/api/v1')
  ? normalizedBase
  : `${normalizedBase}/api/v1`;

/**
 * Fetches the current leaderboard snapshot with optional sorting criteria.
 */
export async function fetchLeaderboard(
  sortBy: SortBy = 'solved',
  order: SortOrder = 'desc'
): Promise<LeaderboardResponse> {
  const url = new URL(`${API_V1_BASE}/leaderboard`);
  url.searchParams.set('sortBy', sortBy);
  url.searchParams.set('order', order);

  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    let errorDetail = `Failed to fetch leaderboard (HTTP ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // Fallback to HTTP status text
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

/**
 * Triggers an asynchronous background refresh of the leaderboard.
 * Throws an error with status 409 if a refresh is already running.
 */
export async function triggerRefresh(): Promise<RefreshStatus> {
  const res = await fetch(`${API_V1_BASE}/leaderboard/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  if (res.status === 202) {
    return res.json();
  }

  if (res.status === 409) {
    const statusData: RefreshStatus = await res.json();
    const error = new Error('A refresh is already running.') as Error & { status: number; refreshStatus: RefreshStatus };
    error.status = 409;
    error.refreshStatus = statusData;
    throw error;
  }

  let errorDetail = `Failed to trigger refresh (HTTP ${res.status})`;
  try {
    const errJson = await res.json();
    if (errJson?.message) {
      errorDetail = errJson.message;
    }
  } catch {
    // Keep default message
  }
  throw new Error(errorDetail);
}

/**
 * Queries current refresh execution state and progress.
 */
export async function fetchRefreshStatus(): Promise<RefreshStatus> {
  const res = await fetch(`${API_V1_BASE}/leaderboard/status`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch refresh status (HTTP ${res.status})`);
  }

  return res.json();
}
