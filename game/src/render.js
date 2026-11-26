// World rendering: sky, sun and clouds, the voxel-terrain sea and
// islands, the lagoon runway, rings and gates, the lighthouse and the
// villages. The camera sits behind the plane; the ground is drawn in
// depth strips so coast, islands and mountains read at a glance.
import { VIEW, COLORS } from "./config.js";
import {
  sampleHeightGrid,
  terrainColorFor,
  projectPoint,
  RUNWAY,
  AIRSTRIPS,
  LIGHTHOUSE,
  VILLAGES,
} from "./terrain.js";

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export const CLOUDS = (() => {
  const rand = seededRandom(20261126);
  const clouds = [];
  for (let i = 0; i < 42; i += 1) {
    clouds.push({
      x: (rand() - 0.5) * 4400,
      z: rand() * 5600,
      y: 420 + rand() * 280,
      size: 60 + rand() * 80,
    });
  }
  return clouds;
})();

function skyGradient(ctx, weather, width, height, horizonY) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (weather === "night") {
    gradient.addColorStop(0, COLORS.skyTopNight);
    gradient.addColorStop(0.62, COLORS.skyBottomNight);
  } else if (weather === "dusk") {
    gradient.addColorStop(0, COLORS.skyTopDusk);
    gradient.addColorStop(0.62, COLORS.skyBottomDusk);
  } else if (weather === "storm") {
    gradient.addColorStop(0, "#4a5568");
    gradient.addColorStop(0.62, "#8b98a8");
  } else {
    gradient.addColorStop(0, COLORS.skyTopDay);
    gradient.addColorStop(0.62, COLORS.skyBottomDay);
  }
  gradient.addColorStop(0.62, "#cfe8f2");
  gradient.addColorStop(1, "#cfe8f2");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  return horizonY;
}

