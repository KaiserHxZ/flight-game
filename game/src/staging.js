// Staged states for the maker's own screenshots. A ?shot= parameter
// puts the real game, running its own code, into a chosen moment: the
// cover chase view, a canyon gate run, the night approach, the title
// screen or the landed end screen. Staging only sets the starting
// state; nothing on screen is drawn except by the game itself.
export function readShotParams(search) {
  const params = new URLSearchParams(search);
  return {
    shot: params.get("shot") || null,
    seed: Number(params.get("seed") || "1"),
    mission: Number(params.get("mission") || "0"),
  };
}

export function stagedMissionId(shotParams) {
  if (shotParams.shot === "canyon") return 2;
  if (shotParams.shot === "night") return 5;
  if (shotParams.shot === "end" || shotParams.shot === "land" || shotParams.shot === "crash") return 1;
  if (shotParams.mission >= 1 && shotParams.mission <= 6) return shotParams.mission;
  return 1;
}

export function stagedMode(shotParams) {
  if (shotParams.shot === "start") return "title";
  if (shotParams.shot === "end") return "ended";
  return "flying";
}

// The cover composition: mid-flight, throttle in the green band, the
// lagoon runway dead ahead with the first dawn ring above it.
export function stagedCoverState() {
  return {
    x: 0,
    z: 240,
    altitude: 165,
    heading: 0,
    pitch: -0.05,
    bank: 0,
    speed: 96,
    throttle: 0.64,
    verticalSpeed: 0,
    onGround: false,
    airborne: true,
  };
}

export function stagedCanyonState() {
  return {
    x: -585,
    z: 3050,
    altitude: 265,
    heading: 0.02,
    pitch: -0.03,
    bank: 0.04,
    speed: 100,
    throttle: 0.68,
    verticalSpeed: 0,
    onGround: false,
    airborne: true,
  };
}

export function stagedNightState() {
  return {
    x: 20,
    z: 1750,
    altitude: 215,
    heading: Math.PI,
    pitch: -0.04,
    bank: 0,
    speed: 88,
    throttle: 0.6,
    verticalSpeed: -3,
    onGround: false,
    airborne: true,
  };
}

// Cover variant B: an offset approach, runway and ring ahead to the
// right of the plane, the island open on the left.
export function stagedCoverVariantB() {
  return {
    x: -70,
    z: 40,
    altitude: 300,
    heading: 0.1,
    pitch: -0.06,
    bank: 0.06,
    speed: 96,
    throttle: 0.64,
    verticalSpeed: 0,
    onGround: false,
    airborne: true,
  };
}

// Cover variant C: low over the lagoon, runway large ahead, ring
// floating above the strip.
export function stagedCoverVariantC() {
  return {
    x: 30,
    z: 150,
    altitude: 95,
    heading: -0.05,
    pitch: -0.02,
    bank: 0,
    speed: 92,
    throttle: 0.62,
    verticalSpeed: 0,
    onGround: false,
    airborne: true,
  };
}

export function stagedEndState() {
  return {
    x: 0,
    z: 520,
    altitude: 8,
    heading: 0,
    pitch: 0,
    bank: 0,
    speed: 0,
    throttle: 0,
    verticalSpeed: 0,
    onGround: true,
    airborne: false,
  };
}

export function stagedFlightForShot(shot) {
  if (shot === "canyon") return stagedCanyonState();
  if (shot === "night") return stagedNightState();
  if (shot === "end") return stagedEndState();
  if (shot === "land") return stagedLandState();
  if (shot === "crash") return stagedCrashState();
  if (shot === "cover-b") return stagedCoverVariantB();
  if (shot === "cover-c") return stagedCoverVariantC();
  return stagedCoverState();
}

// A gentle final approach: the real landing code resolves this into
// a landing within a few seconds of real play.
export function stagedLandState() {
  return {
    x: 0,
    z: 340,
    altitude: 30,
    heading: 0,
    pitch: 0.1,
    bank: 0,
    speed: 78,
    throttle: 0.3,
    verticalSpeed: -4,
    onGround: false,
    airborne: true,
  };
}

// A steep dive at the hillside: the real crash code resolves this
// into a crash within a few seconds of real play.
export function stagedCrashState() {
  return {
    x: 0,
    z: 300,
    altitude: 60,
    heading: 0.5,
    pitch: 0.3,
    bank: 0.2,
    speed: 150,
    throttle: 0.9,
    verticalSpeed: -26,
    onGround: false,
    airborne: true,
  };
}
