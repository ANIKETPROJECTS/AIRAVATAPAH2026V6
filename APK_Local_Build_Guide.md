# कृषी सुविधा — Local APK Build Guide (No Expo Account Required)

**App Name:** कृषी सुविधा (Krushi Suvidha)  
**Package:** com.agrimh.krishisuvidha  
**Method:** Local Gradle build — completely free, unlimited builds, no account needed

---

## Overview

This guide builds the APK entirely on your own Windows machine using Android's official build tools.  
No Expo account. No EAS. No cloud. No limits. No charges — ever.

| What you need | Cost |
|---|---|
| JDK 17 (Java) | Free |
| Android Studio (includes SDK + Gradle) | Free |
| Node.js | Free |
| Your Windows PC | Already have it |

**Build time:** 5–10 minutes (first build downloads Gradle — allow 15 min the first time)

---

## One-Time Setup (do this once, never again)

### Step 1 — Install Node.js

If you already have Node.js installed, skip this.

1. Go to **https://nodejs.org**
2. Download the **LTS** version
3. Run the installer — accept all defaults
4. Open **Command Prompt** and verify:

```cmd
node --version
```

You should see `v20.x.x` or higher.

---

### Step 2 — Install JDK 17

React Native requires Java 17 exactly.

1. Go to **https://adoptium.net/temurin/releases/**
2. Filter: **Version = 17**, **OS = Windows**, **Architecture = x64**, **Package Type = JDK**
3. Download the `.msi` installer
4. Run it — on the install screen, make sure **"Set JAVA_HOME variable"** is checked (it is by default)
5. Click through and finish

Verify in a **new** Command Prompt window:

```cmd
java -version
```

You should see `openjdk version "17.x.x"`.

---

### Step 3 — Install Android Studio

Android Studio includes the Android SDK, Gradle, and all build tools you need.

1. Go to **https://developer.android.com/studio**
2. Click **Download Android Studio**
3. Run the installer — accept all defaults
4. On first launch, Android Studio runs a setup wizard:
   - Click **Next** on each screen
   - Choose **Standard** installation type
   - Accept all license agreements
   - Click **Finish** — it will download the SDK (about 1–2 GB, takes a few minutes)
5. Once setup completes, you can close Android Studio — you do not need to open it again

---

### Step 4 — Set ANDROID_HOME Environment Variable

1. Press **Windows key**, search for **"Environment Variables"**, click **"Edit the system environment variables"**
2. Click **"Environment Variables..."** at the bottom
3. Under **"User variables"**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
   
   > Replace `YOUR_USERNAME` with your actual Windows username. To find it, open Command Prompt and type `echo %USERNAME%`.

4. Click **OK**
5. Find the **`Path`** variable in User variables, click **Edit**, then **New**, and add:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\emulator
```

6. Click **OK** on all windows
7. **Close and reopen Command Prompt** (environment variables only load on fresh windows)

Verify:

```cmd
adb --version
```

You should see `Android Debug Bridge version 1.x.x`.

---

### Step 5 — Install Expo CLI

```cmd
npm install -g expo-cli
```

---

## Building the APK (do this every time you want a new build)

### Step 6 — Download Fresh kisan-mitra from Replit

> Always download a fresh copy after any code changes in Replit.

1. Open your Replit project
2. Right-click the `artifacts/kisan-mitra` folder
3. Click **Download**
4. Delete your old `C:\kisan-mitra` folder if it exists
5. Extract the zip to:

```
C:\kisan-mitra\
```

Confirm these files exist:

```
C:\kisan-mitra\
  assets\
    icon.png
    splash.png
    favicon.png
    adaptive-icon.png
  src\
  app.json
  package.json
  App.tsx
