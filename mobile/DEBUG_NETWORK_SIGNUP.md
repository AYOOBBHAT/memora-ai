# Signup Network Error — Debug Report

> **Status:** Temporary diagnostics added. No functional fixes applied.

## Root cause (most likely)

**The preview EAS build profile bakes in a wrong `EXPO_PUBLIC_API_URL`.**

In `eas.json` → `build.preview.env`:

```json
"EXPO_PUBLIC_API_URL": "https://192.168.1.9:4000/api/v1"
```

Two problems compound:

| Issue | Effect |
|-------|--------|
| **`https://` instead of `http://`** | Backend serves plain HTTP (browser test used `http://192.168.1.9:4000`). Axios tries TLS to a non-TLS server → connection fails → generic **"Network Error"** (no `response`). |
| **`/api/v1` already in env value** | `client.ts` appends `API_VERSION_PATH` (`/api/v1`) again → effective base URL becomes `https://192.168.1.9:4000/api/v1/api/v1`. Even after fixing the scheme, signup would hit the wrong path. |

Postman and the Android browser work because they use **`http://192.168.1.9:4000`** directly. The APK does not use `.env` at runtime — it uses whatever was embedded at **EAS build time** from the profile's `env` block.

### Secondary contributors (if using HTTP after fixing the URL)

1. **Cleartext HTTP blocked on release/preview APK** — `android/app/src/main/AndroidManifest.xml` has no `android:usesCleartextTraffic="true"`. Only `src/debug/` and `src/debugOptimized/` manifests enable it. Preview builds APK (release), so HTTP to `192.168.1.9` is blocked on Android 9+ unless cleartext is allowed in the main manifest or a `network_security_config.xml`.

2. **Local `.env` also has `/api/v1` suffix** — `mobile/.env` is `http://192.168.1.9:4000/api/v1`. Dev/Expo runs would double the path to `/api/v1/api/v1` (404, not "Network Error", but still wrong).

3. **Production profile** — Still points to placeholder `https://api.example.com` (no `/api/v1` in env; client adds it → `https://api.example.com/api/v1`).

---

## How `EXPO_PUBLIC_API_URL` is read

| Source | Used at runtime? |
|--------|------------------|
| `process.env.EXPO_PUBLIC_API_URL` in `src/config/env.ts` | **Yes** — this is what the app uses |
| `app.config.ts` → `extra.apiUrl` | **No** — copied at config time but never read by `env.ts` |
| `Constants.expoConfig.extra` | **Not used** anywhere in the mobile app |

Expo inlines `EXPO_PUBLIC_*` variables at **bundle time**. For EAS builds, values come from the profile's `env` block in `eas.json`, not from `.env` on your machine.

### URL per build profile

| Profile | `EXPO_PUBLIC_API_URL` (eas.json) | Resolved Axios `baseURL` (`env.apiUrl + /api/v1`) |
|---------|----------------------------------|---------------------------------------------------|
| **development** | `http://10.0.2.2:4000` | `http://10.0.2.2:4000/api/v1` ✓ |
| **preview** (APK) | `https://192.168.1.9:4000/api/v1` | `https://192.168.1.9:4000/api/v1/api/v1` ✗ |
| **production** | `https://api.example.com` | `https://api.example.com/api/v1` (placeholder) |
| **Local dev** (`.env`) | `http://192.168.1.9:4000/api/v1` | `http://192.168.1.9:4000/api/v1/api/v1` ✗ |

Correct env format (per README): base URL **without** trailing `/api/v1`, e.g. `http://192.168.1.9:4000`.

---

## Why the UI shows "Network Error"

`src/lib/apiError.ts` → `getApiErrorMessage()`:

- If the server returns JSON with `message`, that is shown.
- Otherwise it falls back to `error.message` from Axios.
- When the TCP/TLS connection fails, Axios sets `message` to **`"Network Error"`** and `response` is `undefined`.

Register screen (`RegisterScreen.tsx`) calls `getApiErrorMessage(error, 'Registration failed')` on mutation failure.

---

## Android cleartext HTTP

| Manifest | `usesCleartextTraffic` |
|----------|------------------------|
| `android/app/src/main/AndroidManifest.xml` | **Not set** (defaults to `false` on API 28+) |
| `android/app/src/debug/AndroidManifest.xml` | `true` |
| `android/app/src/debugOptimized/AndroidManifest.xml` | `true` |

No `network_security_config.xml` exists. `app.config.ts` does not set `usesCleartextTraffic` or a cleartext plugin.

**Fix (when ready):** add to main manifest `<application>`:

```xml
android:usesCleartextTraffic="true"
```

Or prefer a domain-scoped `network_security_config.xml` for `192.168.1.9` only.

---

## Hardcoded URL search (`mobile/`)

| Location | Value |
|----------|-------|
| `eas.json` preview | `https://192.168.1.9:4000/api/v1` |
| `eas.json` production | `https://api.example.com` |
| `eas.json` development | `http://10.0.2.2:4000` |
| `.env.example` | `http://localhost:4000` |
| `.env` (local) | `http://192.168.1.9:4000/api/v1` |
| `README.md` | docs only |

No hardcoded API URLs in `src/` — all go through `env.apiUrl`.

---

## Diagnostics added (TEMP — remove after fix)

| File | What is logged |
|------|----------------|
| `src/api/client.ts` | `[API_DEBUG] apiClient init — baseURL:` and `env.apiUrl` on module load |
| `src/api/interceptors.ts` | `[API_DEBUG] request:` method, baseURL, url, full URI before each request |
| `src/api/interceptors.ts` | `[API_DEBUG] axios error:` message, code, status, data, url, baseURL on every failed response |

Look for lines prefixed with **`[API_DEBUG]`**.

---

## How to read logs

### Expo dev (Metro)

```bash
cd mobile && npx expo start
```

Logs appear in the Metro terminal. Trigger signup and watch for `[API_DEBUG]`.

### Physical device / APK (adb logcat)

```bash
adb logcat *:S ReactNativeJS:V
```

Or filter:

```bash
adb logcat | findstr API_DEBUG
```

On signup attempt you should see:

1. Init log with the **actual baked-in baseURL**
2. Request log with full URL (e.g. `POST .../auth/register`)
3. Error log — if `code` is `ERR_NETWORK` / no `status`, connection never reached the server

---

## Fix steps (do not apply until confirmed via logs)

1. **Fix `eas.json` preview env:**
   ```json
   "EXPO_PUBLIC_API_URL": "http://192.168.1.9:4000"
   ```
   (HTTP, no `/api/v1` suffix)

2. **Fix local `.env` the same way:**
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.9:4000
   ```

3. **Rebuild the APK:**
   ```bash
   eas build --profile preview --platform android
   ```

4. **If logs show HTTP blocked after step 1–3**, enable cleartext on the main Android manifest (see above) and rebuild.

5. **Remove TEMP `[API_DEBUG]` logging** from `client.ts` and `interceptors.ts`.

6. **Production:** replace `https://api.example.com` with your real API base URL before shipping.

---

## Quick verification checklist

- [ ] `[API_DEBUG] apiClient init` shows `http://192.168.1.9:4000/api/v1` (not `https://`, not double `/api/v1`)
- [ ] Request full URL is `http://192.168.1.9:4000/api/v1/auth/register`
- [ ] Error log shows `status: 4xx` (server reached) instead of missing `status` with `Network Error`
