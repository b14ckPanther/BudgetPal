# BudgetPal

BudgetPal is a cross-platform personal finance companion that combines budgeting, transaction tracking, AI assistance, and localization so users can manage money in the language and currency that feel natural. The app is built with Flutter, uses Riverpod for state management, and leans on Firebase for authentication, data, analytics, and storage.

## What BudgetPal Includes

- **Budgeting & Transactions:** Create budgets, review categorized spending, and drill into historic transactions with rich filtering, charts, and summaries.
- **Dashboard Overview:** A shell experience that surfaces current balance, upcoming bills, savings progress, and quick actions.
- **AI Assistant:** Conversational helper that can answer finance questions, summarize recent activity, and suggest actions based on profile data.
- **User Profiles:** Firebase Auth-backed sign-in plus Firestore user documents for preferences, supported locales, and linked accounts.
- **Localization:** App strings live in `lib/l10n` and ship in English, Arabic, and Hebrew with `flutter gen-l10n` integration.
- **Cross-Platform Targets:** iOS, Android, web, macOS, and Windows targets are set up, each with native plugin registrants and asset catalogs.

## Recent Updates

- Replaced the iOS app icon set with the refreshed BudgetPal branding (`ios/Runner/Assets.xcassets/AppIcon.appiconset`).
- Added the new 1024×1024 logo to the macOS icon catalog so desktop builds stay on-brand.
- Expanded localization files and generated strongly typed localizations to keep feature screens in sync.
- Updated Firebase providers and profile repositories to align with current backend contract expectations.
- Introduced shared "glass" UI widgets for translucent panels used across dashboard and profile flows.

## In Progress / Not Yet Implemented

- **Premium insights** toggle is scaffolded but awaiting backend endpoints.
- **Automated bank import** UI stubs exist; connection flow and encryption still pending.
- **Unit and golden tests** are sparse; we need coverage for auth flows, budgeting calculations, and assistant prompt handling.
- **CI/CD**: No configured pipelines for building or linting pull requests yet.

## Tech Stack Overview

- Flutter 3 with Material 3 design language.
- Riverpod 2 for dependency injection and state management.
- Firebase (Auth, Firestore, Storage, Analytics) for backend services.
- Dio for HTTP integrations, Shared Preferences for local caching, and Google Fonts for typography.
- Flutter localization tooling with generated delegates (`flutter gen-l10n`).

## Project Structure

- `lib/src/core`: shared infrastructure (Firebase providers, theming, widgets).
- `lib/src/features/*`: feature-specific presentation, domain, and data layers (assistant, auth, budget, dashboard, home, profile, transactions).
- `ios/`, `android/`, `macos/`, `windows/`, `web/`: platform folders with native host code and asset catalogs.

## Getting Started

1. **Install dependencies**
   ```bash
   flutter pub get
   flutter gen-l10n
   ```
2. **Configure secrets**
   ```bash
   cp .env.example .env
   # fill in API keys, endpoints, etc.
   ```
3. **Provide Firebase config files** (ignored from source control):
   - `android/app/google-services.json`
   - `ios/Runner/GoogleService-Info.plist`
   - `macos/Runner/GoogleService-Info.plist`

4. **Run the app**
   ```bash
   flutter run --dart-define-from-file=.env
   ```

## Building for Release

- **iOS:** `flutter build ios` then archive via Xcode.
- **Android:** `flutter build appbundle` for Play Store distribution.
- **Web:** `flutter build web` to produce deployable assets.
- **Desktop:** `flutter build macos` / `flutter build windows` as needed.

## Contributing & Roadmap

- Open issues for feature requests or bugs. Roadmap items live in the [GitHub Projects board](https://github.com/b14ckPanther/BudgetPal/projects).
- Follow the existing folder-by-feature architecture, add Riverpod providers for shared state, and update localization files when introducing new strings.
- Before opening a PR, run `flutter analyze` and relevant platform builds to ensure codegen artifacts stay in sync.
