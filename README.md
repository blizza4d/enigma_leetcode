# The Enigma Global Aggregator (LeetCode Edition)

A full-stack performance aggregator and leaderboard web application engineered for college competitive programming clubs. Sourced directly and exclusively from LeetCode via concurrent, rate-limited, and fault-tolerant background aggregation.

---

## Architecture Overview

```
+-------------------------------------------------------------------------+
|                  Next.js 14 Frontend (Vercel-style Dark UI)             |
|  - App Router (React Server + Client Components)                        |
|  - Real-time polling & sync via RefreshButton                           |
|  - Server-side sorting & client-side instant filtering                  |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP REST (JSON)
                                     v
+------------------------------------+------------------------------------+
|                Spring Boot 3.2 Backend (Java 17 / 18)                   |
|                                                                         |
|  [REST Layer]                                                           |
|    - GET  /api/v1/leaderboard (cached snapshot, sorted, ranked)         |
|    - POST /api/v1/leaderboard/refresh (async 202, 409 conflict lock)    |
|    - GET  /api/v1/leaderboard/status (live batch progress tracker)      |
|                                                                         |
|  [LeaderboardCache]                                                     |
|    - In-memory thread-safe snapshot + last-known-good fallback store   |
|                                                                         |
|  [ScraperService]                                                       |
|    - Bounded thread pool (default 5 named threads)                      |
|    - CompletableFuture per member with orTimeout & handle resilience   |
|                                                                         |
|  [RateLimiter]                                                          |
|    - Monotonic token/reservation scheduler (400ms interval + jitter)   |
|                                                                         |
|  [LeetCodeClient]                                                       |
|    - Single aliased GraphQL query per member (POST /graphql)            |
|    - Retry once with backoff on 429/5xx                                 |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTPS GraphQL POST
                                     v
+------------------------------------+------------------------------------+
|                         https://leetcode.com/graphql                    |
+-------------------------------------------------------------------------+
```

---

## Tech Stack

- **Backend**:
  - Java 17 / 18, Spring Boot 3.2.5, Maven 3.9
  - Concurrency: `ExecutorService` (bounded fixed pool) and `CompletableFuture`
  - Transport: `java.net.http.HttpClient`
  - Parsing: Jackson Databind, `LeetCodeGraphQLParser`
  - Fallback Scraper: JSoup 1.17.2 (with honest documentation of client-rendered limitations)
  - Testing: JUnit 5, Mockito, AssertJ, Spring MockMvc
- **Frontend**:
  - Next.js 14 (App Router), TypeScript 5, React 18
  - Styling: Tailwind CSS (dark mode, Vercel-style aesthetics)
  - Icons: `lucide-react`
  - Type-safe API client layer (`lib/api.ts`)

---

## Project Structure

```
.
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/enigma/aggregator/
│       │   │   ├── EnigmaAggregatorApplication.java
│       │   │   ├── client/
│       │   │   │   ├── ClientConfig.java
│       │   │   │   ├── JsoupFallbackClient.java
│       │   │   │   ├── LeetCodeClient.java
│       │   │   │   ├── LeetCodeGraphQLParser.java
│       │   │   │   ├── MockProfileClient.java
│       │   │   │   ├── ProfileClient.java
│       │   │   │   └── RateLimiter.java
│       │   │   ├── config/
│       │   │   │   ├── AppProperties.java
│       │   │   │   └── CorsConfig.java
│       │   │   ├── controller/
│       │   │   │   └── LeaderboardController.java
│       │   │   ├── dto/
│       │   │   │   ├── ErrorResponse.java
│       │   │   │   ├── LeaderboardEntryDto.java
│       │   │   │   ├── LeaderboardResponse.java
│       │   │   │   └── RefreshStatusDto.java
│       │   │   ├── exception/
│       │   │   │   ├── GlobalExceptionHandler.java
│       │   │   │   └── RefreshAlreadyRunningException.java
│       │   │   ├── model/
│       │   │   │   ├── FetchStatus.java
│       │   │   │   ├── Member.java
│       │   │   │   ├── PlayerStats.java
│       │   │   │   └── RefreshState.java
│       │   │   ├── roster/
│       │   │   │   └── RosterLoader.java
│       │   │   └── service/
│       │   │       ├── LeaderboardCache.java
│       │   │       ├── LeaderboardService.java
│       │   │       ├── RankingService.java
│       │   │       └── ScraperService.java
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       └── members.json
│       └── test/
│           ├── java/com/enigma/aggregator/
│           │   ├── client/
│           │   │   ├── LeetCodeClientTest.java
│           │   │   ├── LeetCodeGraphQLParserTest.java
│           │   │   └── RateLimiterTest.java
│           │   ├── controller/
│           │   │   └── LeaderboardControllerTest.java
│           │   ├── roster/
│           │   │   └── RosterLoaderTest.java
│           │   └── service/
│           │       ├── RankingServiceTest.java
│           │       └── ScraperServiceTest.java
│           └── resources/
│               ├── sample-leetcode-notfound.json
│               ├── sample-leetcode-rated.json
│               ├── sample-leetcode-unrated.json
│               ├── test-members-blank-name.json
│               └── test-members-duplicate-user.json
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    ├── postcss.config.mjs
    ├── .env.local
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── LeaderboardDashboard.tsx
    │   ├── LeaderboardTable.tsx
    │   ├── Navbar.tsx
    │   ├── RefreshButton.tsx
    │   └── StatusBadge.tsx
    ├── lib/
    │   └── api.ts
    └── types/
        └── leaderboard.ts
```

