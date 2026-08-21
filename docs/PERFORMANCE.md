# BrickApp — making it fast

Branch: `perf/instant-load`

This covers what was wrong, what changed, and the three things you need to do in
the Azure portal. The portal changes matter as much as the code — do those first.

---

## 1. What was actually wrong

Measured against the live app before any changes:

| Measurement | Cold | Warm |
|---|---|---|
| Time to first byte on the page | **46,219 ms** | 37 ms |
| `/api/dashboard/stats` | 502 | 59 ms |
| `/api/products` | 502 | 32 ms |
| WebSocket | connection error | connects in 97 ms |

The application code was never slow. Warm, every endpoint answered in tens of
milliseconds. Three separate problems combined to make it feel broken:

**The worker was being unloaded.** Azure App Service stops the Node process
after an idle period unless Always On is set. The next visitor pays a full cold
start, and while it happens Azure's front end returns 502/503 for *everything* —
API calls and static JavaScript files alike.

**The frontend had no answer for that.** Routes are lazy-loaded, so a chunk
request that landed in the 502 window threw `Failed to fetch dynamically imported
module`. With no error boundary and no retry, React unmounted the entire tree:
the white screen you were looking at.

**A transient error logged you out.** `AuthContext.fetchUser` called `logout()`
in its catch block for *any* error. One 502 during a cold start wiped the session
and bounced the user to the login page — indistinguishable from an expired token.

---

## 2. Do these three things in the Azure portal

App Service → **brickapp-app** → these are all under Settings.

### Always On — already enabled, and that changes the diagnosis

You confirmed Always On was set at initial deployment. That is worth taking
seriously, because it rules out my original explanation.

If the worker was not being unloaded for idleness, then the 46-second time to
first byte and the site-wide 502/503 window were caused by the container
**restarting** — a crash, a platform recycle, or a deploy in flight. The app
came back on its own about two minutes later, which fits a restart rather than
a cold start from idle.

That makes the following changes the load-bearing ones, rather than nice-to-haves:

- `keepAliveTimeout` (a genuine, independent cause of intermittent 502s)
- graceful shutdown on SIGTERM, so a recycle drains instead of erroring
- the `unhandledRejection` / `uncaughtException` handlers in `server.js`, which
  stop one bad request taking down the whole worker

**Before deploying, find out what actually restarted it.** Two places to look:

```bash
az webapp log tail --name brickapp-app --resource-group <your-rg>
```

and in the portal: `Diagnose and solve problems → Availability and Performance →
Application Restarts` (also worth checking "Container Crash"). If the logs show a
repeated crash, that is the real bug and none of the above fixes its cause — it
only stops the crash from being visible to users. Send me what you find.

### Health check

`Monitoring → Health check → Enable → Path: /api/health → Save`

`/api/health` already exists and has been made deliberately cheap — it does not
touch the database, so a busy database can never cause Azure to recycle a healthy
instance. It now also reports `503 draining` during shutdown, which lets Azure
take the instance out of rotation before it stops accepting connections.

### WebSockets

`Configuration → General settings → Web sockets → On → Save`

Needed for chat. It appeared to be on already — the socket connected in 97 ms
when the app was warm — but confirm it.

### One app setting

`Configuration → Application settings → New application setting`

| Name | Value |
|---|---|
| `WEBSITES_CONTAINER_STOP_TIME_LIMIT` | `30` |

Linux App Service gives a container ~5 seconds to stop by default. The new
graceful-shutdown handler needs a little longer to drain in-flight requests;
without this, a deploy or recycle still turns live requests into 502s.

### If you ever scale past one instance

`socket.io` keeps connection state in process memory. With two or more instances
you need either session affinity on (`Configuration → General settings → Session
affinity`) or a Redis adapter for socket.io. At one instance this is moot.

---

## 3. What changed in the code

### Nothing asks the user to retry

- **`src/lib/lazyWithRetry.js`** — every route import retries with backoff
  (300 ms, 600 ms, 1.2 s). If it still fails, the most likely cause is a deploy
  having replaced the asset hashes mid-session, so the page reloads once — guarded
  by a `sessionStorage` flag so it can never loop.
- **`src/components/ErrorBoundary.jsx`** — retries the failed subtree itself,
  five times quickly and then every 15 seconds indefinitely. Early attempts look
  like an ordinary loading state. There is no retry button anywhere.
- **`src/lib/http.js`** — silent retry with jittered backoff on 408/425/429/5xx
  and network failures, for idempotent verbs only. A POST is never replayed, so
  a retry can't create a duplicate order.

### Screens appear instantly

- **`src/lib/cache.js` + `src/hooks/useQuery.js`** — stale-while-revalidate. Every
  screen renders from its last-known data on the first frame and refreshes
  underneath. Verified at **82 ms to first content** on a revisit.
- **`src/lib/prefetch.js`** — hovering a nav link starts downloading that route's
  code *and* its first data call. Remaining routes are pulled in during idle time
  after first paint. Skipped on metered or 2G connections.
- **`public/sw.js`** — precaches the shell, serves hashed assets cache-first, and
  falls back to the last good API response when the backend is down.
- **`src/components/Skeletons.jsx`** — placeholders shaped like the real layout,
  so nothing jumps when data lands.

### The critical path is 78% smaller

| | Before | After |
|---|---|---|
| Critical path (brotli) | ~459 KB | **102 KB** |
| Critical path (raw) | ~1.4 MB | 361 KB |
| Files needed to render | — | 4 |

Four separate causes, in order of size:

