# Google Authentication Setup (Play Store Ready)

Memora uses **Sign in with Google** via `expo-auth-session` on mobile and verifies ID tokens on the backend with `google-auth-library`. This guide covers Google Cloud Console setup, environment variables, EAS builds, and Play Store release requirements.

## Architecture overview

```
Mobile app (expo-auth-session)
  → obtains Google ID token (JWT)
  → POST /api/v1/auth/google { idToken }
Backend (google-auth-library)
  → verifies signature, expiry, issuer
  → verifies aud claim against allowed client IDs
  → creates or links user, returns Memora JWT tokens
```

### Client IDs and token audiences

| Build type | Mobile env var | Token `aud` (audience) | Backend must accept |
|------------|----------------|------------------------|---------------------|
| Expo Go / dev (web flow) | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web client ID | `GOOGLE_CLIENT_ID` |
| EAS dev client / preview APK | Web + Android client IDs | Android client ID on native Android | `GOOGLE_ANDROID_CLIENT_ID` (+ Web) |
| Play Store (internal / production) | Web + Android client IDs | Android client ID | `GOOGLE_ANDROID_CLIENT_ID` (+ Web) |

**Important:** Web client verification (`GOOGLE_CLIENT_ID`) is always required and is never removed. Android client ID is additive — existing Expo Go and web-flow sign-in continue to work unchanged.

---

## 1. Google Cloud Console setup

### Create or select a project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (e.g. **Memora AI**) or select an existing one.
3. Enable **Google Identity** / ensure OAuth is available (no separate API enablement is usually required for basic sign-in).

### OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** (required for public Play Store app) or **Internal** (Workspace-only testing).
3. Fill in:
   - **App name:** Memora
   - **User support email:** your support address
   - **Developer contact email:** your contact address
4. Add scopes (minimal):
   - `openid`
   - `email`
   - `profile`
5. Add **Test users** while in **Testing** publishing status (required for non-verified apps during development).
6. Before public Play Store release, submit for **Verification** if you use sensitive scopes (Memora uses only basic profile scopes).

### Create OAuth 2.0 credentials

Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.

#### Web client (required)

| Field | Value |
|-------|-------|
| Application type | **Web application** |
| Name | `Memora Web` (or similar) |

**Authorized JavaScript origins** (optional for mobile-only; add if you have a web app):

- `https://auth.expo.io` (Expo auth proxy / development)

**Authorized redirect URIs** (for Expo auth session):

- `https://auth.expo.io/@your-expo-username/memora-mobile`
- Custom scheme redirect used by standalone builds: `memora:/oauthredirect` (scheme from `app.config.ts`)

Copy the **Client ID** → set as:

- Backend: `GOOGLE_CLIENT_ID`
- Mobile: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### Android client (required for Play Store)

| Field | Value |
|-------|-------|
| Application type | **Android** |
| Name | `Memora Android` |
| Package name | `com.memora.mobile` |

**SHA-1 certificate fingerprints** — add **all** that apply (Google Cloud allows multiple fingerprints on one Android client):

| Build | How to get SHA-1 |
|-------|------------------|
| Local debug | `keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android` |
| EAS build keystore | `eas credentials -p android` → view keystore SHA-1 |
| Play App Signing (production) | Play Console → **Setup → App signing** → **App signing key certificate** SHA-1 |

Copy the **Client ID** → set as:

- Backend: `GOOGLE_ANDROID_CLIENT_ID`
- Mobile: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

> **Play Store note:** After enabling Google Play App Signing, users download builds signed with Google's key. You **must** add the **App signing key certificate SHA-1** from Play Console to your Android OAuth client, or production Google Sign-In will fail with `invalid_audience` / `12500` errors.

---

## 2. Environment variables

### Backend (`backend/.env`)

```env
# Required — Web OAuth client ID (always verified)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com

# Required for Play Store / EAS Android — Android OAuth client ID
GOOGLE_ANDROID_CLIENT_ID=123456789-xyz.apps.googleusercontent.com
```

