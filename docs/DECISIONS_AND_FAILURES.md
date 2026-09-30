# Implementation decisions and observed failures

This is an honest starter log for the assignment. Add your own changes, prompts, failures, screenshots and reasoning as you work. Do not describe generated work as solely unaided work.

## User direction and AI assistance

2026-09-28: The user requested a student-only Smart Study Planner with timetable, assignments, reminders, study goals, progress and exam countdown; custom reusable UI; the supplied StudyMate logo; colours inspired by the supplied culture palette; Firebase as the database; and alignment with the assignment rubric.

Representative user prompts from this conversation:

> Smart Study Planner ... Timetable, assignments, reminders, study goals, progress tracking, exam countdown ... for this topic no need admin right?

> now provide me the code of creating the app. use the image i provided as the logo and the app image. use own ui components and reusable components. stick to the marking. provide me the full modified code.

> im using firebase as the database.

The user also supplied the Firebase client configuration and selected EdTech. The implementation assistant generated the source, rules, domain tests and documentation in this repository and inspected the Expo SDK 57 documentation before writing code. The student should read, test, adapt and be prepared to explain this implementation during the live coding defense.

## Decision records

1. **One student role.** A personal planner does not need administrative content management. This reduces unnecessary scope and focuses effort on offline reliability and mobile workflows.
2. **SDK 57 and TypeScript.** Preserve the existing Expo version and consult its versioned API documentation, rather than adapting code from an older SDK.
3. **Firebase Auth and Firestore.** Use the provided project for cloud identity, records and separate Base64 JPEG image documents. Do not initialize web Analytics inside React Native.
4. **Explicit offline outbox.** AsyncStorage persists both current records and pending revision identifiers. This avoids assuming that the Firebase web SDK supplies native disk persistence for this environment.
5. **Last server arrival wins between devices.** Pending local edits stay visible until uploaded. Same-record collaborative merging is deliberately outside this individual-planner scope.
6. **Tombstones.** Soft-deleted records synchronize to devices that were offline. Physical deletion would make incremental sync unaware of removed records.
7. **Versioned photo paths.** A new attachment uses a revision-specific path, preventing another device's old local image from masquerading as the new one.
8. **Absolute timer deadlines.** Compute remaining time from endAt rather than depending on JavaScript running in the background. Save with a deterministic session ID to avoid duplicates on retries.
9. **Transparent scheduling.** Prefer simple explainable algorithms over an external AI service. No cost, model dependency or unexplainable priority decision is needed.
10. **Local demo isolation.** Demo records use a separate cache and never call the Firestore upload/download path. Demo success does not imply backend setup is complete.
11. **Original UI primitives.** Controls are composed from React Native primitives instead of a copied app template or third-party UI kit.

## Actual failures and resolutions

| Observation | Cause / evidence | Resolution |
| --- | --- | --- |
| PDF extraction initially failed with a UnicodeEncodeError | Windows console default encoding could not emit bullet characters | Re-ran the Python extraction in UTF-8 mode |
| First dependency installation returned EACCES network errors | Network access was blocked in the restricted execution environment | Requested the required download approval and reran the Expo installer |
| TypeScript could not find getReactNativePersistence in firebase/auth | Firebase's web type entry does not expose the React Native conditional-export helper | Used a typed require in the native service and a separate auth.web.ts implementation |
| TypeScript reported starter CSS module imports | Unused starter animation/theme modules remained in the project | Removed the unused starter UI and retained the new typed StudyMate controls |
| Initial combined file-replacement patch was rejected | The patch tool did not accept deleting and adding the same path in one patch | Created the app screen separately and replaced the thin route entry points |
| Browser accessibility click reported a shadow-root error | The action had already changed the visible screen despite the tool error | Re-observed the actual page, then used supported semantic browser locators |
| Small-screen demo header displayed Synced | Compact status text did not include the demo branch | Added explicit Local demo status and local-only save wording |

## Verification integrity

2026-09-29: The student reported React Native's “Creating blobs from ArrayBuffer and ArrayBufferView are not supported” error. The photo upload passed File.bytes() (a Uint8Array) into Firebase uploadBytes. Inspection of Firebase's multipart implementation and React Native's BlobManager confirmed that path creates an unsupported Blob from a typed array. Replaced the native file read with XMLHttpRequest responseType='blob', passed that native Blob directly to Firebase, and closed native Blob resources in finally. Browser uploads now use Response.blob(). Five regression tests cover native Blob identity, unreadable files, successful upload cleanup, failure cleanup/pending preservation, and size rejection. A physical-device upload remains the final integration check.

2026-09-29: The student reported “undefined is not a function” during sign-out, without a stack identifying the exact function. The sign-out path awaited native reminder cancellation before Firebase sign-out, so a cleanup failure could block logout. Separated session termination from best-effort reminder cleanup, stopped installing the foreground notification handler for cancellation-only calls, and retained cleanup failures as a visible signed-out warning. Three regression tests verify successful ordering, logout despite a cleanup TypeError, and propagation of actual authentication failures. The original device error still requires its stack if it persists; this change does not claim a reproduced native root cause.

2026-09-29: A phone run in Android Expo Go reported an unsupported remote-push error on importing `expo-notifications`. Inspection of the installed SDK 57 package showed that its root index loads `DevicePushTokenAutoRegistration.fx` indirectly. StudyMate only requires local reminders. Replaced the root import with an isolated local-only adapter, retained scheduling/permission behavior, and added dependency-graph regression tests that reject remote-token modules. This is an SDK-specific dependency boundary, not suppression of the console error or removal of the reminder feature.

Only record a check as passed after it has actually run. Domain tests and bundle generation are not physical-device tests or Firebase rule-emulator tests. See TESTING.md for completed checks and remaining manual validation.

2026-09-29: At the student’s request, replaced the Storage/Blob upload approach above with compressed Base64 JPEGs in Firestore. Images are limited to 200 KB before encoding, excluded from indexing, and stored separately from planner records. A batch commits each image and reference together; failed uploads remain pending. Existing oversized queued photos are recompressed. Image documents require owner authentication and are read on demand, with five cached per account. Removed Firebase Storage configuration and the native Blob adapter. Old image revisions remain private but are not automatically garbage-collected. The eight new photo regression tests replace the five obsolete Blob tests.
