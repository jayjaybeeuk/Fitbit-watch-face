# Reactive Heart Watch Face

A clean, dark-themed digital clock face for **Fitbit Versa 3** and **Fitbit Sense**
(336 × 336 squircle display), built with the Fitbit OS SDK.

The headline feature is a large heart drawn behind the clock that **changes colour
with your live heart rate**, so your current effort level is readable at a glance
without taking your eyes off the time.

```
              SUN
             NOV 13
        ────────────────
              09:41
                07
        ────────────────
   HEART    │  STEPS  │  BATT
    72      │   8.4k  │   85%
    bpm     │         │
```

## Features

| Area          | What's shown                                   |
| ------------- | ---------------------------------------------- |
| Top           | Day of week + month and day                    |
| Centre        | `HH:MM` in large electric cyan                 |
| Below time    | Two-digit seconds, ticking every second        |
| Background    | Oversized heart, tinted by heart-rate zone     |
| Bottom left   | Heart rate (bpm) in pink                       |
| Bottom centre | Step count, abbreviated (`842`, `8.4k`, `12k`) |
| Bottom right  | Battery percentage in amber                    |

## Heart-rate reactive background

The heart behind the clock is recoloured on every sensor reading by
[`updateHeartColor()`](app/index.ts), which swaps the SVG `class` of the
`#heart-bg` path. The sensor samples once per second.

| Heart rate  | Zone     | Class         | Colour    |
| ----------- | -------- | ------------- | --------- |
| `< 60 bpm`  | Resting  | `heart-green` | `#22c55e` |
| `60–100 bpm`| Active   | `heart-pink`  | `#f472b6` |
| `> 100 bpm` | Peak     | `heart-red`   | `#ef4444` |

If the heart-rate permission is denied, or the sensor returns no value, the
heart stays at its default pink and the value shows `--`.

## Colour palette

| Token      | Hex       | Used for         |
| ---------- | --------- | ---------------- |
| Background | `#0d1b2a` | Deep navy canvas |
| Ring       | `#1a3050` | Decorative chrome |
| Time       | `#00d4ff` | Electric cyan    |
| Seconds    | `#5eafc7` | Muted teal       |
| Day        | `#ffffff` | White            |
| Date       | `#94a3b8` | Slate            |
| Heart rate | `#f472b6` | Pink             |
| Steps      | `#4ade80` | Mint green       |
| Battery    | `#fbbf24` | Amber            |
| Labels     | `#475569` | Dim slate        |

All colours live in [`resources/styles.css`](resources/styles.css) as CSS classes,
so re-theming is a single-file change.

## Project structure

```
├── app/
│   ├── index.ts          Device-side TypeScript: clock, sensors, power handling
│   └── tsconfig.json     Device build config (noEmit, Fitbit device types)
├── resources/
│   ├── index.view        SVG layout for the 336 × 336 display
│   ├── widget.defs       Widget definitions imported by index.view
│   └── styles.css        Colours, font sizes, text anchors
├── .github/
│   └── workflows/
│       └── release.yml   Builds and releases on every push to main
├── .releaserc.json       semantic-release config (publishes the .fba)
├── package.json          SDK config, permissions, build targets, scripts
└── tsconfig.json         Extends @fitbit/sdk/sdk-tsconfig.json
```

The GUI file names follow the SDK 5+ convention: `index.view` and `widget.defs`
(the older SDK 4 names were `index.gui` and `widgets.gui`).

## Prerequisites

- **Node.js 18+** with npm (the release workflow pins Node 18)
- **Fitbit OS Simulator** and/or a physical Versa 3 / Sense
- A **Fitbit account** (free) for sideloading
- The **developer bridge** enabled on the device and in the Fitbit mobile app

### App icon

`package.json` points `fitbit.iconFile` at `resources/icon.png`, and the build
fails if that file is missing. The icon is not committed to this repository, so
add an **80 × 80 px PNG** at `resources/icon.png` before building.

## Setup

```bash
npm ci            # or: npm install
```

