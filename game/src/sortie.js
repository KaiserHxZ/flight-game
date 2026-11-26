// Fuel, damage, score and combo: the sortie ledger. Fuel burns faster
// the harder the throttle is pushed, damage comes from the ground, hard
// landings and storm gusts, and rings chained close together build a
// combo that multiplies everything the pilot earns after them.
import { FUEL, SCORE, DAMAGE } from "./config.js";

export function createSortie() {
  return {
    fuel: FUEL.start,
    damage: 0,
    score: 0,
    combo: 1,
    comboTimer: 0,
    ringsHit: 0,
    dropsHit: 0,
    landings: 0,
    elapsed: 0,
    events: [],
    outcome: null,
    outcomeDetail: "",
  };
}

export function burnFuel(sortie, throttle, dt, airborne) {
  if (!airborne && throttle < 0.3) return;
  const burn = FUEL.idleBurn + throttle * FUEL.throttleBurn + throttle * throttle * FUEL.fullBurn;
  sortie.fuel = Math.max(0, sortie.fuel - burn * dt);
  if (sortie.fuel <= 0) {
    sortie.events.push({ kind: "fuel-empty", at: sortie.elapsed });
  }
}

export function applyDamage(sortie, amount, reason) {
  sortie.damage = Math.min(DAMAGE.maxBeforeBreakup, sortie.damage + amount);
  sortie.events.push({ kind: "damage", reason, amount, at: sortie.elapsed });
  if (sortie.damage >= DAMAGE.maxBeforeBreakup) {
    sortie.outcome = "crash";
    sortie.outcomeDetail = reason;
  }
}

export function awardRing(sortie, points, label) {
  sortie.ringsHit += 1;
  const earned = Math.round(points * sortie.combo);
  sortie.score += earned;
  sortie.combo = Math.min(SCORE.comboCap, sortie.combo + SCORE.comboStep);
  sortie.comboTimer = SCORE.comboWindowSeconds;
  sortie.events.push({ kind: "ring", label, earned, combo: sortie.combo, at: sortie.elapsed });
  return earned;
}

export function awardDrop(sortie, points) {
  sortie.dropsHit += 1;
  const earned = Math.round(points * sortie.combo);
  sortie.score += earned;
  sortie.events.push({ kind: "drop", earned, at: sortie.elapsed });
  return earned;
}

export function awardLanding(sortie, points, qualityLabel) {
  sortie.landings += 1;
  const earned = Math.round(points * sortie.combo);
  sortie.score += earned;
  sortie.events.push({ kind: "landing", label: qualityLabel, earned, at: sortie.elapsed });
  return earned;
}

export function tickSortie(sortie, flight, dt) {
  sortie.elapsed += dt;
  if (sortie.comboTimer > 0) {
    sortie.comboTimer -= dt;
    if (sortie.comboTimer <= 0) sortie.combo = 1;
  }
  if (flight.disciplineScore > 0) {
    sortie.score += flight.disciplineScore;
    flight.disciplineScore = 0;
  }
}

export function fuelState(sortie) {
  if (sortie.fuel <= 0) return "empty";
  if (sortie.fuel <= FUEL.reserveWarning) return "reserve";
  return "ok";
}

export function damageState(sortie) {
  if (sortie.damage >= 70) return "critical";
  if (sortie.damage >= 40) return "heavy";
  if (sortie.damage > 0) return "light";
  return "clean";
}

export function describeSortieSystems() {
  return [
    "ThrottleDiscipline",
    "FuelManagement",
    "DamageModel",
    "WindGusts",
    "RingGateScoring",
    "LandingJudge",
    "ScoreCombo",
  ];
}
