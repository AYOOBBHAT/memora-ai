# Android Share Extension

Memora accepts shared **plain text** and **URLs** from other Android apps (Chrome, WhatsApp, X, Instagram, etc.) via the system share sheet.

> **Requires a development build or EAS build.** Share intents use native code (`expo-share-intent`) and do **not** work in Expo Go.

## Build

```bash
cd mobile
npm install
npx expo prebuild --platform android --clean
npx expo run:android
```

Or use EAS:

```bash
eas build --profile development --platform android
```

## Configure backend URL

Set `EXPO_PUBLIC_API_URL` in `.env` (or in `eas.json` for EAS builds). For the Android emulator, use `http://10.0.2.2:4000`.

## Manual test (device / emulator)

1. Install a **development** or **preview** build (not Expo Go).
2. Sign in to Memora.
3. Open Chrome (or any app) with a URL or text selected.
4. Tap **Share** → choose **Memora**.
5. Memora opens **Save to Memora** with a title preview and collection picker.
6. Tap **Save to Memora** → **View document** to open the new document.

### Test with adb (Android)

Send a plain-text share intent to the main activity:

```bash
adb shell am start -a android.intent.action.SEND -t text/plain \
  --es android.intent.extra.TEXT "https://example.com/article" \
  com.memora.mobile/.MainActivity
```

Share a text note:

```bash
adb shell am start -a android.intent.action.SEND -t text/plain \
  --es android.intent.extra.TEXT "Meeting notes from share extension" \
  com.memora.mobile/.MainActivity
```

## Behavior

| Shared content | API used | Notes |
|----------------|----------|-------|
| URL only | `POST /documents/import-url` | Page content fetched; `originalUrl` stored in metadata |
| Plain text | `POST /documents` (`sourceType: text`) | Full text saved with `sharedFrom: android-share` metadata |
| Text + URL | Text document if URL is not primary; otherwise URL import | Title from first line or hostname |

If the user is **not signed in**, the share payload is buffered (AsyncStorage). After login, the **Save to Memora** screen opens automatically.

## iOS

iOS share extension is **disabled** (`disableIOS: true` in `app.config.ts`). Android only.