```

---

### Step 7 — Open Command Prompt in the Folder

```cmd
cd C:\kisan-mitra
```

---

### Step 8 — Install JavaScript Dependencies

```cmd
npm install --legacy-peer-deps
```

Wait until you see `added XXX packages`.

---

### Step 9 — Generate the Native Android Project

This converts your Expo/React Native JavaScript project into a real Android Gradle project:

```cmd
npx expo prebuild --platform android --clean
```

> The `--clean` flag removes any previous generated files and starts fresh. Always use it.

This will create a new `android\` folder inside `C:\kisan-mitra\`.

When asked **"What would you like your Android package name to be?"** — type:

```
com.agrimh.krishisuvidha
```

and press Enter.

---

### Step 10 — Generate a Keystore (First Time Only)

A keystore is a file that signs your APK so Android will install it. You only create this once — keep the file safe.

```cmd
keytool -genkeypair -v -keystore C:\kisan-mitra\krushi-release.keystore -alias krushi -keyalg RSA -keysize 2048 -validity 10000
```

It will ask you several questions — fill them in (or just press Enter to accept defaults for most):

```
Enter keystore password: [choose a password, e.g. krushi2026]
Re-enter new password: [same password]
What is your first and last name? [your name or press Enter]
What is the name of your organizational unit? [Airavata Technologies or press Enter]
What is the name of your organization? [Airavata Technologies or press Enter]
What is the name of your City or Locality? [Pune or press Enter]
What is the name of your State or Province? [Maharashtra or press Enter]
What is the two-letter country code? [IN]
Is CN=..., OU=..., O=..., L=..., ST=..., C=IN correct? [yes]
Enter key password for <krushi>: [press Enter to use same as keystore password]
```

A file `krushi-release.keystore` is now saved at `C:\kisan-mitra\`.

> **Keep this file safe.** If you lose it you cannot sign future updates with the same key. Back it up to Google Drive or a USB drive.

---

### Step 11 — Configure the Android Project for Release Signing

Open the file `C:\kisan-mitra\android\app\build.gradle` in Notepad.

Find this section (it will already exist, around line 10–20):

```
android {
    ...
    defaultConfig {
```

**Add** the following `signingConfigs` block right after the `android {` opening line, before `defaultConfig`:

```gradle
    signingConfigs {
        release {
            storeFile file("../../krushi-release.keystore")
            storePassword "krushi2026"
            keyAlias "krushi"
            keyPassword "krushi2026"
        }
    }
```

> Replace `krushi2026` with whatever password you chose in Step 10.

Then find the `buildTypes` section (it should already exist) and change `release` to use the signing config:

```gradle
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
```

Save the file.

---

### Step 12 — Build the APK

```cmd
cd C:\kisan-mitra\android
gradlew.bat assembleRelease
```

> The first time you run this, Gradle will download dependencies (~300 MB). This takes 5–10 minutes. Subsequent builds are much faster (under 2 minutes).

### What you will see:

```
> Task :app:assembleRelease
BUILD SUCCESSFUL in 3m 45s
```

---

### Step 13 — Find Your APK

The finished APK is at:

```
C:\kisan-mitra\android\app\build\outputs\apk\release\app-release.apk
```

Copy it to your Desktop or share it directly.

---

### Step 14 — Install on Android Phone

**Method A — USB Transfer**
1. Connect phone via USB → allow **File Transfer**
2. Copy `app-release.apk` to the phone's Downloads folder
3. On phone: Files app → Downloads → tap the APK
4. If blocked: **Settings → Apps → Special App Access → Install Unknown Apps** → enable for Files

**Method B — Google Drive / WhatsApp**
1. Upload `app-release.apk` to Google Drive or send via WhatsApp to yourself
2. Open on the phone and tap Install

---

## Rebuilding After Code Changes

Every time you update code in Replit and want a new APK:

```cmd
cd C:\kisan-mitra
rmdir /s /q android
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
```

Then redo Steps 11 and 12. The keystore file (`krushi-release.keystore`) stays at `C:\kisan-mitra\` and does not need to be recreated.

Quick rebuild command sequence:

```cmd
cd C:\kisan-mitra
rmdir /s /q android
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
```

*(When asked for package name, enter `com.agrimh.krishisuvidha`)*

```cmd
cd android
gradlew.bat assembleRelease
```

APK is at: `android\app\build\outputs\apk\release\app-release.apk`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `java: command not found` | Close and reopen Command Prompt after installing JDK. If still failing, restart your PC. |
| `JAVA_HOME not set` | JDK installer sets this automatically. If missing: set it manually to `C:\Program Files\Eclipse Adoptium\jdk-17.x.x` |
| `adb: command not found` | ANDROID_HOME is not set correctly — redo Step 4. Make sure you opened a new Command Prompt after saving. |
| `SDK location not found` | Open `C:\kisan-mitra\android\local.properties` and confirm it says `sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk` |
| `gradlew.bat` not found | You are not inside the `android\` folder. Run `cd C:\kisan-mitra\android` first. |
| `Execution failed for task :app:processReleaseResources` | Re-run prebuild: go back to `C:\kisan-mitra`, run `rmdir /s /q android`, then redo from Step 9. |
| `BUILD FAILED — keystore` error | Check the keystore path in `build.gradle`. The path `../../krushi-release.keystore` looks two folders up from `android\app\` which puts it at `C:\kisan-mitra\` — correct. |
| `npm install` gives errors | Use `npm install --legacy-peer-deps` |
| APK installs but can't connect | Verify the API URL in `src/api.ts` points to your VPS. |
| Phone says "App not installed" | The APK may be mismatching a previous install. Uninstall the old version first, then install. |

---

## Comparison: Old Guide vs This Guide

| | Old Guide (EAS) | This Guide (Local) |
|---|---|---|
| Expo account needed | Yes | No |
| Build limit | Yes (free tier quota) | Unlimited |
| Internet required to build | Yes | No |
| Build happens | Expo cloud servers | Your own PC |
| Build time | 10–15 min | 3–5 min (after first) |
| Cost | Free tier with limits | Always free |
| Keystore managed by | Expo | You (local file) |

---

## Important Notes

- The keystore file (`krushi-release.keystore`) is your app's identity. Back it up. If you lose it and publish to Play Store later, you cannot update the app.
- The APK produced connects to `https://krushisuvidhaai.airavatatechnologies.com/api` (your production VPS) — same as before.
- You do NOT need an Android device connected to your PC to build — you only need it to install the APK.
- Android Studio only needs to be installed for its SDK. You never need to open it.

---

*Document prepared for Airavata Technologies — Krushi Suvidha Project*
