# Tranquil Support Mobile App

A React Native mobile application for both iOS and Android platforms providing mental health support with Google OAuth authentication.

## Features

- **Cross-Platform**: Works on both iOS and Android
- **Google OAuth**: Native Google Sign-In integration
- **Role-Based Authentication**: Support for both patients and therapists
- **Unified Registration**: Single portal with role selection
- **Native UI**: Platform-specific design patterns
- **Evidence-Based AI Companion**: Reuses the same research-backed AI as the web app, including crisis safeguards

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. React Native development environment set up
3. Android Studio (for Android development)
4. Xcode (for iOS development on macOS)
5. Backend API running locally or deployed (the mobile app now calls the `/api/ai-chat/*` endpoints)

### Installation

```bash
cd mobile
npm install
```

> Tip: the shared AI services live in `../shared`. Metro is already configured to watch that folder.

### Android Setup

1. Place `google-services.json` in `android/app/`
2. Ensure Android SDK is installed
3. Run: `npm run android`

### iOS Setup

1. Copy `ios/TranquilSupport/GoogleService-Info.plist.example` to `ios/TranquilSupport/GoogleService-Info.plist`
2. Populate the new file with real values using environment variables or CI secrets (see below)
3. Install iOS dependencies: `cd ios && pod install`
4. Run: `npm run ios`

### Supplying API Keys Securely

The repo only contains a template `GoogleService-Info.plist.example` with a dummy `API_KEY`.
During development or automated builds, inject the real file from a secure source:

```bash
# decode base64 plist from IOS_GOOGLE_SERVICE_INFO env var
echo "$IOS_GOOGLE_SERVICE_INFO" | base64 --decode > ios/TranquilSupport/GoogleService-Info.plist
```

Never commit the real `GoogleService-Info.plist` to version control.

### Connecting to the Backend API

Mobile builds need a fully qualified API base URL:

1. Open `src/config/api.ts`.
2. Update the `LOCAL_ANDROID`, `LOCAL_IOS`, and `PRODUCTION_API` constants to match your environment (e.g. `http://10.0.2.2:5000` for Android emulator, `http://localhost:5000` for iOS simulator).
3. The config sets the base URL at runtime using the shared `setApiBaseUrl` helper so both web and mobile share the same AI chat pipeline.

```ts
// Example for local development
const LOCAL_ANDROID = 'http://10.0.2.2:5000';
const LOCAL_IOS = 'http://localhost:5000';
const PRODUCTION_API = 'https://your-production-domain.com';
```

Make sure the backend server allows CORS for mobile origins if it is hosted remotely.

## OAuth Configuration

The app is configured with three OAuth clients:

- **Web Client ID**: `522576524084-pr5i8ucn0o6r4ckd0967te9orpiigkt2.apps.googleusercontent.com`
- **iOS Client ID**: `522576524084-28q57dbq1hk0b5e24oaklp9hkn0v6jra.apps.googleusercontent.com`
- **Android Client ID**: `522576524084-sdbirsc4aitpet16h9pcsk8kdobv30bu.apps.googleusercontent.com`

## Package Information

- **Package Name (Android)**: `com.tranquilsupport`
- **Bundle ID (iOS)**: `com.tranquilsupport`
- **SHA-1 Certificate**: `43:63:EF:72:EC:64:B3:12:28:70:58:3C:E4:F4:5A:C8:33:BC:02:C0`

## Project Structure

```
mobile/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   └── screens/
│       ├── LoginScreen.tsx     # Unified login with role selection
│       ├── DashboardScreen.tsx # Patient dashboard
│       └── TherapistDashboardScreen.tsx # Therapist dashboard
├── android/                    # Android-specific files
├── ios/                       # iOS-specific files
├── App.tsx                    # Main app component
├── src/config/api.ts          # API base URL configuration (edits required per environment)
└── package.json              # Dependencies and scripts
```

## Key Features

### Authentication
- Google OAuth with platform-specific client IDs
- Email/password authentication fallback
- Persistent login state with AsyncStorage
- Role-based navigation (patient vs therapist)

### User Interface
- Native platform design patterns
- Responsive layouts for different screen sizes
- Professional styling for healthcare applications
- Accessibility features

### Navigation
- Stack navigation with React Navigation
- Dedicated AI chat screen registered in the stack
- Role-based dashboard routing
- Secure authentication flow

## Development

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Building for Production

```bash
# Android APK
npm run build:android

# iOS Release
npm run build:ios
```

## Security

- OAuth tokens stored securely in AsyncStorage
- Platform-specific Google OAuth client configurations
- Secure certificate-based Android authentication
- iOS Keychain integration support
- AI chat API base URL configured at runtime (no hard-coded secrets in source control)

## Support

This mobile app complements the web application and provides native mobile experience for Tranquil Support users on both iOS and Android platforms.
