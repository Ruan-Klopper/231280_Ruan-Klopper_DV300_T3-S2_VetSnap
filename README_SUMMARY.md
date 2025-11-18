# VetSnap – Project Summary

## Overview
VetSnap is a TypeScript‑based Expo (React Native) application that unifies three core workflows for the Southern African livestock community:

- **Anipedia** – rich, Sanity CMS–driven veterinary content with keyword search and category filters.
- **Pulse** – a Firestore‑backed alert feed where farmers post outbreaks, tips, and media with real‑time updates.
- **TalkToVet** – secure 1‑to‑1 messaging between farmers and verified veterinarians with image sharing and presence indicators.

The app relies on Firebase (Auth, Firestore, Storage, Realtime Database) for identity, data persistence, media handling, and status tracking, while Sanity hosts the editorial article content. Navigation is stack + tab based (`MainTabs`) and all screens are functional components using React Hooks.

## Tech Stack
- **Runtime**: Expo SDK 54, React Native 0.79, React 19
- **State/UI**: React Hooks, React Navigation v7 (native stack + custom tab context), Expo UI modules (StatusBar, Gesture Handler, Safe Area)
- **Data & Auth**: Firebase Auth, Firestore, Storage, Realtime Database; Async Storage for lightweight caching
- **Content**: Sanity headless CMS + `@portabletext/react-native` for rendering rich text
- **Utilities**: Expo Image Picker, File System, Linear Gradient, DotEnv for configuration
- **Language & Tooling**: TypeScript 5.8, Babel 7, npm scripts via Expo CLI

## Architecture at a Glance
| Layer | Responsibility | Key Paths |
| --- | --- | --- |
| **Entry & Navigation** | Bootstraps Firebase auth listener, decides between auth stack and `MainTabs`, wires stack screens. | `App.tsx`, `navigation/*.tsx` |
| **Screens** | Feature pages (Home, Browse Articles, Pulse feed, Chat, Profile, Auth). Each screen composes global + feature components and calls services. | `screen/*.tsx` |
| **Components** | Reusable UI blocks: headers, nav, cards, chat rows, article tiles, pulse cards, etc. Encapsulate styling/presentation. | `components/*` |
| **Services** | Typed data layer for Firebase, Sanity, and validators. Encapsulates network/DB calls, mapping, validation, and error handling. | `services/**/*` |
| **Config & Interfaces** | Firebase bootstrap, env helpers, shared TypeScript types for users, chats, pulses, API responses. | `config/*`, `interfaces/*`, `utils/*` |
| **Assets** | Expo‑managed app icons, splash screens, promo imagery, and README mockups. | `assets/*`, `readme/*` |

## Key Feature Flows
### Authentication & Profiles
- `App.tsx` registers `onAuthStateChanged` to flip between the auth stack (`SignIn`, `SignUp`) and the main app.
- `services/auth/authService.ts` centralizes account lifecycle: email sign‑up/in, Google OAuth (via Expo AuthSession), password resets, re‑authentication, profile updates, and deletion.
- New users get Firestore `users/{uid}` docs plus optional `veterinarians/{uid}` records, default roles/preferences, and optional Storage‑hosted profile images.
- Presence tracking (optional) writes realtime status to RTDB and mirrors it into Firestore `presence/{uid}` via `services/chat/presence.service.ts`.

### TalkToVet (Chat)
- Conversations live under `conversations` with `messages` subcollections. `services/chat/conversations.service.ts` handles creation, unread counters, read receipts, and cleanup.
- `services/chat/messages.service.ts` streams messages, writes text/photo messages, and runs Storage uploads with resumable tasks before updating message docs.
- `screen/AllChats.tsx` subscribes to the user’s conversations, filters unread/read, hydrates vet metadata (`services/user/user.service.ts`), and launches new chats.
- `screen/Chat.tsx` renders an inverted FlatList of messages, normalizes timestamps, requests media permissions, and drives `sendTextMessage`/`sendImageMessage` with optimistic spinners.

### Pulse Feed
- Firestore `pulsePosts` store alert/tip/suggestion cards. `services/pulse/pulse.service.ts` exposes CRUD, pagination, real‑time listeners, stored image uploads, and “pulse” (like/acknowledge) toggles.
- `screen/AllPulses.tsx` combines the realtime feed, author hydration, optimistic pulse toggling, pagination, and filtering by category (Alerts vs Tips/Suggestions).
- `screen/CreatePulse.tsx` reuses the same service for create/update flows, including Expo Image Picker integration and validation mirrored from `utils/validators/pulseValidation.ts`.
- `screen/YourPulses.tsx` (not shown above) scopes the feed to the signed‑in author using `subscribeMyPosts`.

