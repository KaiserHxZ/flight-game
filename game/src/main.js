// Sriti Air Mail — game loop and state machine. Title, flying and
// ended states; mission selection by key or click; ring passing,
// supply drops, landings and crashes resolved here from the flight,
// terrain and sortie systems. No network, no storage, no timers
// outside this loop.
import { VIEW, SCORE, DAMAGE, PLANE } from "./config.js";
import { buildHeightGrid, sampleHeightGrid, RUNWAY } from "./terrain.js";
import { createFlightState, updateFlight, landingQuality, normalizeAngle } from "./flight.js";
import { missionById, freshTargets, nextUnpassedTarget, targetsPassedCount } from "./missions.js";
import {
  createSortie,
  burnFuel,
  applyDamage,
  awardRing,
  awardDrop,
  awardLanding,
  tickSortie,
} from "./sortie.js";
import { createInput, attachInput, readFlightInput, consumePress, consumeClick, endFrameInput } from "./input.js";
import { drawSkyAndTerrain } from "./render.js";
import { drawAircraft } from "./aircraft.js";
import { drawHud } from "./hud.js";
import { readShotParams, stagedMissionId, stagedMode, stagedFlightForShot } from "./staging.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const grid = buildHeightGrid();
const input = createInput();
attachInput(input, canvas);
const shotParams = readShotParams(window.location.search);
const STAGED = shotParams.shot !== null;

const game = {
  mode: "title",
  missionId: 1,
  mission: missionById(1),
  targets: [],
  flight: null,
  sortie: createSortie(),
  wind: { x: 2, z: 1, gust: 0 },
  time: 0,
  message: "",
  messageTimer: 0,
  parcelDropped: false,
  parcel: null,
  hopped: 0,
  selectedMission: 1,
};

function startMission(missionId) {
  const mission = missionById(missionId);
  game.missionId = missionId;
  game.mission = mission;
  game.targets = freshTargets(mission);
  game.flight = createFlightState(mission.spawn);
  game.sortie = createSortie();
  game.wind = { x: mission.wind.x, z: mission.wind.z, gust: 0 };
  game.mode = "flying";
  game.message = mission.goal;
  game.messageTimer = 5;
  game.parcelDropped = false;
  game.parcel = null;
  game.hopped = 0;
  if (STAGED) applyStagedState(missionId);
}

function applyStagedState(missionId) {
  const shot = shotParams.shot;
  const staged = stagedFlightForShot(shot);
  Object.assign(game.flight, staged);
  game.sortie.elapsed = shot === "end" ? 214 : 96;
  game.sortie.score = shot === "end" ? 1840 : shot === "canyon" || shot === "night" ? 260 : 120;
  game.sortie.ringsHit = shot === "end" ? 5 : shot === "canyon" || shot === "night" ? 1 : 0;
  if (shot === "end") {
    game.targets.forEach((target) => { target.passed = true; });
    endSortie("landed", "Pendaratan sempurna di Lapangan Terbang Laguna. Surat sampai tepat waktu.");
  } else if (shot === "canyon") {
    game.targets[0].passed = true;
    game.sortie.combo = 1.5;
  } else if (shot === "night") {
    game.targets[0].passed = true;
  } else {
    game.targets[0].passed = false;
  }
  if (shot === "cover" || shot === "play" || shot === "cover-b" || shot === "cover-c") {
    game.message = "Cincin fajar di depan — terbanglah melewatinya.";
    game.messageTimer = 6;
  }
}

function endSortie(outcome, detail) {
  game.mode = "ended";
  game.sortie.outcome = outcome;
  game.sortie.outcomeDetail = detail;
}

