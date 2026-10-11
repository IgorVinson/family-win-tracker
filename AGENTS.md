# KidsRise

KidsRise is a from-scratch mobile rebuild of Family Win Tracker. The Vite + Supabase app in this repo is legacy. Do not extend it, and do not delete it until a phase in `docs/plan` says to remove it.

`CLAUDE.md` describes that legacy app. This file governs new work.

## Stack

- React Native with Expo (Expo Router once the app exists)
- Firebase Authentication, Cloud Firestore, Cloud Storage, and Cloud Functions
- Maestro for device QA

There is no Expo app in the tree yet. Do not scaffold one unless the active spec in `docs/plan` says to.

## Commands

Cloud Agents install toolchain dependencies with `bash .cursor/install.sh` (Node.js 24.21.0 LTS, `firebase-tools`, Java 17, Maestro CLI). That script does not install the legacy Vite app.

Legacy app, left in place and not the rebuild workflow:

```bash
npm install
npm run dev
npm run lint
npm run build
```

KidsRise, after a spec says the app exists:

```bash
npx create-expo-app@latest
npx expo start
npx expo install <package>
npx -y firebase-tools@latest --version
npx -y firebase-tools@latest emulators:start
maestro test <flow.yaml>
```

Use the Firebase emulators for Auth, Firestore, Storage, and Functions. Do not point agent tools at a production Firebase project.

## Process

Superpowers skills are vendored in `.cursor/skills/` (MIT, Jesse Vincent, [obra/superpowers](https://github.com/obra/superpowers) v7.0.0, commit `bb92a77741419a4ab5f06e711a283343f1ada0c3`). See `.cursor/skills/NOTICE`.

For each phase, use these skills:

- `writing-plans` — turn the approved spec into an implementation plan before editing product code
- `executing-plans` — carry out that plan
- `test-driven-development` — failing test, then implementation
- `verification-before-completion` — run the checks and read the output before claiming the phase is done

Cloud agents skip interactive brainstorming. The PM supplies approved specs in `docs/plan`. Read the spec and implement it.

Do not use `subagent-driven-development` unless the spec asks for it.

Expo skills in `.agents/skills/` (`expo-overview` first, then the leaf skill) and Firebase skills in `.agents/skills/` cover implementation. `skills-lock.json` records the installed copies.

### Git and pull requests

- **Base branch is `dev`.** Create every feature branch from the latest `origin/dev`.
- **Every pull request targets `dev`.** Do not open PRs against `main` unless the PM explicitly asks for a release merge.
- **One phase per pull request.** Unrelated tasks get separate branches and separate PRs.
- **`main` is production.** Promoting `dev` → `main` is a release step the PM owns; agents do not treat `main` as the day-to-day integration branch.

Typical loop: pull `dev` → branch → plan → implement with TDD → verify → push → open or update a PR into `dev` → merge → next task starts from updated `dev`.

There is no `.cursor/hooks.json`. The Superpowers sessionStart hook injects context only when `CURSOR_PLUGIN_ROOT` is set, and Cursor does not run project `sessionStart` hooks at the real start of a cloud agent session. `AGENTS.md` is the process source for cloud agents.

## Security

- Firestore and Storage rules are scoped to each family.
- Parent and kid roles are assigned only server-side (Cloud Functions, Admin SDK).
- The AI vision key lives only in Cloud Functions.
- No secrets in the client, the repo, or `EXPO_PUBLIC_*`.
- Kids have no email signup.

## Specs

- `docs/plan/PROJECT.md` — goal and phase 1
- `docs/plan/ROADMAP.md` — proposed later phases
- `docs/plan/DECISIONS.md` — stack and process decisions
