# Project Rules

## Goal

This repo provisions a four-agent OpenClaw executive assistant suite for Feishu:

- `strategist`
- `chief-of-staff`
- `life-concierge`
- `second-brain`

## Preferred Flow

1. Update templates under `templates/` and shared markdown under `shared-profile/`.
2. Keep markdown generation logic in `lib/profile-renderer.mjs`.
3. Use `npm run provision:feishu` to create Feishu apps.
4. Use `npm run configure:openclaw` to install the suite into `~/.openclaw`.

## Editing Notes

- Treat `.state/` as local runtime state. Do not commit secrets or generated bot credentials.
- If you change questionnaire fields, also update:
  - `lib/profile-schema.mjs`
  - `lib/profile-renderer.mjs`
  - `apps/questionnaire/app.js`
  - `templates/skills/executive-profile-onboarding/`
- Do not point installed agents back to repo files. The installer must copy templates into `~/.openclaw/executive-feishu-suite`.

## Validation

- `npm run render:profile -- --demo`
- `npm run configure:openclaw -- --dry-run`
- `npm run validate:skill`
