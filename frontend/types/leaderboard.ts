export type FetchStatus =
  | 'OK'
  | 'STALE'
  | 'NOT_FOUND'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'ERROR';

export type RefreshState = 'IDLE' | 'RUNNING' | 'DONE' | 'FAILED';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  currentStreak: number;
  contestRating: number | null;
  contestsAttended: number;
  status: FetchStatus;
  errorMessage: string | null;
  fetchedAt: string;
}

export interface LeaderboardResponse {
  lastUpdated: string | null;
  refreshing: boolean;
  entries: LeaderboardEntry[];
}

export interface RefreshStatus {
  state: RefreshState;
  completed: number;
  total: number;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface AddMemberResponse {
  member: Omit<LeaderboardEntry, 'rank'>;
  leaderboard: LeaderboardResponse;
}

export type SortBy = 'solved' | 'streak' | 'rating';
export type SortOrder = 'asc' | 'desc';
