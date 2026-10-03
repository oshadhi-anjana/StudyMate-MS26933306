# StudyMate — Smart Study Planner

A student-only Expo / React Native app for subjects, timetables, assignments, study goals, focus sessions, exam countdowns, notes and progress. Uses the supplied StudyMate logo and original reusable React Native controls with jade, gold and warm neutral colours.

## Start the app

Requirements: Node.js 22.13 or later and npm. Dependencies are already installed in this workspace.

```sh
npm install
npm start
```

Scan the Expo QR code using a compatible Expo Go installation, or run on an Android emulator. For the browser preview:

```sh
npm run web
```

Choose **Explore a local demo** on the sign-in screen to try the app without configuring Firebase. Demo data stays in a separate local cache and never synchronizes to your Firebase project. Exit through Profile to register/sign in to a real account.

## Firebase setup — required for real accounts

The supplied client configuration is in `src/services/firebase.ts` and points to `studymate-b077d`. No admin/service-account secret is needed in the app.

1. Open [your Firebase project](https://console.firebase.google.com/project/studymate-b077d/overview).
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. Create a **Cloud Firestore** database (default database, native mode). Choose a suitable region.
4. In **Firestore → Rules**, paste and publish `firestore.rules`.
5. In **Firestore → Indexes → Single field**, add an exemption for collection group `images`, field `base64`, with all indexing disabled. Photos use Firestore; Firebase Storage activation is unnecessary.
6. For browser sign-in/reset flows, check **Authentication → Settings → Authorized domains** and add your development/hosting domain when required (for example `localhost`).
7. Start the app, create your own student account and create a subject. Confirm its document appears under `users/<your-uid>/records` in Firestore.

Alternatively, if you have Firebase CLI access to this project:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore --project studymate-b077d
```

The repository includes rules and configuration; they have **not** been deployed to your Firebase project by this implementation. Do not use open/test-mode rules for the completed app.

Firebase Web Analytics from the pasted snippet is intentionally omitted. It is not required for the planner and should not be initialized unconditionally in React Native.

## What is included

- Email/password registration, login, password reset, persistent sessions and sign-out.
- Home dashboard with priorities, today's classes, daily study target and exam countdown.
- Subject management with custom colours.
- Weekly classes with overlap validation.
- Assignments/tasks with priority, due date, effort, completion, subtasks and a photo.
- Exams with venue, date and revision checklist.
- Study goals with a date range and automatically calculated progress.
- Notes with camera/library attachments.
- Focus/break timer with pause/resume, restart restoration and saved session history.
- Weekly study chart, subject breakdown, task completion and study streak.
- Suggested free study slots and workload warnings using explainable algorithms.
- Native local reminders for classes, tasks, exams and focus sessions.
- Offline CRUD, durable pending changes, incremental Firestore synchronization and retry backoff.
- Custom reusable buttons, forms, cards, badges, chips, progress bars, modal sheets and record cards.
- Firebase access rules, domain tests, setup instructions and marking-aligned documentation.

## Native features

### Android Expo Go notification import

StudyMate uses local reminders, which remain supported in Expo Go. In SDK 57, importing the `expo-notifications` package root also loads remote push-token registration and can report the SDK 53 remote-push error on Android Expo Go. `src/services/localNotifications.ts` therefore imports only the local scheduling, permission and presentation APIs. This adapter uses SDK-specific subpaths; the notification import-graph tests guard against remote registration being reintroduced during an upgrade.

After updating from the original implementation, stop Metro and restart with `npx expo start --clear`, then reload Expo Go. No Firebase email setting is involved in this notification import error. Remote push notifications would require a development/standalone build; StudyMate does not request push tokens.

Camera capture and scheduled reminders require Android/iOS testing. On web, photo selection is supported and the app explains that scheduled reminders are native-only. In Profile, enable reminders; then select a lead time on a class/task/exam. Permission refusal does not prevent using the planner.

For an installable Android preview APK, connect your Expo account/project and run:

```sh
npx eas-cli build --platform android --profile preview
```

`eas.json` includes an APK preview profile. Building/deploying through your Expo account is a separate step; no APK has been generated here. Keep the supplied SDK 57-compatible dependency versions.

## Verification

```sh
npm run typecheck
npm test
npm run export:web
npx expo export --platform android --output-dir dist-android
```

`npm test` runs domain, synchronization, notification and photo regression tests. To serve an exported web build without opening a browser automatically:

```sh
npm run preview
```

Then open http://127.0.0.1:8081. This local static preview is for review; it is not a hosting deployment or an offline-installable PWA.

## Project structure

```text
src/
  app/                 Expo entry points
  components/study/    Reusable original UI components and theme
  domain/              Models, scheduling, statistics, merge logic and demo data
  screens/             Authentication, Home, Planner, Focus, Progress, Profile
  services/            Firebase, auth, photos, reminders and offline repository
  state/               Auth/data/lifecycle provider
assets/images/studymate-logo.png
firestore.rules
firestore.indexes.json
firebase.json
scripts/test-domain.cjs
scripts/serve-preview.cjs
docs/
  PROJECT_DOCUMENT.md
  DECISIONS_AND_FAILURES.md
  TESTING.md
```

## Assignment documentation

- [Project document and rubric mapping](docs/PROJECT_DOCUMENT.md): idea, architecture, data flow, constraints, custom components, offline behavior and viva outline.
- [Decisions, AI assistance and real failure log](docs/DECISIONS_AND_FAILURES.md).
- [Completed checks and device/Firebase test checklist](docs/TESTING.md).

The student selected EdTech and requested the additional digit reduction `32 → 5 → 0`. The assignment document's literal calculation differs; the project document records both interpretations so the final submitted explanation can reflect lecturer confirmation.

## Important implementation boundaries

- Offline use requires a previously persisted sign-in. First sign-in, reset email and registration need connectivity.
- Local changes persist before cloud upload. The status banner distinguishes offline/pending work from synchronized work.
- Sync occurs when the app is active/reconnected; closed-app background sync is not promised.
- Concurrent edits to the same record on different devices use last arrival at the server. Deletions synchronize as tombstones.
- Photos captured on the current device remain available locally. Remote-device photos are downloaded when opened; the five most recently downloaded images per account are cached for offline viewing.
- Photos are compressed JPEGs limited to 200 KB before Base64 encoding. Image documents live in `users/<uid>/images`; planner documents hold only an image reference. Image and planner writes commit atomically and failed uploads remain queued. Old unreferenced images/camera copies are not automatically garbage-collected.
- New photos use authenticated Firestore reads, without public download URLs. Firestore free quotas still apply; Base64 adds about 33% to image size. Previously queued oversized photos are recompressed during synchronization.
- The offline snapshot is application-private storage, not an encrypted vault. Sign-out retains it for that same account; pending work uploads after signing in again.
- Actual Firebase credentials/rule deployment, native permission behavior and notification delivery must be checked with your own account and phone before the viva.
