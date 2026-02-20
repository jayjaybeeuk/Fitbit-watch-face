# Reactive Heart Watch Face

A clean, dark-themed digital watch face for **Fitbit Versa 3** and **Fitbit Sense** (336 × 336 circular display).

## Features

| Area          | What's shown                              |
| ------------- | ----------------------------------------- |
| Top           | Day of week + full date                   |
| Centre        | `HH:MM` in large electric cyan            |
| Below time    | Seconds indicator                         |
| Bottom left   | Heart rate (bpm) in pink                  |
| Bottom centre | Step count (abbreviated: `8.4k`) in green |
| Bottom right  | Battery percentage in amber               |

## Colour palette

| Token      | Hex       | Used for         |
| ---------- | --------- | ---------------- |
| Background | `#0d1b2a` | Deep navy canvas |
| Time       | `#00d4ff` | Electric cyan    |
| Seconds    | `#5eafc7` | Muted teal       |
| Heart rate | `#f472b6` | Pink             |
| Steps      | `#4ade80` | Mint green       |
| Battery    | `#fbbf24` | Amber            |

## Project structure

```
├── app/
│   └── index.ts          Device-side TypeScript (clock logic, sensors)
├── resources/
│   ├── index.gui         SVG-based GUI layout (336 × 336)
│   ├── widgets.gui       Widget definitions (imported by index.gui)
│   ├── styles.css        Colours, font sizes, text anchors
│   └── icon.png          App icon – see Prerequisites below
├── package.json          SDK config + build targets
└── tsconfig.json         Extends @fitbit/sdk/sdk-tsconfig.json
```

## Prerequisites

- **Node.js** 18 + npm (or Yarn Classic)
- **Fitbit OS** device or simulator
- **Fitbit account** (free) for sideloading

### App icon

The Fitbit build toolchain requires `resources/icon.png` (80 × 80 px).
Create or add any 80 × 80 pixel PNG at that path before building.

## Setup

```bash
npm install        # installs @fitbit/sdk and @fitbit/sdk-cli
```

## Build

```bash
npm run build      # runs fitbit-build → produces build/*.fba
```

## Develop / sideload

```bash
npm run debug      # opens fitbit CLI; connect device & simulator
```

Inside the Fitbit CLI:

```
fitbit> connect device
fitbit> connect phone    # optional companion
fitbit> install
```

## Build targets

| Target key | Device          |
| ---------- | --------------- |
| `meson`    | Versa 3 / Sense |
| `higgs`    | Versa 2         |

Add more targets to the `buildTargets` array in `package.json` as needed
(e.g. `"hera"` for Versa Lite, `"atlas"` for Ionic).

## Permissions

| Permission          | Usage                                    |
| ------------------- | ---------------------------------------- |
| `access_heart_rate` | Reads from the optical heart rate sensor |
| `access_activity`   | Reads today's step count                 |

Both are requested at install time; the app degrades gracefully (`--`)
if they are denied.

## License

MIT
