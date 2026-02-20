/**
 * Reactive Heart Watch Face
 * Displays time, date, heart rate, steps, and battery level
 * on a dark navy background with a cyan accent theme.
 */

import clock from "clock";
import document from "document";
import { today } from "user-activity";
import { battery } from "power";
import { display } from "display";
import { me as appbit } from "appbit";
import { HeartRateSensor } from "heart-rate";

// ─── DOM element references ───────────────────────────────────────────────────
const timeEl    = document.getElementById("time")       as TextElement;
const secondsEl = document.getElementById("seconds")    as TextElement;
const dateEl    = document.getElementById("date")       as TextElement;
const dayEl     = document.getElementById("day")        as TextElement;
const hrEl      = document.getElementById("heart-rate") as TextElement;
const stepsEl   = document.getElementById("steps")      as TextElement;
const batteryEl = document.getElementById("battery")    as TextElement;
const heartBgEl = document.getElementById("heart-bg")   as GraphicsElement;

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS: string[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS: string[] = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Update the heart background colour based on heart rate zone:
 *  < 60 bpm  → green
 * 60–100 bpm → pink
 * > 100 bpm  → red
 */
function updateHeartColor(hr: number): void {
  const zone = hr < 60 ? "heart-green" : hr <= 100 ? "heart-pink" : "heart-red";
  (heartBgEl as any).class = zone;
}

/** Zero-pad a number to two digits (e.g. 5 → "05"). */
function zeroPad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

/**
 * Format a step count with an abbreviated suffix.
 * - < 1 000   → "842"
 * - 1 000–9 999 → "8.4k"
 * - ≥ 10 000  → "12k"
 */
function formatSteps(steps: number): string {
  if (steps >= 10000) return Math.floor(steps / 1000) + "k";
  if (steps >= 1000)  return (steps / 1000).toFixed(1) + "k";
  return "" + steps;
}

// ─── Clock ────────────────────────────────────────────────────────────────────
// Tick every second so the seconds indicator stays current.
clock.granularity = "seconds";

// ─── Heart rate sensor ────────────────────────────────────────────────────────
let hrm: HeartRateSensor | undefined;

if (HeartRateSensor && appbit.permissions.granted("access_heart_rate")) {
  hrm = new HeartRateSensor({ frequency: 1 });
  hrm.addEventListener("reading", () => {
    if (hrm) {
      const hr = hrm.heartRate;
      if (hr != null) {
        hrEl.text = String(hr);
        updateHeartColor(hr);
      } else {
        hrEl.text = "--";
      }
    }
  });
  hrm.start();
}

// ─── Main clock tick ──────────────────────────────────────────────────────────
clock.ontick = (evt) => {
  const d = evt.date;

  // Time & seconds
  timeEl.text    = zeroPad(d.getHours()) + ":" + zeroPad(d.getMinutes());
  secondsEl.text = zeroPad(d.getSeconds());

  // Day name and date
  dayEl.text  = DAYS[d.getDay()];
  dateEl.text = MONTHS[d.getMonth()] + " " + d.getDate();

  // Step count
  if (appbit.permissions.granted("access_activity")) {
    const steps = today.adjusted.steps;
    stepsEl.text = steps !== undefined ? formatSteps(steps) : "--";
  } else {
    stepsEl.text = "--";
  }

  // Battery percentage
  batteryEl.text = Math.floor(battery.chargeLevel) + "%";
};

// ─── Power management ─────────────────────────────────────────────────────────
// Pause the heart rate sensor when the display is off to save battery.
display.addEventListener("change", () => {
  if (!hrm) return;
  if (display.on) {
    hrm.start();
  } else {
    hrm.stop();
  }
});
