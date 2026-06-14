# EAS Build Upload Size Audit

**Date:** 2026-06-14  
**Problem:** EAS reported project archive = **9.3 GB** (max allowed = 2 GB)

---

## Root Cause

**EAS uploads from the git repository root, not from `mobile/`.**

| Setting | Value |
|---------|-------|
| Git root | `C:\Users\ayoob bhat\Desktop` |
| EAS project dir | `memora ai/mobile/` (has `eas.json`) |
| `.easignore` location EAS reads | **Git root only** (`Desktop/.easignore`) |
| `mobile/.easignore` | **Ignored** when git is used (default) |

The Desktop git repo contains ~10 GB of sibling projects. EAS copies everything from the git root except `.git`, `node_modules`, and `.gitignore`/`.easignore` matches. With no root `.easignore` and no root `.gitignore`, **all sibling folders were included** in the upload.

**9.3 GB ≈ Desktop working tree minus `node_modules`** (calculated ~10.06 GB excl. node_modules).

---

## Top 20 Largest Directories (Desktop git root)

| Rank | Path | Size (MB) | Size (GB) |
|------|------|-----------|-----------|
| 1 | `Bungus_Valley/` | 7,161.83 | 6.994 |
| 2 | `aleeza_travels/` | 1,599.76 | 1.562 |
| 3 | `e_commerce/` | 902.85 | 0.882 |
| 4 | `ssbfy/` | 656.75 | 0.641 |
| 5 | `OrchardLink/` | 453.36 | 0.443 |
| 6 | `memora ai/` | 412.47 | 0.403 |
| 7 | `ssbfy_pics/` | 312.94 | 0.306 |
| 8 | `my_self/` | 45.18 | 0.044 |
| 9 | `ssb_material/` | 34.06 | 0.033 |
| 10 | `memora ai/mobile/node_modules/` | 289.44 | 0.283 |
| 11 | `memora ai/backend/` | 121.16 | 0.118 |
| 12 | `memora ai/mobile/android/` | 0.59 | 0.001 |
| 13 | `memora ai/mobile/assets/` | 0.49 | <0.001 |
| 14 | `memora ai/mobile/.expo/` | 0.34 | <0.001 |
| 15 | `memora ai/mobile/src/` | 0.16 | <0.001 |
| 16–20 | Other Desktop dirs | <0.02 each | — |

### Top 20 Largest Directories (mobile/ only)

| Rank | Path | Size (MB) |
|------|------|-----------|
| 1 | `node_modules/` | 289.44 |
| 2 | `node_modules/hermes-compiler/` | 46.21 |
| 3 | `node_modules/expo-modules-core/` | 28.67 |
| 4 | `node_modules/@expo/` | 23.68 |
| 5 | `node_modules/typescript/` | 23.22 |
| 6 | `node_modules/react-native/` | 20.68 |
| 7 | `node_modules/@react-native/` | 20.45 |
| 8 | `node_modules/expo/` | 17.99 |
| 9 | `node_modules/react-devtools-core/` | 16.07 |
| 10 | `node_modules/@babel/` | 10.34 |
| 11 | `node_modules/lightningcss-win32-x64-msvc/` | 9.07 |
| 12 | `node_modules/fb-dotslash/` | 8.02 |
| 13 | `node_modules/babel-plugin-react-compiler/` | 3.70 |
| 14 | `node_modules/zod/` | 3.43 |
| 15 | `node_modules/path-scurry/` | 3.12 |
| 16 | `node_modules/@tanstack/` | 3.03 |
| 17 | `node_modules/react-native-screens/` | 2.77 |
| 18 | `node_modules/@types/` | 2.76 |
| 19 | `node_modules/caniuse-lite/` | 2.32 |
| 20 | `node_modules/terser/` | 2.26 |

---

## Top 20 Largest Files (mobile/)