---

## Club Roster Format (`members.json`)

The club roster is defined in `backend/src/main/resources/members.json`. Arbitrary external usernames are **strictly rejected** by the backend.

```json
[
  { "name": "Aarav Sharma", "leetcodeUsername": "lee215" },
  { "name": "Aditi Rao", "leetcodeUsername": "neal_wu" },
  { "name": "Ananya Gupta", "leetcodeUsername": "tourist" }
]
```

### Validation Rules (Fail Fast at Startup)
The application validates the roster upon startup in `RosterLoader`:
1. File must exist and contain a valid JSON array.
2. Every entry must have non-blank `name` and `leetcodeUsername`.
3. No duplicate `name` (case-insensitive).
4. No duplicate `leetcodeUsername` (case-insensitive).
5. If any validation rule fails, the application aborts startup immediately with a descriptive `IllegalStateException`.

---

## Configuration (`application.yml`)

All settings are externalized:

```yaml
server:
  port: 8080

enigma:
  roster:
    file-path: "classpath:members.json"
  scraper:
    thread-pool-size: 5            # Number of concurrent scraping worker threads
    task-timeout-seconds: 10       # Per-member timeout deadline
    rate-limit:
      base-interval-ms: 400        # Minimum spacing between outbound request starts
      max-jitter-ms: 100           # Random jitter added to prevent request synchronization
    retry:
      max-attempts: 2              # Single retry on HTTP 429/5xx
      initial-backoff-ms: 1000     # Backoff delay before retry
    client:
      endpoint-url: "https://leetcode.com/graphql"
      user-agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36"
      referer: "https://leetcode.com"
      http-timeout-seconds: 8
  leaderboard:
    auto-refresh-cron: "0 */30 * * * *"  # Auto-refresh every 30 minutes
    refresh-on-startup: true             # Trigger asynchronous refresh on boot
  cors:
    allowed-origins:
      - "http://localhost:3000"
      - "http://127.0.0.1:3000"
```

### Dev Mode (`MockProfileClient`)
To run or test the frontend without hitting LeetCode's servers or rate limits, activate the `dev` profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
This enables `MockProfileClient`, which generates deterministic stats based on username hashes.

---

## Setup & Running

### 1. Prerequisites
- **Java 17+** (tested on Java 18)
- **Maven 3.8+**
- **Node.js 18+** (tested on Node v22.18)

### 2. Run the Backend
```bash
cd backend

# Run automated tests (17 unit + 10 MockMvc/integration tests)
mvn test

# Package executable JAR
mvn package -DskipTests

# Run the Spring Boot server (Production mode - hits LeetCode GraphQL)
mvn spring-boot:run

# Or run with dev mock data
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
The backend starts at `http://localhost:8080`.

### 3. Run the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start development server
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

---

## REST API Documentation

### 1. `GET /api/v1/leaderboard`
Returns the cached leaderboard snapshot.