function checkRingPassing() {
  const flight = game.flight;
  const next = nextUnpassedTarget(game.targets);
  if (!next) return;
  const dx = flight.x - next.x;
  const dz = flight.z - next.z;
  const dy = flight.altitude - next.y;
  const horizontal = Math.sqrt(dx * dx + dz * dz);
  if (horizontal < next.radius * 0.9 && Math.abs(dy) < next.radius * 0.85) {
    next.passed = true;
    const label = next.kind === "gate" ? SCORE.gatePoints : SCORE.ringPoints;
    const earned = awardRing(game.sortie, label, next.label);
    game.message = `${next.label} dilewati! +${earned} poin.`;
    game.messageTimer = 3.5;
  }
}

function checkDropZone(dropPressed) {
  const mission = game.mission;
  if (!mission.dropZone || game.parcelDropped || !dropPressed) return;
  const flight = game.flight;
  const dx = flight.x - mission.dropZone.x;
  const dz = flight.z - mission.dropZone.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  if (distance < mission.dropZone.radius + 60 && flight.altitude < 320) {
    game.parcelDropped = true;
    game.parcel = { x: flight.x, z: flight.z, y: flight.altitude };
    const earned = awardDrop(game.sortie, SCORE.dropPoints);
    game.message = `Parsel sampai di Mercusuar Lentera! +${earned} poin. Pulanglah ke Laguna.`;
    game.messageTimer = 5;
  } else {
    game.message = "Belum di atas zona kiriman — terbanglah ke Mercusuar Lentera.";
    game.messageTimer = 3;
  }
}

function nearestStrip() {
  const flight = game.flight;
  const strips = [RUNWAY, ...(game.mission.secondLanding ? [game.mission.landing] : [])];
  let best = { strip: RUNWAY, distance: Infinity };
  for (const strip of [RUNWAY, game.mission.landing, game.mission.secondLanding].filter(Boolean)) {
    const d = Math.hypot(flight.x - strip.x, flight.z - strip.z);
    if (d < best.distance) best = { strip, distance: d };
  }
  return best;
}

function checkLandingAndCrash(dt) {
  const flight = game.flight;
  const ground = sampleHeightGrid(grid, flight.x, flight.z);
  const clearance = flight.altitude - ground;
  const { strip, distance } = nearestStrip();
  const relX = flight.x - strip.x;
  const relZ = flight.z - strip.z;
  const alongStrip = Math.abs(relX * Math.sin(strip.heading) + relZ * Math.cos(strip.heading));
  const acrossStrip = Math.abs(relX * Math.cos(strip.heading) - relZ * Math.sin(strip.heading));
  const onStrip = alongStrip < strip.length / 2 + 30 && acrossStrip < strip.width / 2 + 40;

  if (
    !flight.onGround &&
    flight.landingArmed &&
    clearance <= PLANE.groundClearance + 1 &&
    ((flight.touchdownSpeed !== null && flight.touchdownSpeed < -0.5) ||
      (ground > 10 && flight.speed > 70))
  ) {
    flight.landingArmed = false;
    if (onStrip && Math.abs(normalizeAngle(flight.heading - strip.heading)) < 0.45 && flight.speed < 118) {
      const quality = landingQuality(flight, strip.heading);
      flight.onGround = true;
      flight.verticalSpeed = 0;
      flight.altitude = ground + PLANE.groundClearance;
      const points = quality.score > 0.75 ? SCORE.landingPerfect : quality.score > 0.5 ? SCORE.landingGood : SCORE.landingHard;
      const label = quality.score > 0.75 ? "Pendaratan sempurna" : quality.score > 0.5 ? "Pendaratan bagus" : "Pendaratan keras";
      awardLanding(game.sortie, points, label);
      if (game.mission.goalKind === "hops" && game.hopped === 0 && strip !== RUNWAY) {
        game.hopped = 1;
        game.message = `${label} di ${strip.name}! Sekarang ke ${game.mission.secondLanding.name}.`;
        game.messageTimer = 5;
        flight.onGround = false;
        flight.speed = 40;
        return;
      }
      const allDone = targetsPassedCount(game.targets) >= game.targets.length;
      const dropDone = game.mission.goalKind !== "drop" || game.parcelDropped;
      if (allDone && dropDone) {
        endSortie("landed", `${label} di ${strip.name}. ${game.mission.name} selesai — skor ${Math.round(game.sortie.score)}.`);
      } else {
        game.message = `${label}, tapi misi belum selesai — lepas landas lagi.`;
        game.messageTimer = 4;
        flight.onGround = false;
        flight.speed = 40;
      }
      return;
    }
    if (flight.speed > 150 || flight.verticalSpeed < -24 || (!onStrip && ground > 10 && flight.speed > 90)) {
      applyDamage(game.sortie, DAMAGE.terrainHit, "Pesawat menabrak tanah dengan keras.");
      endSortie("crash", "Pesawat jatuh. Surat-surat itu tidak sampai — coba lagi dengan throttle lebih tenang.");
      return;
    }
    applyDamage(game.sortie, DAMAGE.hardLanding, "Pendaratan keras di luar landasan.");
    flight.onGround = true;
    flight.verticalSpeed = 0;
    flight.altitude = ground + PLANE.groundClearance;
    if (game.sortie.damage >= DAMAGE.maxBeforeBreakup) {
      endSortie("crash", "Pesawat rusak berat setelah pendaratan darurat.");
    }
  }
  if (flight.onGround && flight.speed < 8 && game.mode === "flying" && game.sortie.elapsed > 20) {
    // Standing still on a strip after a completed hop counts as parked, not stuck.
  }
}

