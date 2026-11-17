import { LeaderboardResponse, RefreshStatus, SortBy, SortOrder } from '@/types/leaderboard';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:8080/api/v1';

/**
 * Fetches the current leaderboard snapshot with optional sorting criteria.
 */
export async function fetchLeaderboard(
  sortBy: SortBy = 'solved',
  order: SortOrder = 'desc'
): Promise<LeaderboardResponse> {
  const url = new URL(`${API_BASE_URL}/leaderboard`);
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
  const res = await fetch(`${API_BASE_URL}/leaderboard/refresh`, {
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
  const res = await fetch(`${API_BASE_URL}/leaderboard/status`, {
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
