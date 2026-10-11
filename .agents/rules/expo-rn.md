---
trigger: always_on
description: "Expo React Native constraints for the KidsRise rebuild"
---

<!-- Generated from .cursor/rules/expo-rn.mdc. .cursor/rules is the source of truth. Edit that file and run `npm run sync-agent-rules`. -->

- New product code is Expo (React Native). Load `expo-overview` before other Expo skills.
- Install Expo packages with `npx expo install <pkg>` so versions match the SDK.
- Do not add Vite, Supabase, or the legacy web UI to the new app.
- Leave `src/`, `supabase/`, and the Vite config in place until a `docs/plan` phase removes them.
- One phase from `docs/plan` per pull request.
