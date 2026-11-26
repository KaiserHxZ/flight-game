// Flight physics: throttle, lift, banking turns, stall, wind drift and
// the throttle-discipline score. The plane is a seaplane mail carrier:
// it answers the throttle at every speed, sinks when slow and nose-high,
// and rewards a steady hand in the green throttle band.
import { PLANE, SCORE } from "./config.js";

export function createFlightState(spawn) {
  return {
    x: spawn.x,
    z: spawn.z,
    altitude: spawn.altitude,
    heading: spawn.heading,
    pitch: 0,
    bank: 0,
    speed: spawn.speed,
    throttle: spawn.throttle,
    verticalSpeed: 0,
    onGround: spawn.onGround === true,
    airborne: spawn.onGround !== true,
    landingArmed: true,
    windX: 0,
    windZ: 0,
    disciplineSeconds: 0,
    disciplineScore: 0,
  };
}

export function throttleInDisciplineBand(throttle) {
  return throttle >= SCORE.disciplineBandLow && throttle <= SCORE.disciplineBandHigh;
}

export function updateFlight(flight, input, wind, dt, groundHeight) {
  const targetThrottle = input.throttleUp
    ? Math.min(1, flight.throttle + dt * 0.7)
    : input.throttleDown
      ? Math.max(0, flight.throttle - dt * 0.8)
      : flight.throttle;
  flight.throttle = targetThrottle;

  const targetSpeed = PLANE.minSpeed + flight.throttle * (PLANE.maxSpeed - PLANE.minSpeed);
  const response = flight.onGround ? 0.55 : 0.32;
  flight.speed += (targetSpeed - flight.speed) * Math.min(1, response * dt * 2.2);

  const steer = (input.turnLeft ? -1 : 0) + (input.turnRight ? 1 : 0) + input.mouseSteer;
  const targetBank = steer * PLANE.bankMax;
  flight.bank += (targetBank - flight.bank) * Math.min(1, dt * 5);
  flight.heading += -flight.bank * PLANE.turnRate * dt * (0.45 + flight.speed / PLANE.maxSpeed);

  const pitchInput = (input.pitchUp ? -1 : 0) + (input.pitchDown ? 1 : 0) + input.mousePitch;
  const targetPitch = flight.onGround ? 0 : pitchInput * 0.34;
  flight.pitch += (targetPitch - flight.pitch) * Math.min(1, dt * 4);

  const stalling = !flight.onGround && flight.speed < PLANE.stallSpeed && flight.pitch < -0.08;
  let climb = 0;
  if (!flight.onGround) {
    const lift = (flight.speed - PLANE.stallSpeed) / (PLANE.cruiseSpeed - PLANE.stallSpeed);
    climb = -flight.pitch * PLANE.climbRate * Math.max(0.15, Math.min(1.4, lift + 0.4));
    if (stalling) climb -= 26;
    climb += (flight.speed - PLANE.cruiseSpeed) * 0.02;
  }
  flight.verticalSpeed += (climb - flight.verticalSpeed) * Math.min(1, dt * 2.4);

  const forwardX = Math.sin(flight.heading);
  const forwardZ = Math.cos(flight.heading);
  const driftX = wind.x * dt * 0.35;
  const driftZ = wind.z * dt * 0.35;
  flight.x += (forwardX * flight.speed + driftX) * dt;
  flight.z += (forwardZ * flight.speed + driftZ) * dt;
  flight.altitude += flight.verticalSpeed * dt;

  const clearance = flight.altitude - groundHeight;
  if (clearance <= PLANE.groundClearance) {
    flight.altitude = groundHeight + PLANE.groundClearance;
    flight.touchdownSpeed = flight.verticalSpeed;
    if (flight.onGround) {
      flight.verticalSpeed = 0;
      if (flight.speed >= PLANE.takeoffSpeed && flight.pitch < -0.06) {
        flight.onGround = false;
        flight.airborne = true;
      }
    } else {
      flight.verticalSpeed = Math.max(0, flight.verticalSpeed);
    }
  } else if (clearance > 40) {
    flight.touchdownSpeed = null;
    flight.landingArmed = true;
  }
  if (flight.altitude > 900) {
    flight.altitude = 900;
    flight.verticalSpeed = Math.min(0, flight.verticalSpeed);
  }

  if (throttleInDisciplineBand(flight.throttle) && flight.airborne && !stalling) {
    flight.disciplineSeconds += dt;
    flight.disciplineScore += SCORE.disciplinePerSecond * dt;
  }
  flight.stalling = stalling;
  return flight;
}

export function landingQuality(flight, runwayHeading) {
  const headingError = Math.abs(normalizeAngle(flight.heading - runwayHeading));
  const softness = Math.max(0, 1 - Math.abs(flight.verticalSpeed) / 22);
  const alignment = Math.max(0, 1 - headingError / 0.5);
  const speedFit = flight.speed < 105 ? 1 : Math.max(0, 1 - (flight.speed - 105) / 60);
  return { softness, alignment, speedFit, score: softness * 0.5 + alignment * 0.3 + speedFit * 0.2 };
}

export function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function describeFlightControls() {
  return "W/S throttle, A/D or arrow keys turn and pitch, mouse steers, Space drops the parcel, Enter starts and restarts.";
}