| Rank | Size (MB) | Path |
|------|-----------|------|
| 1 | 26.26 | `node_modules/hermes-compiler/hermesc/win64-bin/icudt64.dll` |
| 2 | 14.17 | `node_modules/@expo/expo-modules-macros-plugin/apple/ExpoModulesMacros-tool` |
| 3 | 13.61 | `node_modules/expo-modules-core/prebuilds/.../ExpoModulesCore.tar.gz` |
| 4 | 12.00 | `node_modules/expo-modules-core/prebuilds/.../ExpoModulesCore.tar.gz` (release) |
| 5 | 9.06 | `node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node` |
| 6 | 8.72 | `node_modules/typescript/lib/typescript.js` |
| 7 | 8.45 | `node_modules/hermes-compiler/hermesc/osx-bin/hermesc` |
| 8 | 5.95 | `node_modules/typescript/lib/_tsc.js` |
| 9 | 4.19 | `node_modules/hermes-compiler/hermesc/linux64-bin/hermesc` |
| 10 | 4.04 | `node_modules/react-devtools-core/dist/standalone.js.map` |
| 11 | 3.65 | `node_modules/babel-plugin-react-compiler/dist/index.js` |
| 12 | 3.25 | `node_modules/expo/.../ExpoFileSystem.tar.gz` |
| 13 | 2.96 | `node_modules/react-devtools-core/dist/parseSourceAndMetadata.worker.worker.js.map` |
| 14 | 2.59 | `node_modules/fb-dotslash/bin/macos/dotslash` |
| 15 | 2.39 | `node_modules/hermes-compiler/hermesc/win64-bin/hermesc.exe` |
| 16 | 2.35 | `node_modules/hermes-compiler/hermesc/win64-bin/icuin64.dll` |
| 17 | 2.25 | `node_modules/react-devtools-core/dist/parseHookNames.chunk.js.map` |
| 18 | 2.24 | `node_modules/typescript/lib/lib.dom.d.ts` |
| 19 | 2.22 | `node_modules/expo/.../ExpoFileSystem.tar.gz` (release) |
| 20 | 2.13 | `node_modules/@react-native/debugger-frontend/.../lighthouse-dt-bundle.js` |

No stray APKs, videos, or datasets in `memora ai/`. Large `.tar.gz` files are inside `node_modules` (excluded by default).

---

## What EAS Includes vs Excludes

| Included by default | Excluded by default |
|---------------------|---------------------|
| All files under **git root** working tree | `.git/` |
| Uncommitted changes | `node_modules/` (any path) |
| Submodules (if present) | Patterns in root `.easignore` (replaces all `.gitignore`) |

**Key behavior:** Archive starts at git root (`Desktop/`), not at `eas.json` location (`mobile/`).  
**`.easignore` negation:** `!path` includes a file even if ignored elsewhere (must be last matching rule).

**android/ios exclusion:** Correct for managed workflow — EAS runs `expo prebuild` on the server. Local `android/` (0.59 MB source) is excluded; EAS regenerates native projects.

---

## Accidental Inclusions Checked

| Check | Result |
|-------|--------|
| `backend/` symlinked into `mobile/` | None found |
| Large archives/APKs in `memora ai/` | Only inside `node_modules` (excluded) |
| `mobile/assets/` bloat | 0.49 MB total (largest: `icon.png` 384 KB) |
| Local Android build caches | Not present (`android/build`, `android/app/build` absent) |
| Symlinks in `memora ai/` | None |

---

## Changes Made

### 1. Created `C:\Users\ayoob bhat\Desktop\.easignore` (git root — **critical fix**)
Excludes all sibling Desktop projects and `memora ai/backend/`. Includes standard EAS ignore patterns and `android/`/`ios/`.

### 2. Updated `mobile/.easignore`
Comprehensive patterns for `EAS_NO_VCS=1` workflow; documents that git-root file takes precedence.

### 3. Safe cleanup
| Removed | Size |
|---------|------|
| `mobile/.expo/` | 0.34 MB |

No other generated artifacts found (`dist/`, `build/`, `coverage/`, Android build dirs absent).

### 4. Updated `mobile/.gitignore`
Added build artifact patterns (`coverage/`, `build/`, `logs/`, `*.log`).

---

## Expected Upload Size After Fix

| Scope | Estimated archive |
|-------|-------------------|
| Before (entire Desktop) | **~9.3 GB** |
| After (memora ai/mobile source only) | **~1 MB** (well under 500 MB target) |

Excluded from upload: `node_modules` (289 MB), `android/` (0.59 MB), all Desktop siblings (~10 GB), `backend/` (121 MB).

EAS installs dependencies on the build server via `npm install`.

### Verify before next build

```powershell
cd "C:\Users\ayoob bhat\Desktop\memora ai\mobile"
npx eas-cli build:inspect --platform android --stage archive --output ./eas-inspect-out --force
```

Inspect `./eas-inspect-out` — should contain only `memora ai/mobile/` source files (~1 MB).

### Alternative: isolate git repo (recommended long-term)

Initialize a dedicated git repo in `memora ai/` so EAS archives only that project:

```powershell
cd "C:\Users\ayoob bhat\Desktop\memora ai"
git init
# Move .easignore from Desktop to memora ai/ root and adjust paths
```

### Alternative: skip git for uploads

```powershell
$env:EAS_NO_VCS=1
cd "C:\Users\ayoob bhat\Desktop\memora ai\mobile"
eas build --platform android
```

Uses `mobile/.easignore` instead of git-root archive.

---

## How to Run EAS Build

Always run from `mobile/`:

```powershell
cd "C:\Users\ayoob bhat\Desktop\memora ai\mobile"
eas build --platform android --profile preview
```

Ensure `Desktop/.easignore` exists (created by this audit).
