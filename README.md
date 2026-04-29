# DebugBear Automation

Nuxt-based DebugBear batch performance testing tool.

## Requirements

- Node.js 20+
- pnpm

## Local development

```bash
pnpm install
pnpm dev
```

## Build web server output

```bash
pnpm build:web
```

## Desktop packaging (Electron)

The desktop app bundles Electron + Nuxt server output. End users do not need to install Node/pnpm.

### Build macOS Apple Silicon package

```bash
pnpm dist:mac
```

Artifacts are generated under `dist/` (`.dmg` and `.zip`, `arm64` only).

### Build Windows package

```bash
pnpm dist:win
```

Artifacts are generated under `dist/` (`nsis` installer and `portable`).

## Notes for unsigned macOS builds

- First run may be blocked by Gatekeeper.
- Open with Finder right-click -> Open, then confirm.
