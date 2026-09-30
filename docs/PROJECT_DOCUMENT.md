# StudyMate - Smart Study Planner

Student: MS26933306 (verify with your enrolment details). Domain selected by the student: EdTech.

## Topic calculation

The student supplied the interpretation 2+6+9+3+3+3+0+6 = 32; 3+2 = 5; 5 mod 5 = 0 (EdTech). The assignment's wording says digit sum followed by modulus, which would give 32 mod 5 = 2 without the additional reduction. Record the lecturer's clarification in the final submission. This implementation follows the student's explicitly selected EdTech topic.

## Problem and value

Students often divide their schedules, assignment deadlines, revision plans and study notes across several tools. Connectivity can be unreliable, and a missed save or an overloaded day creates unnecessary friction. StudyMate brings these tasks into one student-owned mobile planner. It is a personal productivity app, so a separate administrator role has no user need.

The distinctive feature is an explainable study suggestion: it considers priority, proximity to deadlines and estimated effort, then finds a contiguous free session within preferred hours around weekly classes. Workload warnings compare today's unfinished effort with remaining available study minutes. These are deterministic algorithms, not claims of AI-generated advice.

## Implemented features

- Firebase email/password registration, persistent sign-in, reset email and sign-out.
- Student profile and study preferences.
- Subject creation, colours, editing and deletion with reference protection.
- Weekly timetable and class-overlap detection.
- Assignments/tasks with due date, effort, priority, completion, subtasks and photo attachment.
- Exam countdown, venue and revision checklist.
- Date-bounded study goals with automatic progress from saved focus sessions.
- Focus and break timer, pause/resume, durable restoration and idempotent session saving.
- Notes with device-camera capture or selected photo.
- Study-minute chart, subject distribution, overall task completion and study streak.
- On-device reminders for classes, tasks, exams and the focus timer.
- Offline storage, durable pending changes, incremental cloud synchronization, tombstones and retry backoff.
- A labelled local-only demo for exploration without a Firebase account.

## Architecture and data flow

```text
Custom controls + screens
           |
           v
StudyProvider (auth lifecycle, connectivity, foreground sync, reminders)
           |
           v
StudyRepository -----> AsyncStorage (per-user snapshot + outbox)
           |
           +---------> Firebase Auth
           +---------> Firestore users/{uid}/records/{id}
           +---------> Firestore users/{uid}/images/{id}-{revision} (Base64 JPEG)

Pure domain functions: validation, clash detection, recommendations,
study statistics, revision acknowledgement and remote merge.
```

An edit flows from a controlled form to domain validation, then to a serial local commit. The record and its pending revision are stored in one serialized snapshot before the UI is notified. This prevents a success indication before durable local storage. Online synchronization uploads pending snapshots, acknowledges only the revision that was sent, and merges cloud records without overriding unsent local edits.

`src/app` is the Expo Router entry point. `src/screens` contains feature screens. `src/components/study` contains the custom visual system. `src/domain` contains platform-independent, tested algorithms. `src/services` wraps Firebase, storage, camera, reminder and repository details. `src/state` owns the lifecycle connecting screens and services.

## Backend and access rules

Every record belongs under its authenticated Firebase UID. The supplied Firestore record and image rules deny unauthenticated access and access to another student's path. Firestore rules validate allowed keys, identifiers, title size, revision and server timestamps. Photos are JPEG images up to 200 KB before Base64 encoding, stored in separate authenticated Firestore documents. Client Firebase identifiers are public configuration, not administrator credentials. The app never embeds service-account keys.

Cloud setup and rules deployment remain required in the project owner's console. A successful local demo is not evidence that Firebase authentication, rule enforcement or photo uploads have been verified against the production project.

## Offline access and synchronization

1. The previously signed-in student can reopen the cached planner without network access.
2. CRUD operations save locally. Offline changes remain queued after restart.
3. Connectivity restoration, app foregrounding, the foreground interval, manual sync and local saves trigger synchronization.
4. Failed operations remain pending. Backoff grows up to five minutes; manual sync and reconnection can retry immediately.
5. Failed photo uploads do not stop unrelated records from uploading.
6. Incremental reads use a server-time watermark, inclusive timestamp boundary, document cursor and pages of 200. The inclusive boundary avoids skipping updates with the same timestamp.
7. Deletes use tombstones, allowing a device that was offline to learn about the deletion.
8. A revision token prevents an acknowledgement for an old upload from dropping a newer edit to that record.
9. Cross-device edits to the same record use last arrival at the server. Field-level collaborative merging is outside scope.

Photos captured on this device are copied from temporary camera storage into the app document directory. Other devices can open synchronized photos online; this version does not automatically download every remote image for offline use. Web preview photos use compressed data URLs and are subject to browser storage quotas. Existing local data is retained when a local write fails, and the error is surfaced.

## Constrained mobile design