function updateFlying(dt, flightInput) {
  const flight = game.flight;
  // Staged play-test shots hold the stick forward so the real landing
  // and crash code resolves the staged approach in a few seconds.
  if (STAGED && (shotParams.shot === "land" || shotParams.shot === "crash")) {
    flightInput = { ...flightInput, pitchDown: true, pitchUp: false, throttleUp: shotParams.shot === "crash" };
  }
  const ground = sampleHeightGrid(grid, flight.x, flight.z);
  if (game.mission.weather === "storm") {
    game.wind.gust = Math.sin(game.time * 1.7) * 9 + Math.sin(game.time * 3.1) * 5;
    game.wind.x = game.mission.wind.x + game.wind.gust;
    if (Math.abs(game.wind.gust) > 10 && flight.airborne) {
      game.sortie.damage = Math.min(100, game.sortie.damage + DAMAGE.stormGust * dt * 0.4);
    }
  }
  flight.windX = game.wind.x;
  flight.windZ = game.wind.z;
  updateFlight(flight, flightInput, game.wind, dt, ground);
  burnFuel(game.sortie, flight.throttle, dt, flight.airborne);
  if (game.sortie.fuel <= 0 && flight.airborne) {
    flight.throttle = Math.max(0, flight.throttle - dt * 0.4);
    if (flight.speed < PLANE.stallSpeed) {
      endSortie("crash", "Bahan bakar habis di udara. Sriti meluncur turun dan jatuh.");
      return;
    }
  }
  tickSortie(game.sortie, flight, dt);
  checkRingPassing();
  checkDropZone(flightInput.drop);
  checkLandingAndCrash(dt);
  if (game.sortie.outcome === "crash" && game.mode === "flying") {
    endSortie("crash", game.sortie.outcomeDetail || "Pesawat jatuh.");
  }
  if (game.sortie.elapsed > 300 && game.mode === "flying") {
    endSortie("timeout", "Waktu sortie habis. Surat kembali ke kantor pos Laguna.");
  }
  if (game.messageTimer > 0) game.messageTimer -= dt;
}