This installs `@fitbit/sdk`, `@fitbit/sdk-cli` and `fitbit-sdk-types`.

## Build

```bash
npm run build     # fitbit-build -> build/app.fba
```

The single `.fba` contains a build for each target in `fitbit.buildTargets`.

## Develop / sideload

```bash
npm run debug     # opens the interactive fitbit CLI
```

Inside the CLI:

```
fitbit> connect device      # or "connect simulator"
fitbit> install             # push build/app.fba to the device
fitbit> logout
```

Use `connect device` when the developer bridge is enabled on real hardware, or
`connect simulator` to run in the Fitbit OS Simulator.

## Build targets

`fitbit.buildTargets` in [`package.json`](package.json) is currently
`["atlas", "vulcan"]` — Versa 3 and Sense, the two devices this layout is drawn
for. Alias-to-device mapping from the Fitbit SDK docs:

| Alias    | Device      | Display   | SDK |
| -------- | ----------- | --------- | --- |
| `atlas`  | Versa 3     | 336 × 336 | 5+  |
| `vulcan` | Sense       | 336 × 336 | 5+  |
| `meson`  | Versa       | 300 × 300 | 4   |
| `gemini` | Versa Lite  | 300 × 300 | 4   |
| `mira`   | Versa 2     | 300 × 300 | 4   |
| `higgs`  | Ionic       | 348 × 250 | 3   |

SDK 4 targets cannot be mixed with SDK 5+ targets in one project, and the 336 × 336
layout would need to be re-drawn for the 300 × 300 square screens.

## Permissions

| Permission          | Usage                                    |
| ------------------- | ---------------------------------------- |
| `access_heart_rate` | Reads the optical heart-rate sensor      |
| `access_activity`   | Reads today's step count                 |

Both are requested at install time. Each is checked with
`appbit.permissions.granted(...)` before use; if either is denied the
corresponding field renders `--` and the face keeps working.

## How it works

- [`app/index.ts`](app/index.ts) sets `clock.granularity = "seconds"` so the
  seconds readout stays current, and refreshes time, date, steps and battery
  from `clock.ontick`.
- A `HeartRateSensor` is created at `frequency: 1` and updates the heart-rate
  text on each `reading` event.
- The sensor is stopped when the display turns off and restarted when it turns
  on (`display` change events) to keep battery drain down.
- Steps are abbreviated by `formatSteps()`: under 1 000 shows the raw count,
  1 000–9 999 shows one decimal (`8.4k`), and 10 000+ shows whole thousands (`12k`).

## Customising

| Change                        | File                                          |
| ----------------------------- | --------------------------------------------- |
| Colours, font sizes, anchors  | [`resources/styles.css`](resources/styles.css) |
| Layout, ring radii, heart path| [`resources/index.view`](resources/index.view) |
| Sensors, formatting, power    | [`app/index.ts`](app/index.ts)                 |
| Display name, UUID, targets   | [`package.json`](package.json)                 |

## Continuous integration and releases

[`.github/workflows/release.yml`](.github/workflows/release.yml) runs on every
push to `main`: it installs with `npm ci`, builds the face, then runs
`semantic-release` with the config in `.releaserc.json`, which publishes a GitHub
release with `build/app.fba` attached as `modern-watch-face.fba`.

Because the release notes and version bump are derived from commit subjects,
this repository follows [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `chore:`, …).

## Troubleshooting

| Symptom                                | Fix                                                        |
| -------------------------------------- | ---------------------------------------------------------- |
| Build fails on `resources/icon.png`    | Add an 80 × 80 px PNG at that path                         |
| `Project configuration is invalid`     | Check `fitbit.buildTargets` against the installed SDK major |
| Device never appears over the bridge   | Enable the developer bridge on the watch *and* in the app   |
| Stale face after an install            | Re-run `connect device` then `install`                     |

## Contributing

Fork, branch from `main`, keep commits in Conventional Commit form so the release
pipeline can pick them up, and open a pull request describing the change.

## License

MIT, as declared in [`package.json`](package.json).