### Anipedia Articles
- `services/sanity/sanityClient.ts` initializes the Sanity client; `sanityService.ts` fetches all articles, single articles, or random selections while resolving banner URLs via `services/sanity/utils.ts`.
- `screen/BrowseArticles.tsx` implements debounced search, dynamic keyword chips, and filtered FlatList rendering using `components/articles/*`.
- `screen/ArticleSingleView.tsx` (PortableText renderer) consumes `GET_ARTICLE_BY_ID` to show structured sections.

### Global UI & Navigation
- `components/global/AppHeader`, `AppContentGroup`, `AppNavigation`, and `TabContext` implement the branded look, provide consistent layout padding, and manage active tab state manually.
- `global/styles.tsx` centralizes shared colors, typography, and card styling.
- `MainTabs` renders child screens directly and overlays the custom navigation bar, while stack screens (`ArticleSingleView`, `Chat`, `CreatePulse`, etc.) sit above for deep flows.

## Data & Configuration
- **Firebase**: Configured in `config/firebase.ts` (currently inline). For production, move secrets into `.env` and consume via `expo-constants`/`@env`.
  - Collections used: `users`, `veterinarians`, `conversations`, `presence`, `pulsePosts`, `pulsePosts/{id}/pulses`.
  - Storage buckets: `user_profiles/{uid}` and `chat_images/{conversationId}/{messageId}` plus `pulses/{postId}/photo.jpg`.
- **Sanity**: `sanityClient` expects `projectId`, `dataset`, `token`. Set via `EXPO_PUBLIC_SANITY_PROJECT_ID`, `EXPO_PUBLIC_SANITY_DATASET`, `EXPO_PUBLIC_SANITY_TOKEN` (or update client to read from env).
- **Expo env**: Create `.env` or `app.config.js` entries for Firebase + Sanity + Google OAuth client IDs, then reference them with `process.env.EXPO_PUBLIC_*`.
- **Async Storage**: Reserved for local caching (currently light usage).

## Running Locally
1. **Install toolchain**  
   ```bash
   npm install -g expo-cli   # if not already
   ```
2. **Install dependencies**  
   ```bash
   cd "VetSnap EXPO/VetSnap"
   npm install
   ```
3. **Configure environment**  
   - Create a Firebase project, enable Auth (Email/Password + Google), Firestore, Storage, and Realtime Database.
   - Populate `config/firebase.ts` with your keys or load them from `.env`.
   - Create a Sanity dataset with the `article` schema used in `services/sanity/queries.ts`, supply token/IDs via env.
   - Set Expo AuthSession redirect URIs and Google client IDs for both iOS and Android (see `screen/SignIn.tsx`).
4. **Run Metro + app**  
   ```bash
   npm start        # expo start
   npm run ios      # optional shortcut
   npm run android
   ```
5. **Optional services**  
   - Seed Firestore with sample users, veterinarians, and pulse posts.
   - Upload article imagery referenced by Sanity `coverImage`.

## Project Structure
```
VetSnap/
├── App.tsx
├── components/
│   ├── global/
│   ├── articles/
│   ├── chats/
│   ├── home/
│   └── pulse/
├── config/
├── global/
├── interfaces/
├── navigation/
├── screen/
├── services/
│   ├── auth/
│   ├── chat/
│   ├── pulse/
│   ├── sanity/
│   └── user/
├── utils/
├── assets/
└── readme/
```

## Testing & Quality Notes
- No automated tests or type‑driven validation beyond runtime checks; consider adding Jest + React Native Testing Library for screens and Vitest for service logic.
- Error handling currently logs to console and reports generic alerts; centralize to a toast/snackbar system for better UX.
- Firebase security rules must mirror the authorization logic in services (e.g., only authors edit/delete their pulses, vets vs farmers chat rules, etc.).

## Future Enhancements
- Replace inline Firebase config with environment variables and per‑environment `app.config`.
- Add offline caching for articles and pending chat messages/pulses.
- Expand role management (admins, paravets) and integrate vet verification workflows.
- Harden chat presence by defaulting to Firestore only if RTDB is unavailable.

---
_This summary targets developers who need a technical overview of how VetSnap is assembled, what services it depends on, and how to get it running locally._