function drawTitleScreen() {
  ctx.save();
  ctx.fillStyle = "rgba(8, 20, 36, 0.55)";
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 64px sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.fillText("SRITI AIR MAIL", VIEW.width / 2, 128);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#eaf4fa";
  ctx.font = "22px sans-serif";
  ctx.fillText("Tukang pos udara Kepulauan Layar — enam sortie, satu tas surat merah.", VIEW.width / 2, 168);
  ctx.fillStyle = "#f3e6c8";
  ctx.font = "17px sans-serif";
  ctx.fillText("Kompas kuningan di kokpit menunjuk utara. Tas surat merah sudah terikat. Terbanglah.", VIEW.width / 2, 196);
  game.missionButtons = [];
  const missions = [1, 2, 3, 4, 5, 6];
  missions.forEach((id, index) => {
    const mission = missionById(id);
    const y = 236 + index * 62;
    const selected = game.selectedMission === id;
    ctx.fillStyle = selected ? "rgba(255, 209, 102, 0.92)" : "rgba(8, 18, 30, 0.78)";
    ctx.beginPath();
    ctx.roundRect(VIEW.width / 2 - 330, y, 660, 50, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 209, 102, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = selected ? "#1d2a38" : "#eaf4fa";
    ctx.font = "bold 19px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${id}. ${mission.name}`, VIEW.width / 2 - 310, y + 31);
    ctx.textAlign = "right";
    ctx.font = "14px sans-serif";
    ctx.fillText(mission.weather.toUpperCase(), VIEW.width / 2 + 310, y + 30);
    ctx.textAlign = "center";
    game.missionButtons.push({ id, x: VIEW.width / 2 - 330, y, w: 660, h: 50 });
  });
  ctx.fillStyle = "#eaf4fa";
  ctx.font = "17px sans-serif";
  ctx.fillText("Klik sortie, atau tekan 1–6 lalu Enter.  W/S throttle  •  A/D belok  •  Panah atas/bawah hidung  •  Spasi kirim parsel  •  Mouse ikut mengemudi", VIEW.width / 2, 636);
  ctx.fillStyle = "rgba(234, 244, 250, 0.85)";
  ctx.font = "15px sans-serif";
  ctx.fillText("Tujuh sistem: ThrottleDiscipline, FuelManagement, DamageModel, WindGusts, RingGateScoring, LandingJudge, ScoreCombo.", VIEW.width / 2, 666);
  ctx.restore();
}

function drawEndScreen() {
  const sortie = game.sortie;
  ctx.save();
  ctx.fillStyle = "rgba(8, 20, 36, 0.62)";
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = "center";
  const outcome = sortie.outcome || "landed";
  ctx.fillStyle = outcome === "landed" ? "#aef2c8" : outcome === "crash" ? "#ff8c6b" : "#ffd166";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText(
    outcome === "landed" ? "PENDARATAN BERHASIL" : outcome === "crash" ? "PESAWAT JATUH" : "SORTIE SELESAI",
    VIEW.width / 2,
    190,
  );
  ctx.fillStyle = "#eaf4fa";
  ctx.font = "20px sans-serif";
  ctx.fillText(sortie.outcomeDetail, VIEW.width / 2, 232);
  ctx.font = "bold 30px sans-serif";
  ctx.fillText(`SKOR AKHIR  ${Math.round(sortie.score)}`, VIEW.width / 2, 300);
  ctx.font = "19px sans-serif";
  ctx.fillText(
    `Cincin/gerbang ${sortie.ringsHit}  •  Parsel ${sortie.dropsHit}  •  Pendaratan ${sortie.landings}  •  Waktu ${Math.floor(sortie.elapsed / 60)}:${String(Math.floor(sortie.elapsed % 60)).padStart(2, "0")}  •  Bahan bakar ${Math.round(sortie.fuel)}%  •  Kerusakan ${Math.round(sortie.damage)}%`,
    VIEW.width / 2,
    344,
  );
  ctx.fillText(`Sortie: ${game.mission.name}  •  Combo tertinggi x${sortie.combo.toFixed(1)}`, VIEW.width / 2, 376);
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("Tekan Enter atau klik untuk terbang lagi", VIEW.width / 2, 440);
  ctx.restore();
}

function drawMessageBanner() {
  if (game.messageTimer <= 0 || !game.message) return;
  ctx.save();
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 6;
  ctx.fillText(game.message, VIEW.width / 2, 152);
  ctx.restore();
}

function handleTitleInput() {
  for (let id = 1; id <= 6; id += 1) {
    if (consumePress(input, String(id))) game.selectedMission = id;
  }
  if (consumePress(input, "enter")) startMission(game.selectedMission);
  const click = consumeClick(input);
  if (click && game.missionButtons) {
    const px = click.x * VIEW.width;
    const py = click.y * VIEW.height;
    for (const button of game.missionButtons) {
      if (px >= button.x && px <= button.x + button.w && py >= button.y && py <= button.y + button.h) {
        startMission(button.id);
      }
    }
  }
}

function handleEndedInput() {
  if (consumePress(input, "enter")) {
    game.mode = "title";
    game.selectedMission = game.missionId;
  }
  if (consumeClick(input)) {
    game.mode = "title";
    game.selectedMission = game.missionId;
  }
}

let lastTime = 0;
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0.016);
  lastTime = timestamp;
  game.time += dt;

  if (game.mode === "title") {
    handleTitleInput();
    const attract = createFlightState(missionById(1).spawn);
    attract.x = 0;
    attract.z = 240 + Math.sin(game.time * 0.05) * 20;
    attract.altitude = 165;
    attract.heading = 0;
    attract.throttle = 0.64;
    const camera = {
      x: attract.x - Math.sin(attract.heading) * 34,
      z: attract.z - Math.cos(attract.heading) * 34,
      altitude: attract.altitude + 9,
      heading: attract.heading,
      pitchOffset: 0,
    };
    drawSkyAndTerrain(ctx, grid, camera, "dawn", game.time, game.targets.length ? game.targets : missionById(1).targets, missionById(1).targets[0]);
    drawAircraft(ctx, attract, VIEW.width, VIEW.height, game.time, "dawn");
    drawTitleScreen();
  } else if (game.mode === "flying") {
    const flightInput = readFlightInput(input);
    updateFlying(dt, flightInput);
    const flight = game.flight;
    const camera = {
      x: flight.x - Math.sin(flight.heading) * 34,
      z: flight.z - Math.cos(flight.heading) * 34,
      altitude: flight.altitude + 9,
      heading: flight.heading,
      pitchOffset: flight.pitch * 160,
    };
    const next = nextUnpassedTarget(game.targets);
    drawSkyAndTerrain(ctx, grid, camera, game.mission.weather, game.time, game.targets, next);
    drawAircraft(ctx, flight, VIEW.width, VIEW.height, game.time, game.mission.weather);
    drawHud(ctx, flight, game.sortie, game.mission, game.targets, VIEW.width, VIEW.height, game.mission.weather);
    drawMessageBanner();
    if (game.mode === "ended") drawEndScreen();
  } else {
    const flight = game.flight;
    const camera = {
      x: flight.x - Math.sin(flight.heading) * 34,
      z: flight.z - Math.cos(flight.heading) * 34,
      altitude: flight.altitude + 9,
      heading: flight.heading,
      pitchOffset: 0,
    };
    drawSkyAndTerrain(ctx, grid, camera, game.mission.weather, game.time, game.targets, null);
    drawAircraft(ctx, flight, VIEW.width, VIEW.height, game.time, game.mission.weather);
    drawHud(ctx, flight, game.sortie, game.mission, game.targets, VIEW.width, VIEW.height, game.mission.weather);
    drawEndScreen();
    handleEndedInput();
  }
  endFrameInput(input);
  requestAnimationFrame(frame);
}

if (STAGED) {
  const missionId = stagedMissionId(shotParams);
  startMission(missionId);
  if (stagedMode(shotParams) === "title") {
    game.mode = "title";
    game.selectedMission = missionId;
  }
} else {
  game.mode = "title";
  game.targets = freshTargets(missionById(1));
}

requestAnimationFrame(frame);