- Compress photos to JPEG at a maximum width of 1280 pixels, retrying smaller sizes if needed; reject images over 200 KB. Commit the image and planner reference atomically, with offline retry. Cache up to five downloaded images per account.
- Keep one attachment per task/note and cap checklists at 30 steps.
- Render planner records in pages of 20, with an explicit load-more action.
- Use incremental cloud reads instead of repeatedly downloading the full planner.
- Retry failed cloud work with backoff; poll only while foregrounded.
- Request camera and notification permissions only in response to relevant actions.
- Persist an absolute timer end time; avoid treating background JavaScript ticks as elapsed time.
- Cap planner notification scheduling at the nearest 50 items, leaving room for the focus timer.
- Avoid video, live chat, continuous location tracking and unnecessary sensor use.

## Native hardware and notifications

`expo-image-picker` launches the native camera after permission, and `expo-image-manipulator` compresses the result. `expo-file-system` preserves a local copy. Denial produces a useful message and the student can choose an existing photo instead. `expo-notifications` handles local scheduled reminders; Android uses a named notification channel. Notification settings and actual OS permission are both checked.

Use a real Android/iOS installation to demonstrate camera capture, permissions, app lifecycle and reminders. The web preview is for UI and planner workflows, not proof of native hardware integration. Reminder delivery time can be affected by OS battery policies. First sign-in/reset requires a network connection. Background cloud upload is not promised when the app is closed.

## UI/UX rationale

The supplied StudyMate logo is used for branding, splash image and app icon. The supplied Colours in Culture reference inspired jade, warm gold, lotus/lavender and blue accents with warm neutral surfaces. This is a design interpretation, not a claim that every Asian culture assigns the same meaning to these colours. Text and labels accompany colour to communicate priority and status.

Home answers what needs attention today. Planner groups related record types in one place. Focus isolates the current study session. Progress shows accumulated effort. Profile holds preferences and synchronization details. Phones use bottom navigation; larger screens use a sidebar. Forms use reusable inputs, validation and confirmation dialogs, with keyboard-aware layouts and readable contrast.

## Custom component properties and events

| Component | Main properties | Events / behavior |
| --- | --- | --- |
| Button | label, variant, busy, disabled, small | onPress; accessible disabled/loading state |
| Field | label, hint, value, input properties | onChangeText; shared labels and input styling |
| Card | children, style | Consistent reusable container |
| Badge | label, tone | Text-labelled semantic status |
| Chips | options, value | onChange selected value |
| Check | checked, label | onPress; accessible checkbox |
| ProgressBar | value, color, label | Clamped percentage and accessible progress |
| DateField | label, value | onChange timestamp; native picker / web date control |
| EmptyState | title, detail, action | onAction to a useful next step |
| Sheet | title, children | onClose; modal/keyboard layout |
| ConfirmDialog | title, description | async onConfirm, onClose; error/busy handling |
| RecordCard | record, records | onEdit, onDelete, onToggle; per-kind rendering |

## Marking alignment

| Criterion | Weight | Evidence |
| --- | --- | --- |
| Idea and documentation | 15% | Personal planner problem, explainable schedule suggestions, this document and decision log |
| Implementation | 50% | Separated code layers, real Firebase services, durable offline queue, native camera, constraints, algorithms and tests |
| UX and navigation | 20% | Consistent five-area navigation, original reusable controls, responsive screens and status feedback |
| Presentation | 15% | Demonstration script, source walkthrough, real device checks and live coding preparation |

## Screenshots to capture for the final submission

Capture the actual running app: login, dashboard, timetable, overlapping-class error, assignment checklist, exam countdown, focus timer, progress, camera attachment, airplane-mode pending status and successful reconnect. Include captions explaining the workflow and platform. Do not present mockups as runtime evidence.

## Viva outline (up to 20 minutes)

1. Explain the problem, chosen role and feature scope (2 minutes).
2. Demonstrate the planner and smart suggestions (4 minutes).
3. Switch off connectivity, make a change, restart, then reconnect and show the same record in Firebase (4 minutes).
4. Capture a photo and demonstrate a local reminder on a phone (3 minutes).
5. Explain source layers, data flow, conflict handling and a reusable component (3 minutes).
6. Show tests, limitations, decisions and your contribution/AI assistance log (2 minutes).
7. Leave time for questions and a small live coding change (2 minutes).

## Known limits / future improvements

- No teacher/admin role, enrollment, grading, payments or chat: this is a personal planner.
- No automatic collaborative merge of simultaneous edits to the same record.
- Local storage uses a compact whole-snapshot write; a much larger product should migrate to SQLite and transactional row updates.
- Old photo objects and local unreferenced camera copies are not automatically garbage-collected. A production retention job and cache manager would improve storage usage.
- A focus session is attributed to its save date; split sessions at midnight would improve detailed historical accounting.
- App tab selection is local UI state; deep links to individual records are not implemented.
- Device timezone changes require reopening the app so reminders can be reconciled; class times follow the device's current local timezone.

## References

- Assignment - Enterprise Mobility 2026.pdf, supplied by the student.
- Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/
- Expo notifications: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- Expo image picker: https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/
- Firebase Authentication: https://firebase.google.com/docs/auth/web/start
- Firebase offline behavior: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Firestore quotas: https://firebase.google.com/docs/firestore/quotas
