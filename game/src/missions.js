// The six sorties of Sriti Air Mail. Each sortie has its own goal, its
// own weather and its own corner of Kepulauan Layar: rings, canyon
// gates, island hops, a storm front, a night landing and one last
// supply drop. Names, places and people here are invented.
import { RUNWAY, AIRSTRIPS, DROP_ZONE } from "./terrain.js";

function ring(x, z, y, radius, label) {
  return { kind: "ring", x, z, y, radius, label, passed: false };
}

function gate(x, z, y, radius, label) {
  return { kind: "gate", x, z, y, radius, label, passed: false };
}

export const MISSIONS = [
  {
    id: 1,
    name: "Fajar di Laguna Biru",
    goal: "Terbang melewati 5 cincin fajar, lalu mendarat di Laguna.",
    goalKind: "rings",
    weather: "dawn",
    wind: { x: 2, z: 1 },
    spawn: { x: 0, z: 120, altitude: 150, heading: 0, speed: 88, throttle: 0.62, onGround: false },
    targets: [
      ring(0, 700, 170, 42, "Cincin 1"),
      ring(-90, 1100, 190, 42, "Cincin 2"),
      ring(80, 1500, 170, 42, "Cincin 3"),
      ring(-60, 1900, 200, 42, "Cincin 4"),
      ring(0, 2300, 180, 46, "Cincin 5"),
    ],
    landing: RUNWAY,
  },
  {
    id: 2,
    name: "Gerbang Ngarai Batu",
    goal: "Lewati 6 gerbang di antara tebing Pulau Batu Karang.",
    goalKind: "gates",
    weather: "day",
    wind: { x: 5, z: -2 },
    spawn: { x: -420, z: 2900, altitude: 240, heading: 0, speed: 92, throttle: 0.66, onGround: false },
    targets: [
      gate(-420, 3200, 250, 40, "Gerbang 1"),
      gate(-560, 3500, 270, 38, "Gerbang 2"),
      gate(-300, 3800, 260, 38, "Gerbang 3"),
      gate(-520, 4100, 290, 38, "Gerbang 4"),
      gate(-380, 4400, 270, 38, "Gerbang 5"),
      gate(-460, 4700, 300, 42, "Gerbang 6"),
    ],
    landing: AIRSTRIPS[1],
  },
  {
    id: 3,
    name: "Lompat Pulau Sriti",
    goal: "Sentuh landasan di Pulau Bakau, lalu di Pulau Senja.",
    goalKind: "hops",
    weather: "day",
    wind: { x: -3, z: 3 },
    spawn: { x: 0, z: 520, altitude: 8, heading: 0, speed: 0, throttle: 0.2, onGround: true },
    targets: [
      ring(500, 1500, 200, 48, "Penanda Bakau"),
      ring(900, 2000, 190, 48, "Penanda Senja"),
    ],
    landing: AIRSTRIPS[0],
    secondLanding: AIRSTRIPS[1],
  },
  {
    id: 4,
    name: "Depan Badai Kelabu",
    goal: "Terbang menembus badai, lewati 4 penanda, jangan sampai rusak.",
    goalKind: "storm",
    weather: "storm",
    wind: { x: 16, z: -9 },
    spawn: { x: 200, z: 800, altitude: 210, heading: 0.2, speed: 98, throttle: 0.7, onGround: false },
    targets: [
      ring(150, 1400, 220, 46, "Penanda 1"),
      ring(-150, 2100, 240, 46, "Penanda 2"),
      ring(200, 2800, 230, 46, "Penanda 3"),
      ring(-100, 3500, 250, 46, "Penanda 4"),
    ],
    landing: RUNWAY,
  },
  {
    id: 5,
    name: "Pendaratan Malam Lentera",
    goal: "Ikuti lampu lentera dan mendarat di Laguna dalam gelap.",
    goalKind: "night",
    weather: "night",
    wind: { x: 1, z: 2 },
    spawn: { x: 60, z: 2600, altitude: 260, heading: Math.PI, speed: 86, throttle: 0.58, onGround: false },
    targets: [
      ring(40, 2000, 230, 46, "Lentera 1"),
      ring(-20, 1400, 200, 46, "Lentera 2"),
      ring(0, 900, 160, 46, "Lentera 3"),
    ],
    landing: RUNWAY,
  },
  {
    id: 6,
    name: "Kiriman Terakhir",
    goal: "Jatuhkan parsel di Mercusuar Lentera, lalu pulang ke Laguna.",
    goalKind: "drop",
    weather: "dusk",
    wind: { x: -4, z: -3 },
    spawn: { x: 0, z: 520, altitude: 8, heading: 0, speed: 0, throttle: 0.2, onGround: true },
    targets: [ring(-700, 1600, 210, 52, "Jalur Lentera")],
    dropZone: DROP_ZONE,
    landing: RUNWAY,
  },
];

export function missionById(id) {
  return MISSIONS.find((mission) => mission.id === id) || MISSIONS[0];
}

export function freshTargets(mission) {
  return mission.targets.map((target) => ({ ...target, passed: false }));
}

export function nextUnpassedTarget(targets) {
  return targets.find((target) => !target.passed) || null;
}

export function targetsPassedCount(targets) {
  return targets.filter((target) => target.passed).length;
}

export function describeMissions() {
  return MISSIONS.map((mission) => `${mission.id}. ${mission.name} — ${mission.goal}`).join("\n");
}
