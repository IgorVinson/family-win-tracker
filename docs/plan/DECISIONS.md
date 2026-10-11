# Decisions

## Expo (React Native)

KidsRise ships as an Expo app. Parents and kids use their own phones. The legacy app is a Vite web client; new screens are not added there.

Scaffold and dependencies, when a spec allows them, follow the Expo skills: `npx create-expo-app@latest`, then `npx expo install` for packages.

## Firebase instead of Supabase

The legacy app stores data in Supabase. KidsRise uses Firebase Authentication, Cloud Firestore, Cloud Storage, and Cloud Functions.

Reasons that matter for this product:

- Auth, the database, file storage for chore photos, and the vision call live in one project.
- Security rules can scope every document and object to a family.
- The vision API key stays in Cloud Functions. The mobile client never sees it.
- Roles are written with the Admin SDK on the server, not by the client.

Local work uses the Firebase emulators, or a dedicated dev project. Production is not an agent target.

## Superpowers instead of GSD

Agent process uses [Superpowers](https://github.com/obra/superpowers) (vendored under `.cursor/skills/`), not GSD.

Cloud agents use `writing-plans`, `executing-plans`, `test-driven-development`, and `verification-before-completion`. They skip the interactive brainstorming skill because the PM writes the approved spec in `docs/plan`. They do not use `subagent-driven-development` unless that spec asks for it.

The Superpowers `sessionStart` hook was not copied into `.cursor/hooks.json`. Upstream emits Cursor's `additional_context` only when `CURSOR_PLUGIN_ROOT` is set (plugin installs), and Cursor does not run a repo `sessionStart` hook at the true start of a cloud agent session. Process instructions live in `AGENTS.md` instead.

## Maestro for QA

Device flows are tested with the Maestro CLI (`maestro test`, and `maestro mcp` once the dashboard connector is added). Java 17 and the CLI are installed by `.cursor/install.sh`. Unit tests and Firestore rules tests still come first; Maestro covers the parent and kid paths on a device or emulator.