function drawSunOrMoon(ctx, weather, width, horizonY, heading, time) {
  const sunAngle = heading + 0.9;
  const sx = width / 2 + Math.sin(sunAngle) * width * 0.34;
  const sy = horizonY - 170 - Math.sin(time * 0.05) * 8;
  ctx.save();
  if (weather === "night") {
    ctx.fillStyle = "#f4f1de";
    ctx.beginPath();
    ctx.arc(sx, sy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8d4b8";
    ctx.beginPath();
    ctx.arc(sx - 10, sy - 6, 7, 0, Math.PI * 2);
    ctx.arc(sx + 12, sy + 10, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
    glow.addColorStop(0, "rgba(255, 236, 170, 0.95)");
    glow.addColorStop(1, "rgba(255, 236, 170, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(sx, sy, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloud(ctx, cloud, camera, weather) {
  const projected = projectPoint(cloud, camera, VIEW.focal, VIEW.width / 2, VIEW.horizonRest);
  if (!projected) return;
  const size = cloud.size * projected.scale;
  if (size < 4 || size > 900) return;
  ctx.save();
  ctx.globalAlpha = weather === "storm" ? 0.7 : 0.55;
  ctx.fillStyle = weather === "night" ? "#5a6d94" : weather === "storm" ? "#5c6675" : "#ffffff";
  for (const offset of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(projected.x + offset * size, projected.y, size * 0.55, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawTerrainStrips(ctx, grid, camera, weather) {
  const width = VIEW.width;
  const height = VIEW.height;
  const horizonY = VIEW.horizonRest + camera.pitchOffset;
  const night = weather === "night";
  const depths = [];
  for (let i = 0; i < VIEW.depthSteps; i += 1) {
    const t = i / (VIEW.depthSteps - 1);
    depths.push(VIEW.nearDepth * Math.pow(VIEW.farDepth / VIEW.nearDepth, t));
  }
  const columns = Math.ceil(width / VIEW.columnStep);
  const ceiling = new Float32Array(columns).fill(height);
  const sinH = Math.sin(camera.heading);
  const cosH = Math.cos(camera.heading);
  // Near to far: each farther strip fills only the band of screen that
  // nearer ground has not already covered, so hills occlude the sea
  // behind them and the coast stays readable.
  for (let d = 0; d < depths.length; d += 1) {
    const depth = depths[d];
    const scale = VIEW.focal / depth;
    for (let c = 0; c < columns; c += 1) {
      const screenX = c * VIEW.columnStep;
      const right = (screenX - width / 2) / scale;
      const worldX = camera.x + right * cosH + depth * sinH;
      const worldZ = camera.z - right * sinH + depth * cosH;
      const ground = sampleHeightGrid(grid, worldX, worldZ);
      const groundY = horizonY + (camera.altitude - ground) * scale;
      const y0 = Math.floor(groundY);
      const y1 = Math.floor(ceiling[c]);
      if (y0 >= y1 || y0 >= height) continue;
      const slope = Math.abs(sampleHeightGrid(grid, worldX + 24, worldZ) - ground) / 24;
      let color = terrainColorFor(ground, slope);
      if (night) color = shadeNight(color);
      if (weather === "storm") color = shadeStorm(color);
      ctx.fillStyle = color;
      ctx.fillRect(screenX, Math.max(0, y0), VIEW.columnStep, y1 - Math.max(0, y0));
      ceiling[c] = Math.min(ceiling[c], groundY);
    }
  }
  return horizonY;
}

function shadeNight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (v) => Math.round(v * 0.42 + 18);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function shadeStorm(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (v) => Math.round(v * 0.72 + 12);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function drawStripPolygon(ctx, strip, camera, horizonY, weather) {
  const half = strip.width / 2;
  const len = strip.length / 2;
  const corners = [
    { x: strip.x - half, z: strip.z - len, y: strip.height },
    { x: strip.x + half, z: strip.z - len, y: strip.height },
    { x: strip.x + half, z: strip.z + len, y: strip.height },
    { x: strip.x - half, z: strip.z + len, y: strip.height },
  ];
  const projected = corners.map((corner) =>
    projectPoint(corner, camera, VIEW.focal, VIEW.width / 2, horizonY),
  );
  if (projected.some((p) => p === null)) return;
  ctx.save();
  ctx.fillStyle = weather === "night" ? "#2c313a" : COLORS.runway;
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  for (let i = 1; i < 4; i += 1) ctx.lineTo(projected[i].x, projected[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = weather === "night" ? "#ffd166" : COLORS.runwayLine;
  ctx.lineWidth = 2;
  ctx.stroke();
  const centerA = projectPoint(
    { x: strip.x, z: strip.z - len * 0.8, y: strip.height + 0.5 },
    camera, VIEW.focal, VIEW.width / 2, horizonY,
  );
  const centerB = projectPoint(
    { x: strip.x, z: strip.z + len * 0.8, y: strip.height + 0.5 },
    camera, VIEW.focal, VIEW.width / 2, horizonY,
  );
  if (centerA && centerB) {
    ctx.setLineDash([14, 12]);
    ctx.strokeStyle = COLORS.runwayLine;
    ctx.beginPath();
    ctx.moveTo(centerA.x, centerA.y);
    ctx.lineTo(centerB.x, centerB.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawBillboard(ctx, point, camera, horizonY, draw, minScale) {
  const projected = projectPoint(point, camera, VIEW.focal, VIEW.width / 2, horizonY);
  if (!projected) return;
  if (projected.scale < minScale) return;
  draw(projected);
}

export function drawWorldObjects(ctx, camera, horizonY, weather, nextTarget) {
  drawStripPolygon(ctx, RUNWAY, camera, horizonY, weather);
  for (const strip of AIRSTRIPS) drawStripPolygon(ctx, strip, camera, horizonY, weather);

  drawBillboard(ctx, { x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, y: LIGHTHOUSE.height }, camera, horizonY, (p) => {
    const h = 90 * p.scale;
    const w = 22 * p.scale;
    ctx.save();
    ctx.fillStyle = "#f2ede0";
    ctx.fillRect(p.x - w / 2, p.y - h, w, h);
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(p.x - w / 2, p.y - h * 0.72, w, h * 0.2);
    ctx.fillRect(p.x - w / 2, p.y - h * 0.34, w, h * 0.2);
    ctx.fillStyle = "#2b2b2b";
    ctx.beginPath();
    ctx.moveTo(p.x - w * 0.7, p.y - h);
    ctx.lineTo(p.x, p.y - h - 18 * p.scale);
    ctx.lineTo(p.x + w * 0.7, p.y - h);
    ctx.closePath();
    ctx.fill();
    if (weather === "night" || weather === "dusk") {
      const glow = ctx.createRadialGradient(p.x, p.y - h, 2, p.x, p.y - h, 60 * p.scale + 20);
      glow.addColorStop(0, "rgba(255, 209, 102, 0.9)");
      glow.addColorStop(1, "rgba(255, 209, 102, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y - h, 60 * p.scale + 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, 0.02);

  for (const village of VILLAGES) {
    drawBillboard(ctx, { x: village.x, z: village.z, y: 30 }, camera, horizonY, (p) => {
      const s = p.scale;
      ctx.save();
      for (let i = -1; i <= 1; i += 1) {
        const hx = p.x + i * 26 * s;
        ctx.fillStyle = "#e8dcc0";
        ctx.fillRect(hx - 9 * s, p.y - 14 * s, 18 * s, 14 * s);
        ctx.fillStyle = "#a34a2e";
        ctx.beginPath();
        ctx.moveTo(hx - 11 * s, p.y - 14 * s);
        ctx.lineTo(hx, p.y - 26 * s);
        ctx.lineTo(hx + 11 * s, p.y - 14 * s);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }, 0.03);
  }
}

export function drawTargetRing(ctx, target, camera, horizonY, isNext, weather) {
  const projected = projectPoint(
    { x: target.x, z: target.z, y: target.y },
    camera, VIEW.focal, VIEW.width / 2, horizonY,
  );
  if (!projected) return;
  const radius = target.radius * projected.scale;
  if (radius < 3 || radius > 1200) return;
  ctx.save();
  const verticalSquash = 0.72;
  ctx.beginPath();
  ctx.ellipse(projected.x, projected.y, radius, radius * verticalSquash, 0, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(3, 7 * projected.scale + 2);
  if (target.passed) {
    ctx.strokeStyle = "rgba(120, 220, 140, 0.75)";
  } else if (isNext) {
    ctx.strokeStyle = weather === "night" ? "#ffd166" : "#ff8c42";
    ctx.shadowColor = "#ff8c42";
    ctx.shadowBlur = 18;
  } else {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(projected.x, projected.y, radius * 0.55, radius * verticalSquash * 0.55, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  if (isNext) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(14, Math.min(26, 20 * projected.scale + 10))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 8;
    const aboveY = projected.y - radius * verticalSquash - 34;
    const labelY = aboveY < 130 ? projected.y + radius * verticalSquash + 30 : aboveY;
    ctx.fillText(target.label.toUpperCase(), projected.x, labelY);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

export function drawSkyAndTerrain(ctx, grid, camera, weather, time, targets, nextTarget) {
  const horizonY = skyGradient(ctx, weather, VIEW.width, VIEW.height, VIEW.horizonRest + camera.pitchOffset);
  drawSunOrMoon(ctx, weather, VIEW.width, horizonY, camera.heading, time);
  for (const cloud of CLOUDS) drawCloud(ctx, cloud, camera, weather);
  const groundHorizon = drawTerrainStrips(ctx, grid, camera, weather);
  drawWorldObjects(ctx, camera, groundHorizon, weather, nextTarget);
  for (const target of targets) {
    drawTargetRing(ctx, target, camera, groundHorizon, target === nextTarget, weather);
  }
  return groundHorizon;
}
