# StudyMate verification and viva checklist

## Automated checks

Run:

```sh
npm run typecheck
npm test
npm run export:web
npx expo export --platform android --output-dir dist-android
```

The domain suite currently contains 24 tests covering class overlap boundaries, weekday separation, deleted classes, free-slot search, no-slot situations, past-time handling, workload capacity, overdue priority, completed/deleted filtering, calendar-day countdowns, weekly boundaries, goal date/subject filtering, streaks, input validation, stale upload acknowledgements, pending edit precedence, tombstones, photo-cache identity and demo validity.

Two additional notification regression tests inspect the installed SDK's transitive local-notification import graph and the reminder-service entry point. They ensure the local API still includes scheduling and permissions without importing remote push registration (26 tests in total). These checks do not substitute for delivery testing on a physical phone.

The later sign-out repair adds three passing tests (29 total): notification cleanup failure cannot prevent session termination, successful cancellation precedes sign-out, and genuine auth errors still propagate. Recheck sign-out on the reporting phone after restarting Metro with `--clear`.

TypeScript and the 24 domain tests passed during implementation. Web and Android exports passed. Platform export produces a JavaScript/assets bundle; it is not an installed APK and does not validate native camera or notification delivery.

Browser checks completed in the isolated demo: task creation; saved task retained after page reload and reopening the demo; overlapping class rejected; timer continues across navigation and restores after page reload; saving a session updates history and switches to the break timer. Phone-width (390 × 844) and desktop-width (1365 × 900) dashboard layouts were visually inspected.

## Required Firebase/device checks before submission

Use your own test account after enabling Firebase services and deploying rules. These checks were not claimed as completed against the live project during code generation.

- Register, sign out, sign in, reset the password through your inbox, and reopen the app with the session restored.
- Sign in as a second student and confirm the first student's records do not appear.
- Use Firebase's rules simulator/emulator to verify unauthenticated requests and cross-UID reads/writes are denied for both Firestore and Storage.
- Create each record type, edit it, reload the app, and confirm saved values persist.
- Try empty titles, invalid times, class overlaps, invalid numeric goals and reversed goal dates.
- Complete and reopen a task; toggle checklist items and verify exam revision progress.
- Turn airplane mode on, add/edit/delete items, force-close and reopen, then reconnect. Confirm the queue clears and deletions do not reappear on a second device.
- Edit an item while a previous upload is in flight. Confirm the new edit remains queued until acknowledged.
- Capture a note with the camera, restart offline and reopen it; reconnect and check the upload. Test denied camera permissions too.
- Deny notifications, then enable them in OS settings. Add a task with a reminder at least 10 minutes in the future; verify delivery on the device.
- Change or delete a reminded item and verify the old notification is cancelled.
- Start, pause, resume and save a focus session. Background/close the app and check restoration. Save repeatedly after a simulated failure and confirm one session record per timer ID.
- Complete sessions in different subjects and check goal totals, streaks and progress charts.
- Check phones with large text and small screens. Test the keyboard, modal scrolling and hardware back dismissal.

## Browser local-demo checks

`Explore a local demo` exercises UI and local persistence without registering any live Firebase account. Changes remain under a separate local-preview cache. Refreshing returns to the sign-in page; reopening the demo restores saved demo edits and the timer. Native reminders are intentionally unavailable on web.

Use this for screenshots and interface review, but clearly label screenshots containing sample data. A local-demo test cannot establish that cloud rules, authentication, camera permissions or notification delivery work.
