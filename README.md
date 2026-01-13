# WordStockt App

A React Native mobile app for WordStockt, a multiplayer word game inspired by Wordfeud.

## About

WordStockt lets you challenge friends to word battles on a 15x15 board. Form words, score points, and prove your vocabulary prowess. This repository contains the mobile app that connects to the [WordStockt API](https://github.com/spatie/wordstockt.com).

## Tech Stack

- React Native 0.81 with Expo
- TypeScript (strict mode)
- React Native Paper (Material Design 3)
- TanStack Query for data fetching
- Zustand for state management
- Zod for runtime validation
- Expo Router for navigation

## Requirements

- Node.js 18+
- iOS Simulator or Android Emulator (or physical device)
- EAS CLI (`npm install -g eas-cli`)

## Installation

```bash
git clone git@github.com:spatie/wordstockt-app.git
cd wordstockt-app
npm install
```

## Commands

### Development

```bash
npm run dev              # Start Expo dev server
npm run dev:prod-api     # Start with production API
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in browser
```

### Building

```bash
npm run build            # Build development iOS app (internal distribution)
npm run build:prod       # Build production iOS app (App Store)
npm run build:all        # Build development app for iOS + Android
```

### OTA Updates

Push JavaScript changes instantly without rebuilding:

```bash
npm run update           # Push update to development builds
npm run update:prod      # Push update to production builds
```

Updates are delivered via EAS Update. Devices receive updates on app launch.

### Testing

```bash
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

### Code Quality

```bash
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
```

## Deployment Workflow

### First time setup
1. `npm run build` - Creates a development build (~15 min)
2. Download from EAS or install via TestFlight
3. Install on test devices

### Pushing updates (JS changes only)
```bash
npm run update -- --message "Fixed login bug"
```
Takes ~30 seconds. Testers restart the app to get the update.

### Native changes
If you modify native code, add native dependencies, or change app.json:
```bash
npm run build            # Rebuild required
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
