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
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For Google sign-in | OAuth 2.0 **Web** client ID from Google Cloud Console. Must match backend `GOOGLE_CLIENT_ID`. |

**Android emulator:** use `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000` so the emulator can reach the backend on your host machine.

**Physical device:** use your computer's LAN IP, e.g. `http://192.168.1.10:4000`.

### Google Sign-In setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. Enable the Google+ / Google Identity APIs if prompted.
3. Create an **OAuth 2.0 Client ID** of type **Web application**.
4. Copy the client ID into:
   - `mobile/.env` → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - `backend/.env` → `GOOGLE_CLIENT_ID` (same value)
5. For Expo Auth Session, add authorized redirect URIs as needed (Expo Go uses the proxy; dev builds use `memora://` scheme from `app.config.ts`).

Google sign-in uses `expo-auth-session` (works in Expo Go). For native Google Sign-In in a custom dev client, consider `@react-native-google-signin/google-signin` instead.

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

## Testing auth

1. Start the backend (`cd backend && npm run dev`).
2. Set `EXPO_PUBLIC_API_URL` in `mobile/.env`.
3. Run `npx expo start` and open the app.
4. **Register:** Create account tab → fill name, email, password → Create account.
5. **Login:** Sign out from Profile tab → sign in with email/password.
6. **Google:** Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` → tap Continue with Google on Login or Register.
7. **Auto-login:** Close and reopen the app; Splash should restore the session and land on main tabs.
8. **Logout:** Profile tab → Log out → returns to Login.
