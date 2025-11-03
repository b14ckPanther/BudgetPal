# BudgetPal

Flutter application for multilingual personal finance management with Firebase, Riverpod, and AI-assisted features.

## Environment Configuration

Secrets are injected via Dart defines (recommended `--dart-define-from-file`).  
Copy the sample file and fill in your credentials:

```bash
cp .env.example .env
```

Then run Flutter with the env file:

```bash
flutter run --dart-define-from-file=.env
```

### Firebase Config Files

Actual Firebase config files are ignored. Use the templates as references:

- `android/app/google-services.json.template`
- `ios/Runner/GoogleService-Info.plist.template`
- `macos/Runner/GoogleService-Info.plist.template`

Place the real files (with the original filenames) alongside the templates before building.

## Running the App

Install dependencies and generate localizations as usual:

```bash
flutter pub get
flutter gen-l10n
```

Launch with your preferred defines (example):

```bash
flutter run --dart-define-from-file=.env
```

Refer to the [project wiki](https://github.com/b14ckPanther/BudgetPal) for roadmap and additional setup details.
