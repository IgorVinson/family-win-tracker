# Device preview (Tailscale + Expo Go)

Live UI review runs on **your PC**, not on the Cloud Agent VM. The agent opens a PR; you pull the branch, start Metro with this guide, and open the app on your phone with **Expo Go**. Phone and PC are both on Tailscale so you are not stuck on the same Wi‑Fi.

There is no Expo app in the tree yet. Use this flow as soon as a phase scaffolds one. Until then, review agent screenshots in the PR, or run the legacy Vite app locally if you only need the old web UI.

## One-time setup

1. **PC:** Tailscale installed and logged in (you already have this).
2. **Phone:** Install Tailscale from the App Store / Play Store, log into the **same** Tailscale account (or a tagged device on your tailnet), and leave Tailscale connected.
3. **Phone:** Install [Expo Go](https://expo.dev/go).
4. **PC:** Node.js 20+ (or the version the Expo app pins). From the repo: `npm install` in the Expo app directory when it exists.

Do not put Tailscale auth keys in the repo or in Cloud Agent secrets for this workflow. Preview traffic stays on your machines.

## Every time you want to see a PR on your phone

```bash
# On your PC
git fetch origin
git checkout <pr-branch>   # or: gh pr checkout <n>
git pull

# From the repo root — finds the Expo app and binds Metro to your Tailscale IP
./scripts/preview-device.sh
```

On the phone (Tailscale on):

1. Open Expo Go.
2. Scan the QR code from the terminal, **or** enter `exp://<your-tailscale-ip>:8081`.
3. Keep the PC awake and the script running while you tap through the app.

Override the app directory or IP when needed:

```bash
EXPO_APP_DIR=apps/mobile ./scripts/preview-device.sh
TAILSCALE_IP=100.x.y.z ./scripts/preview-device.sh
./scripts/preview-device.sh --tunnel   # Expo tunnel fallback if Tailscale is down
```

## Roles

| Who | Does |
| --- | --- |
| Cloud Agent | Implements on a branch from `dev`, opens a PR into `dev`, attaches screenshots/video for UI changes when possible |
| You (PC + phone) | Checkout the PR branch, run `./scripts/preview-device.sh`, use Expo Go over Tailscale |
| Cloud Agent VM | Does **not** join your Tailscale network or host Metro for your phone |

## Windows (PowerShell)

If you are not using Git Bash / WSL:

```powershell
git fetch origin
git checkout <pr-branch>
$ip = (tailscale ip -4 | Select-Object -First 1).Trim()
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
# cd into the Expo app directory once it exists, then:
npx expo start --lan
```

## Fallback without Tailscale

Same Wi‑Fi: `npx expo start --lan` and scan the QR code.  
Different networks, no Tailscale: `./scripts/preview-device.sh --tunnel` or `npx expo start --tunnel`.

## What agents should put in the PR

For UI-facing work, the PR should say:

1. Branch name to check out.
2. Expo app directory (once known).
3. Screenshots or a short recording of the flow.
4. Optional: “Run `./scripts/preview-device.sh` on your PC to open this branch in Expo Go.”