1. **A chunking bug.** Rollup's CommonJS proxy for jsPDF was being routed to the
   eager vendor chunk while jsPDF itself went to the lazy chunk. That single
   mismatched edge dragged all 672 KB of PDF library onto every page load.
   Normalising module ids before matching fixed it.
2. **Transitive dependencies left behind.** `dompurify`, `decimal.js-light`,
   `fflate`, `react-smooth`, `svg-pathdata` and friends stayed in the shared
   vendor chunk while their parent libraries were correctly lazy — about 200 KB
   of chart and PDF internals loading eagerly. They now follow their parents.
3. **Deferred what first paint doesn't need.** jsPDF now loads when someone
   actually exports an invoice; recharts when the charts render; socket.io when
   chat connects; framer-motion with the login screen; the chat widget after the
   app is interactive.
4. **Icon fragmentation.** `lucide-react` was being split into ~17 separate 1 KB
   chunks (`crown`, `printer`, `shopping-bag`…) — 17 extra round trips and 17
   more things to fail during a restart. Now one 16 KB chunk.

### Server

- **`server.js`** — `keepAliveTimeout` raised to 120 s. Azure's front end holds
  idle upstream connections for ~240 s while Node's default is 5 s; when the
  front end reuses a socket Node has just closed, the client gets a 502 that
  never reached the app. This is a well-known cause of intermittent 502s on App
  Service and is very likely part of what you were seeing.
- **`server.js`** — graceful shutdown on SIGTERM: stop accepting, drain, close
  the pool, exit. Deploys and recycles stop producing errors in users' browsers.
- **`src/middleware/auth.js`** — the three-table join with two `json_agg`s that
  ran on *every* authenticated request is now cached for 30 s per user and
  deduplicated in flight. A dashboard load ran it five times; now once.
  Invalidated when a user's roles change.
- **`src/middleware/auth.js`** — a database failure returns **503**, not 401. It
  can no longer be mistaken for an expired session.
- **`src/middleware/microCache.js`** — 20-second response cache on dashboard
  reads, keyed by user *and* branch, cleared by any write.

---

## 4. Deploying

### Applying the patch

`git am` strips carriage returns by default. Most files in this repo use CRLF
line endings, so the stripped context no longer matches the working tree and the
apply fails. Use:

```bash
git checkout -b perf/instant-load
git am --keep-cr < brickapp-performance.patch
```

Do **not** normalise the patch file to LF to work around this. That would rewrite
every line of every touched file to LF, which is both a much larger diff than
intended and would still fail to match the CRLF content already committed.

### Building and deploying

```bash
# 1. Build the frontend into the folder the backend serves
cd frontend
npm ci
npm run build
rm -rf ../backend/public
cp -r dist ../backend/public

# 2. Deploy as you normally do (zip deploy / VS Code / CI)

# 3. Add the database indexes - safe to run repeatedly, changes no data
psql "$DATABASE_URL" -f database/perf-indexes.sql
```

`public/sw.js` is copied into `dist/` by Vite automatically and must be served
from the site root so its scope covers the whole app. The backend already sets
`Cache-Control: no-cache` on it and on `index.html`, while `/assets/*` stays
immutable for a year.

---

## 5. How this was verified

A production build was run against a stub backend in headless Chromium, with the
API forced to return 502 on demand. 13 of 13 checks passed:

```
PASS  signs in and stores a session
PASS  dashboard renders real figures
PASS  no blank screen while the API is 502ing
PASS  a 502 does NOT log the user out
PASS  not bounced to the login screen
PASS  no retry button shown to the user
PASS  recovers on its own once the server is back
PASS  reload during an outage still renders the app
PASS  session survives a reload during an outage
PASS  cached screen paints fast on revisit          — 82ms to first content
PASS  no unexpected JavaScript errors
PASS  a failing route chunk retries instead of blanking the page
PASS  the route eventually loads after its chunk recovers
```

The last two reproduce your exact failure: the route's JavaScript chunk was made
to fail twice before succeeding. Previously that was a white screen; now it
retries and loads, with the user seeing only a brief skeleton.

Separately, the response cache was checked for isolation — a different user or a
different branch never receives another's cached data, and any write clears it.

### What was not verified

- **Real Azure behaviour.** Everything above ran locally. The cold-start
  improvement depends on the Always On toggle, which only you can set.
- **The database indexes.** `database/seed.sql` is empty in the repo, so table and
  column names were inferred from the model files. The script skips anything that
  doesn't exist rather than failing — check its `NOTICE` output when you run it,
  and tell me if lines say `skipped`.
- **Load under real concurrency.** The caching should help considerably, but it
  hasn't been measured with many simultaneous users.

---

## 6. Two things to keep an eye on

**The service worker is new.** It makes repeat loads instant, but service workers
are sticky: once installed, a bad version can outlive its own fix until a client
hits an update check. The registration mitigates this — new versions activate
immediately rather than waiting for every tab to close, and it re-checks hourly.

On whether it earns its keep for a two-person internal tool: the argument for
keeping it got *stronger*, not weaker, once Always On turned out to be enabled.
The outage you hit was a restart, and restarts keep happening — deploys, platform
maintenance. The service worker is the piece that keeps the app open and usable
through them. But it is a defensible call either way.

To remove it: delete `frontend/public/sw.js` and the `registerServiceWorker()`
call in `src/main.jsx`, then deploy. Existing workers unregister on their next
update check when `/sw.js` starts returning 404.

**Cached data is per-device.** The stale-while-revalidate cache and the service
worker both store API responses in the browser. Both are cleared on logout. If
BrickApp is ever used on a shared machine, that's the mechanism keeping one
user's figures away from the next.