### Mobile (`mobile/.env` or EAS Secrets)

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xyz.apps.googleusercontent.com
```

### EAS Secrets (production / preview)

```bash
cd mobile
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "<web-client-id>" --scope project
eas secret:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "<android-client-id>" --scope project
```

Set the same Android client ID on your **production backend** deployment (`GOOGLE_ANDROID_CLIENT_ID`).

See also [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

---

## 3. Memora app configuration

| Setting | Value | Location |
|---------|-------|----------|
| Android package | `com.memora.mobile` | `mobile/app.config.ts` |
| URL scheme | `memora` | `mobile/app.config.ts` |
| EAS project | configured in `extra.eas.projectId` | `mobile/app.config.ts` |

Mobile Google Sign-In implementation:

- `mobile/src/lib/googleSignIn.ts` — `useIdTokenAuthRequest` with `clientId` (Web) + `androidClientId` (Android)
- `mobile/src/features/auth/components/GoogleSignInButton.tsx` — triggers OAuth, sends `idToken` to backend

Backend verification:

- `backend/src/services/googleAuth.service.ts` — `verifyGoogleIdToken()` accepts Web and Android audiences

---

## 4. Build and test matrix

### Expo development (Expo Go or dev client)

1. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and backend `GOOGLE_CLIENT_ID`.
2. Android client ID optional for Expo Go (uses web flow).
3. Run backend + mobile; tap **Continue with Google** on Login.

### EAS preview APK (`eas build --profile preview -p android`)

1. Set both Web and Android client IDs in EAS secrets or profile `env`.
2. Ensure EAS keystore SHA-1 is registered on the Android OAuth client.
3. Set backend `GOOGLE_ANDROID_CLIENT_ID`.
4. Install APK; verify Google sign-in completes and `/auth/google` returns tokens.

### Internal testing (Play Console)

1. Upload AAB from `eas build --profile production -p android`.
2. Add **Play App Signing** SHA-1 to Android OAuth client if not already added.
3. Promote to **Internal testing** track; install from Play Store link.
4. Verify Google sign-in on a physical device.

### Play Store production

1. OAuth consent screen published (verified if required).
2. All SHA-1 fingerprints registered (EAS upload key + Play App Signing key).
3. Backend production env has both `GOOGLE_CLIENT_ID` and `GOOGLE_ANDROID_CLIENT_ID`.
4. EAS production secrets set for both mobile client IDs.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Google Sign-In is not configured` | Missing Web client ID on mobile | Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| `503 Google authentication is not configured` | Missing backend Web client ID | Set `GOOGLE_CLIENT_ID` |
| `401 Invalid or expired Google ID token` | Wrong audience / client mismatch | Ensure Android token verified with `GOOGLE_ANDROID_CLIENT_ID` on backend |
| `DEVELOPER_ERROR` / `12500` on Android | SHA-1 or package name mismatch | Add correct SHA-1 for the signing key that built the APK/AAB |
| Works in debug, fails on Play Store | Missing Play App Signing SHA-1 | Add App signing certificate SHA-1 from Play Console |
| `Access blocked: app not verified` | OAuth consent in Testing mode | Add test users or complete verification |
| Sign-in cancelled immediately | Redirect URI mismatch | Check Expo redirect URIs and `scheme: memora` |

### Verify backend audiences

Run the startup checklist:

```bash
cd backend
npm run startup-checklist
```

Expect:

```
✓ GOOGLE_CLIENT_ID configured (Web client — required)
✓ GOOGLE_ANDROID_CLIENT_ID configured (Android client — Play Store ready)
```

---

## 6. Security notes

- Never commit `.env` files with real client IDs to public repos (client IDs are not secrets, but keep config hygiene).
- Do **not** remove Web client verification — Android support is additive.
- Backend only accepts tokens whose `aud` matches configured client IDs.
- ID tokens are short-lived; Memora issues its own JWT access/refresh tokens after verification.

---

## 7. Pre–Play Store release checklist

- [ ] OAuth consent screen configured (External, test users or verified)
- [ ] Web OAuth client created → `GOOGLE_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- [ ] Android OAuth client created for `com.memora.mobile`
- [ ] Debug SHA-1 added (local development)
- [ ] EAS keystore SHA-1 added (preview / internal APK)
- [ ] Play App Signing SHA-1 added (production Play Store installs)
- [ ] Backend `GOOGLE_ANDROID_CLIENT_ID` set in production
- [ ] EAS secrets for both mobile client IDs
- [ ] Google sign-in tested on: dev build → preview APK → internal testing track
- [ ] Privacy Policy URL configured (Profile screen legal link)

---

## Related docs

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
