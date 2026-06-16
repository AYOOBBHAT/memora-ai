# Memora Mobile

Expo + TypeScript React Native client for Memora AI.

## Setup

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API base URL (no trailing slash). Default: `http://localhost:4000` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For Google sign-in | OAuth 2.0 **Web** client ID. Must match backend `GOOGLE_CLIENT_ID`. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | For Play Store Android | OAuth 2.0 **Android** client ID. Must match backend `GOOGLE_ANDROID_CLIENT_ID`. |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | For Profile legal links | Deployed Privacy Policy URL (e.g. `https://your-domain/privacy`) |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` | For Profile legal links | Deployed Terms of Service URL (e.g. `https://your-domain/terms`) |

**Android emulator:** use `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000` so the emulator can reach the backend on your host machine.

**Physical device:** use your computer's LAN IP, e.g. `http://192.168.1.10:4000`.

### Google Sign-In setup

See **[docs/google-auth-setup.md](../docs/google-auth-setup.md)** for full Play Store setup (OAuth consent screen, Web + Android clients, SHA-1 fingerprints, EAS secrets).

Quick start:

1. Create **Web** OAuth client → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` + backend `GOOGLE_CLIENT_ID`
2. Create **Android** OAuth client (`com.memora.mobile` + SHA-1) → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` + backend `GOOGLE_ANDROID_CLIENT_ID`
3. Android client is required for EAS preview APK and Play Store builds; Web-only config still works in Expo Go / dev

## Auth screens

- **Splash** — hydrates tokens from SecureStore, validates session via `GET /auth/me`, then routes to auth or main tabs.
- **Login / Register** — email/password + Continue with Google.
- **Forgot Password** — placeholder UI.
- **Profile tab** — minimal placeholder with Log out for testing.
- **Collections tab** — list, create, edit, and delete collections; view documents in a collection (read-only).

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run typecheck` | Run TypeScript check |

## Android share extension

Share text/URLs from other apps into Memora. Requires a **development or EAS build** (not Expo Go). See [docs/ANDROID_SHARE.md](./docs/ANDROID_SHARE.md).

## Testing auth

1. Start the backend (`cd backend && npm run dev`).
2. Set `EXPO_PUBLIC_API_URL` in `mobile/.env`.
3. Run `npx expo start` and open the app.
4. **Register:** Create account tab → fill name, email, password → Create account.
5. **Login:** Sign out from Profile tab → sign in with email/password.
6. **Google:** Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` → tap Continue with Google on Login or Register.
7. **Auto-login:** Close and reopen the app; Splash should restore the session and land on main tabs.
8. **Logout:** Profile tab → Log out → returns to Login.