**Query Parameters:**
- `sortBy` *(optional, string)*: `solved` (default), `streak`, `rating`
- `order` *(optional, string)*: `desc` (default), `asc`

**Response (`200 OK`):**
```json
{
  "lastUpdated": "2026-11-17T13:45:00Z",
  "refreshing": false,
  "entries": [
    {
      "rank": 1,
      "displayName": "Aarav Sharma",
      "username": "lee215",
      "totalSolved": 702,
      "easySolved": 127,
      "mediumSolved": 421,
      "hardSolved": 154,
      "currentStreak": 14,
      "contestRating": 2204.3,
      "contestsAttended": 27,
      "status": "OK",
      "errorMessage": null,
      "fetchedAt": "2026-11-17T13:45:00Z"
    }
  ]
}
```

### 2. `POST /api/v1/leaderboard/refresh`
Triggers an asynchronous background refresh. Returns immediately without blocking the request thread.

**Responses:**
- `202 Accepted`: Refresh triggered successfully.
  ```json
  {
    "state": "RUNNING",
    "completed": 0,
    "total": 50,
    "startedAt": "2026-11-17T13:46:00Z",
    "finishedAt": null
  }
  ```
- `409 Conflict`: Another refresh is already running. Returns the current refresh progress.

### 3. `GET /api/v1/leaderboard/status`
Returns the progress of the active or most recent refresh.

**Response (`200 OK`):**
```json
{
  "state": "RUNNING",
  "completed": 24,
  "total": 50,
  "startedAt": "2026-11-17T13:46:00Z",
  "finishedAt": null
}
```

### 4. Error Responses
All errors follow a unified schema with **no server stack traces**:
```json
{
  "timestamp": "2026-11-17T13:47:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid 'sortBy' parameter: 'foo'. Allowed values: solved, streak, rating.",
  "path": "/api/v1/leaderboard"
}
```

---

## Concurrency & Resilience Engineering

1. **Host-Level Rate Limiting**: Outbound requests are governed by `RateLimiter`, ensuring request starts are spaced apart by at least `baseIntervalMs` (400ms) + random jitter (up to 100ms) across all threads.
2. **Per-Task Timeouts**: Each member fetch is bounded with `CompletableFuture.orTimeout(10, TimeUnit.SECONDS)`. A hung or lagging request times out without delaying the rest of the batch.
3. **Resilience & Stale Caching**: If a fetch fails due to timeout, rate limiting (`HTTP 429`), or server errors, `ScraperService` checks `LeaderboardCache` for the member's last known good stats. If found, it returns the cached data with status `STALE` and the error reason. Never fabricates fake data.
4. **No Double Refreshes**: Refreshes acquire an atomic reservation lock. If another refresh is in progress, the API immediately rejects the request with `409 Conflict` and current batch progress.

---

## Known Limitations & Caveats

1. **Unofficial GraphQL Endpoint**:
   LeetCode does not provide an officially supported public REST/GraphQL API for developer integrations. The endpoint (`https://leetcode.com/graphql`) is reverse-engineered from LeetCode's web application. All query string templates and JSON extraction logic are strictly encapsulated in `LeetCodeClient` and `LeetCodeGraphQLParser` so schema updates can be accommodated in one isolated place.
2. **Cloudflare / IP Rate Limiting**:
   If deployed to public cloud IPs (AWS, GCP, Azure, DigitalOcean), LeetCode's Cloudflare protections may block requests or respond with Cloudflare Turnstile CAPTCHAs. For production deployments, requests should originate from residential/dedicated proxy IPs, or the refresh interval and pool size should be conservative.
3. **Private Profiles**:
   LeetCode allows users to hide or restrict submission details in their account privacy settings. Profiles set to private return 0 problem counts or missing data in the GraphQL response; these appear with appropriate badge notes.
4. **Static HTML Scraping with JSoup**:
   LeetCode profile pages are client-rendered single-page applications using Next.js and React. The raw HTML returned by JSoup contains only the empty React container shell, not the problem breakdown metrics or ratings. `JsoupFallbackClient` is included as a fallback behind `ProfileClient`, and explicitly documents this constraint by returning `ERROR` rather than manufacturing fake data.
