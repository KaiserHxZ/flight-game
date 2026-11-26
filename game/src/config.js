// Sriti Air Mail — shared tuning constants for the whole game.
// One place for every number a designer would retune: speeds, fuel,
// scoring, world size and the look of the day. Nothing here reads the
// network or the environment; every value is fixed in this file.
export const WORLD = {
  width: 4800,
  depth: 6000,
  seaLevel: 0,
  gridCells: 240,
  gridMinX: -2400,
  gridMinZ: -200,
  cellSize: 20,
};

export const PLANE = {
  minSpeed: 38,
  cruiseSpeed: 95,
  maxSpeed: 168,
  climbRate: 34,
  sinkRate: 30,
  turnRate: 1.55,
  bankMax: 0.62,
  stallSpeed: 52,
  takeoffSpeed: 62,
  groundClearance: 3,
};

export const FUEL = {
  start: 100,
  idleBurn: 0.05,
  throttleBurn: 0.18,
  fullBurn: 0.28,
  reserveWarning: 25,
  emptyDamagePerSecond: 0,
};

export const SCORE = {
  ringPoints: 120,
  gatePoints: 90,
  dropPoints: 260,
  landingPerfect: 500,
  landingGood: 300,
  landingHard: 120,
  disciplinePerSecond: 4,
  disciplineBandLow: 0.55,
  disciplineBandHigh: 0.75,
  comboWindowSeconds: 9,
  comboStep: 0.5,
  comboCap: 3,
};

export const DAMAGE = {
  terrainHit: 34,
  hardLanding: 26,
  stormGust: 6,
  maxBeforeBreakup: 100,
};

export const VIEW = {
  width: 1280,
  height: 800,
  focal: 620,
  horizonRest: 330,
  nearDepth: 24,
  farDepth: 1500,
  depthSteps: 72,
  columnStep: 2,
};

export const MISSION_TIME_LIMIT = 300;

export const COLORS = {
  skyTopDay: "#3f7fc4",
  skyBottomDay: "#bfe0f2",
  skyTopDusk: "#e08a4e",
  skyBottomDusk: "#f6d9a8",
  skyTopNight: "#0b1633",
  skyBottomNight: "#274a7a",
  seaDeep: "#1d5f8a",
  seaShallow: "#3f9db8",
  sand: "#e3cf96",
  grass: "#5d9b4a",
  forest: "#3c7a38",
  rock: "#8a7f74",
  snow: "#eef3f6",
  runway: "#3a3f45",
  runwayLine: "#f5e9b8",
};
