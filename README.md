# RideNow — Cab Booking (React Native)

Passenger/driver client for the RideNow cab-booking app. Auth is phone number +
OTP (no passwords) against the backend in `../../be/cab_booking_be` — see that
repo's README for the API and how to run it.

## Before you run this

1. Start the backend first (`cd ../../be/cab_booking_be && npm run dev`).
2. Point the app at your backend: edit `utils/config.js` and set `HOST` to
   your machine's LAN IP (not `localhost` — the app runs on a
   simulator/device, not your dev machine, so it needs a real reachable
   address). This is the **only** place the backend URL is configured — it
   used to be duplicated across three files, which is why previous versions
   sometimes silently talked to the wrong host.
3. `npm install`, then `npm run android` / `npm run ios` as usual.

### Trying the login flow

The backend's default `SMS_PROVIDER=console` logs the OTP code to the
backend's terminal instead of sending a real text — watch that terminal after
tapping "Send OTP" and enter the code it prints.

### Token storage note

The access token is kept in memory only (cleared on app restart); the refresh
token lives in `AsyncStorage` and is used to silently re-authenticate on
launch (see `utils/authStorage.js`). For a real production release, swap the
refresh-token storage for `react-native-keychain` (OS-level secure storage) —
that wasn't done here to avoid a native-linking/rebuild step that couldn't be
verified in the environment this was written in.

---

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
