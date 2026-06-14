# EAS Build Upload Size Audit

**Date:** June 13, 2026  
**Project:** Memora AI — `mobile/`  
**Reported EAS archive:** 9.3 GB (limit: 2 GB)

---

## Root cause

The upload ballooned because **EAS was archiving far more than the Expo app source**, not because the Memora mobile app itself is multi-gigabyte.

### Primary cause: Git repository root is `Desktop/` (~13 GB)

```
git rev-parse --show-toplevel
→ C:/Users/ayoob bhat/Desktop
```

The Desktop folder contains many unrelated projects:

| Directory | Size |
|-----------|------|
| Bungus_Valley | ~7.0 GB |
| aleeza_travels | ~1.6 GB |
| e_commerce | ~0.9 GB |
| ssbfy | ~0.6 GB |
| OrchardLink | ~0.4 GB |
| **memora ai** | **~0.4 GB** |

When EAS resolves files via Git or when the build is run from the wrong working directory, sibling Desktop folders can be included in the archive. **9.3 GB matches uploading most of the Desktop tree**, not `mobile/` alone.

### Secondary contributors (within `memora ai/`)

| Path | Size | Should upload? |
|------|------|----------------|
| `mobile/node_modules/` | ~289 MB | No — EAS runs `npm ci` |
| `backend/node_modules/` | ~121 MB | No — not part of mobile build |
| `mobile/android/` | ~0.6 MB | No — prebuild on EAS |
| `mobile/.expo/` | ~0.3 MB | No — local cache |

### Not found in project

No APKs, AABs, ZIP archives, PDFs, videos, or dataset files under `memora ai/`.

---

## Top 20 largest directories

### `mobile/` (local scan)

| # | Directory | Size |
|---|-----------|------|
| 1 | `node_modules/` | 289.44 MB |
| 2 | `node_modules/hermes-compiler/` | 46.21 MB |
| 3 | `node_modules/expo-modules-core/prebuilds/` | 26.70 MB |
| 4 | `node_modules/@expo/` | 23.68 MB |
| 5 | `node_modules/typescript/` | 23.22 MB |
| 6 | `node_modules/react-native/` | 20.68 MB |
| 7 | `node_modules/@react-native/` | 20.45 MB |
| 8 | `node_modules/expo/` | 17.99 MB |
| 9 | `node_modules/react-devtools-core/` | 16.07 MB |
| 10 | `node_modules/@react-native/debugger-frontend/` | 15.73 MB |
| 11 | `android/` | 0.59 MB |
| 12 | `assets/` | 0.49 MB |
| 13 | `.expo/` | 0.34 MB |
| 14 | `src/` | 0.16 MB |

### `memora ai/` (repo)

| # | Directory | Size |
|---|-----------|------|
| 1 | `mobile/` | 290.93 MB |
| 2 | `backend/` | 121.16 MB |
| 3 | `docs/` | 0.02 MB |

### `Desktop/` (git root — why EAS can exceed 2 GB)

| # | Directory | Size |
|---|-----------|------|
| 1 | Bungus_Valley | ~7.0 GB |
| 2 | aleeza_travels | ~1.6 GB |
| 3 | e_commerce | ~0.9 GB |
| 4 | ssbfy | ~0.6 GB |
| 5 | OrchardLink | ~0.4 GB |
| 6 | memora ai | ~0.4 GB |

---

## Top 20 largest files (project-wide, incl. node_modules)

| # | File | Size |
|---|------|------|
| 1 | `mobile/node_modules/hermes-compiler/.../icudt64.dll` | 26.26 MB |
| 2 | `mobile/node_modules/@expo/expo-modules-macros-plugin/...` | 14.17 MB |
| 3 | `mobile/node_modules/expo-modules-core/prebuilds/.../debug.xcframework` | 13.61 MB |
| 4 | `mobile/node_modules/expo-modules-core/prebuilds/.../release.xcframework` | 12.00 MB |
| 5 | `backend/node_modules/@esbuild/win32-x64/esbuild.exe` | 11.13 MB |
| 6 | `backend/node_modules/vite/.../esbuild.exe` | 10.86 MB |
| 7 | `mobile/node_modules/lightningcss-win32-x64-msvc/...` | 9.06 MB |
| 8 | `mobile/node_modules/typescript/lib/typescript.js` | 8.72 MB |
| 9 | `backend/node_modules/typescript/lib/typescript.js` | 8.69 MB |
| 10 | `mobile/node_modules/hermes-compiler/.../hermesc` (macOS) | 8.45 MB |
| 11–20 | Additional `node_modules` binaries and maps | 2–6 MB each |

Largest non-`node_modules` file: `mobile/assets/icon.png` (0.38 MB).

---

## Changes made

### Updated `mobile/.easignore`

Expanded to exclude:

- `node_modules/`, `.expo/`, `.expo-shared/`
- Entire `android/` and `ios/` (plus `android/app/build`, `android/build`, Gradle caches)
- `coverage/`, `dist/`, `build/`, logs, caches, temp files
- Archives (`*.zip`, `*.apk`, `*.aab`, …), PDFs, videos
- Monorepo siblings (`../backend/`, `../docs/`) as a safety net

### Updated `mobile/eas.json`

Added `"requireCommit": false` so EAS does not depend on the Desktop-level Git state for packaging.

### Safe local cleanup

Removed regenerable artifacts:

- `mobile/.expo/` (Expo cache — recreated on `expo start`)
- No `android/app/build` or `android/build` present locally (nothing to delete)

**Not removed:** `node_modules/` (needed for local dev; excluded from upload via `.easignore`).

---

## Expected archive size after fix

| Scenario | Estimated upload |
|----------|------------------|
| **Correct:** `eas build` from `mobile/` with updated `.easignore` | **~1–5 MB** (source, assets, config, lockfile) |
| **Wrong:** Desktop git root included | **Up to ~13 GB** — will fail |

Measured source-only payload (excluding all `.easignore` patterns): **~0.9 MB**.

---

## Required actions before next EAS build

1. **Always run EAS from the mobile directory:**
   ```bash
   cd mobile
   npx eas-cli build --platform android --profile production
   ```

2. **Fix Git scope (strongly recommended):** Initialize a dedicated repository for Memora AI so EAS never sees Desktop siblings:
   ```bash
   cd "memora ai"
   git init
   git add .
   git commit -m "Initial Memora AI commit"
   ```
   Alternatively, move `memora ai/` out of the Desktop git repo.

3. **Verify upload size before building:**
   ```bash
   cd mobile
   npx eas-cli build:inspect --platform android --profile production --stage archive --output ./eas-archive-preview
   ```
   Inspect the generated tarball; it should be well under 2 GB (typically a few MB).

4. **Do not commit** `node_modules/`, `android/build/`, `.expo/`, or APK/AAB outputs.

---

## Production checklist (EAS upload)

- [ ] `.easignore` present in `mobile/`
- [ ] Build command run from `mobile/`, not Desktop or repo root
- [ ] Git root is `memora ai/` (not `Desktop/`)
- [ ] No local `android/app/build` or multi-GB artifacts in tree
- [ ] `eas build:inspect` archive < 100 MB
- [ ] EAS dashboard shows project archive < 2 GB
