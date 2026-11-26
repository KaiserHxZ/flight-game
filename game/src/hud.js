// The HUD: lit instruments the pilot reads at a glance. Altitude,
// speed, heading, fuel and time are large and always on screen; the
// throttle gauge shows the green discipline band, and the mission
// banner names the next objective. Panels glow amber and green like
// flown instruments, never like plain drawn boxes.
import { SCORE, FUEL } from "./config.js";
import { fuelState, damageState } from "./sortie.js";

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "rgba(8, 18, 30, 0.72)";
  ctx.strokeStyle = "rgba(255, 209, 102, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function litLabel(ctx, text, x, y, size, color) {
  ctx.save();
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function smallLabel(ctx, text, x, y) {
  ctx.save();
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(220, 235, 245, 0.85)";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawHud(ctx, flight, sortie, mission, targets, width, height, weather) {
  const headingDegrees = Math.round(((flight.heading * 180) / Math.PI % 360) + 360) % 360;
  const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(headingDegrees / 45) % 8];

  panel(ctx, 20, 18, 300, 132);
  smallLabel(ctx, "ALTITUDE", 38, 44);
  litLabel(ctx, `${Math.round(flight.altitude)} m`, 38, 82, 34, "#aef2c8");
  smallLabel(ctx, `VERT ${flight.verticalSpeed >= 0 ? "+" : ""}${Math.round(flight.verticalSpeed)} m/s`, 38, 108);
  smallLabel(ctx, flight.stalling ? "STALL — HIDUNG KE BAWAH" : flight.onGround ? "DI DARAT" : "TERBANG", 38, 132);

  panel(ctx, 20, 162, 300, 118);
  smallLabel(ctx, "SPEED", 38, 188);
  litLabel(ctx, `${Math.round(flight.speed)} kt`, 38, 226, 34, "#aef2c8");
  smallLabel(ctx, `THROTTLE ${Math.round(flight.throttle * 100)}%`, 190, 226);
  smallLabel(ctx, flight.speed < 52 && !flight.onGround ? "TERLALU PELAN" : "KECEPATAN AMAN", 38, 256);

  panel(ctx, width - 320, 18, 300, 132);
  smallLabel(ctx, "HEADING", width - 302, 44);
  litLabel(ctx, `${String(headingDegrees).padStart(3, "0")}° ${compass}`, width - 302, 82, 34, "#ffd166");
  smallLabel(ctx, `BANK ${Math.round((flight.bank * 180) / Math.PI)}°`, width - 302, 108);
  smallLabel(ctx, `ANGIN ${Math.round(Math.hypot(flight.windX, flight.windZ))} kt`, width - 302, 132);

  panel(ctx, width - 320, 162, 300, 118);
  smallLabel(ctx, "FUEL", width - 302, 188);
  const fuel = fuelState(sortie);
  litLabel(ctx, `${Math.round(sortie.fuel)}%`, width - 302, 226, 34, fuel === "ok" ? "#aef2c8" : "#ff8c6b");
  drawFuelBar(ctx, width - 302, 238, 264, 14, sortie.fuel);
  smallLabel(ctx, fuel === "empty" ? "TANGKI KOSONG" : fuel === "reserve" ? "CADANGAN — HEMATKAN" : "BAHAN BAKAR CUKUP", width - 302, 268);

  panel(ctx, width / 2 - 210, 18, 420, 62);
  ctx.save();
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#eaf4fa";
  ctx.fillText(mission.name.toUpperCase(), width / 2, 44);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "rgba(220, 235, 245, 0.85)";
  ctx.fillText(mission.goal, width / 2, 64);
  ctx.restore();

  panel(ctx, 20, height - 88, 250, 68);
  smallLabel(ctx, "TIME", 38, height - 66);
  const minutes = Math.floor(sortie.elapsed / 60);
  const seconds = Math.floor(sortie.elapsed % 60);
  litLabel(ctx, `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`, 38, height - 30, 26, "#eaf4fa");
  smallLabel(ctx, `SCORE ${Math.round(sortie.score)}`, 150, height - 30);

  panel(ctx, width - 270, height - 88, 250, 68);
  smallLabel(ctx, "COMBO", width - 252, height - 66);
  litLabel(ctx, `x${sortie.combo.toFixed(1)}`, width - 252, height - 30, 26, sortie.combo > 1 ? "#ffd166" : "#eaf4fa");
  smallLabel(ctx, `RING ${sortie.ringsHit} • RUSAK ${Math.round(sortie.damage)}%`, width - 150, height - 30);

  drawThrottleGauge(ctx, flight, width, height);
  drawDamageWarning(ctx, sortie, width, height);
  drawNextObjective(ctx, targets, width, height);
  if (weather === "storm") drawStormBanner(ctx, width);
}

function drawFuelBar(ctx, x, y, w, h, fuel) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fuel > 25 ? "#5ecf8a" : "#ff6b4a";
  ctx.fillRect(x, y, Math.max(0, (w * fuel) / 100), h);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawThrottleGauge(ctx, flight, width, height) {
  const x = width / 2 - 190;
  const y = height - 88;
  const w = 380;
  panel(ctx, x, y, w, 68);
  smallLabel(ctx, "THROTTLE — ZONA HIJAU = HEMAT + SKOR", x + 18, y + 22);
  const barX = x + 18;
  const barY = y + 32;
  const barW = w - 36;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(barX, barY, barW, 18);
  ctx.fillStyle = "rgba(94, 207, 138, 0.5)";
  ctx.fillRect(barX + barW * SCORE.disciplineBandLow, barY, barW * (SCORE.disciplineBandHigh - SCORE.disciplineBandLow), 18);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(barX + barW * flight.throttle - 3, barY - 5, 6, 28);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.strokeRect(barX, barY, barW, 18);
  ctx.restore();
  
  ctx.save();
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#eaf4fa";
  ctx.fillText(`${Math.round(flight.throttle * 100)}%`, x + w - 18, y + 58);
  ctx.restore();
}

function drawDamageWarning(ctx, sortie, width, height) {
  const state = damageState(sortie);
  if (state === "clean" || state === "light") return;
  ctx.save();
  const blink = Math.sin(Date.now() / 180) > 0;
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = blink ? "#ff6b4a" : "#ffd166";
  ctx.shadowColor = "#ff6b4a";
  ctx.shadowBlur = 12;
  ctx.fillText(
    state === "critical" ? "⚠ KERUSAKAN KRITIS — MENDARAT SEKARANG" : "⚠ PESAWAT RUSAK — HATI-HATI",
    width / 2,
    height - 104,
  );
  ctx.restore();
}

function drawNextObjective(ctx, targets, width, height) {
  const next = targets.find((target) => !target.passed);
  const done = targets.filter((target) => target.passed).length;
  ctx.save();
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;
  const text = next ? `TARGET BERIKUTNYA: ${next.label.toUpperCase()}  (${done}/${targets.length})` : `SEMUA TARGET SELESAI — MENDARATLAH  (${done}/${targets.length})`;
  ctx.fillText(text, width / 2, 104);
  ctx.restore();
}

function drawStormBanner(ctx, width) {
  ctx.save();
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd166";
  ctx.fillText("BADAI — ANGIN KENCANG MENDORONG PESAWAT", width / 2, 128);
  ctx.restore();
}

export function describeHud() {
  return "ALTITUDE, SPEED, HEADING, FUEL and TIME instruments, throttle discipline gauge, score and combo.";
}
