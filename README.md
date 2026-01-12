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
- Expo Go app for quick testing

## Installation

```bash
# Clone the repository
git clone git@github.com:spatie/wordstockt-app.git
cd wordstockt-app

# Install dependencies
npm install

# Start the development server
npm start
```

## Development

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

## Testing

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
