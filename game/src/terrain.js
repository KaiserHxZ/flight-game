// Terrain of Kepulauan Layar: a deterministic heightfield, the lagoon
// runway, island airstrips, the lighthouse and the villages the mail
// plane serves. Every height comes from fixed numbers in this file, so
// two runs over the same world draw the same coast, islands and peaks.
import { WORLD } from "./config.js";

export const ISLANDS = [
  { name: "Pulau Sriti", x: 0, z: 1250, radius: 540, peak: 115 },
  { name: "Pulau Lentera", x: -980, z: 2100, radius: 430, peak: 210 },
  { name: "Pulau Bakau", x: 1050, z: 2400, radius: 520, peak: 90 },
  { name: "Pulau Batu Karang", x: -420, z: 3600, radius: 700, peak: 330 },
  { name: "Pulau Senja", x: 900, z: 4300, radius: 560, peak: 180 },
  { name: "Pulau Kabut", x: -1250, z: 4900, radius: 480, peak: 260 },
];

export const RUNWAY = {
  name: "Lapangan Terbang Laguna",
  x: 0,
  z: 520,
  heading: 0,
  length: 260,
  width: 30,
  height: 4,
};

export const AIRSTRIPS = [
  { name: "Landasan Bakau", x: 1050, z: 2400, heading: 0.35, length: 170, width: 22, height: 26 },
  { name: "Landasan Senja", x: 900, z: 4300, heading: -0.3, length: 170, width: 22, height: 30 },
];

export const LIGHTHOUSE = { x: -980, z: 2100, height: 250 };
export const VILLAGES = [
  { name: "Kampung Nelayan", x: 210, z: 980 },
  { name: "Kampung Bakau", x: 980, z: 2560 },
  { name: "Kampung Senja", x: 830, z: 4440 },
];
export const DROP_ZONE = { name: "Mercusuar Lentera", x: -980, z: 2100, radius: 90 };

function islandBump(x, z, island) {
  const dx = x - island.x;
  const dz = z - island.z;
  const d = Math.sqrt(dx * dx + dz * dz) / island.radius;
  if (d >= 1) return 0;
  const falloff = Math.pow(1 - d * d, 2);
  const ridge = 0.55 + 0.45 * Math.sin(d * 9.1 + island.x * 0.01);
  return island.peak * falloff * ridge;
}

function rollingHills(x, z) {
  return (
    14 * Math.sin(x * 0.004 + 1.7) * Math.cos(z * 0.0035 + 0.4) +
    9 * Math.sin(x * 0.011 - z * 0.007) +
    6 * Math.sin(z * 0.017 + 2.2)
  );
}

export function terrainHeightAt(x, z) {
  let h = -6;
  for (const island of ISLANDS) h += islandBump(x, z, island);
  if (h > 2) h += Math.max(0, rollingHills(x, z)) * 0.35;
  h -= canyonCarve(x, z);
  h = lagoonPadBlend(h, x, z);
  const flat = flattenNearStrip(x, z, RUNWAY);
  if (flat !== null) return flat;
  for (const strip of AIRSTRIPS) {
    const f = flattenNearStrip(x, z, strip);
    if (f !== null) return f;
  }
  return h;
}

// A carved valley through Pulau Batu Karang so the canyon gates fly
// between rock walls instead of through a mountainside.
function canyonCarve(x, z) {
  if (z < 2950 || z > 4850) return 0;
  const distance = Math.abs(x + 420);
  if (distance > 130) return 0;
  const along = Math.min(1, Math.min(z - 2950, 4850 - z) / 250);
  const across = 1 - distance / 130;
  return 150 * along * across * across;
}

// A flat sandy apron around the lagoon runway so the strip sits in
// open ground with the sea behind it, not in a pit on a hillside.
function lagoonPadBlend(h, x, z) {
  const d = Math.hypot(x - RUNWAY.x, z - RUNWAY.z);
  if (d > 300) return h;
  const t = 1 - d / 300;
  return h * (1 - t * 0.85) + 3 * t * 0.85;
}

function flattenNearStrip(x, z, strip) {
  const dx = x - strip.x;
  const dz = z - strip.z;
  const along = dx * Math.sin(strip.heading) + dz * Math.cos(strip.heading);
  const across = dx * Math.cos(strip.heading) - dz * Math.sin(strip.heading);
  if (Math.abs(along) < strip.length / 2 + 26 && Math.abs(across) < strip.width / 2 + 20) {
    return strip.height;
  }
  return null;
}

export function buildHeightGrid() {
  const n = WORLD.gridCells;
  const grid = new Float32Array(n * n);
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const x = WORLD.gridMinX + i * WORLD.cellSize;
      const z = WORLD.gridMinZ + j * WORLD.cellSize;
      grid[j * n + i] = terrainHeightAt(x, z);
    }
  }
  return grid;
}

export function sampleHeightGrid(grid, x, z) {
  const fx = (x - WORLD.gridMinX) / WORLD.cellSize;
  const fz = (z - WORLD.gridMinZ) / WORLD.cellSize;
  const i = Math.max(0, Math.min(WORLD.gridCells - 2, Math.floor(fx)));
  const j = Math.max(0, Math.min(WORLD.gridCells - 2, Math.floor(fz)));
  const tx = fx - i;
  const tz = fz - j;
  const n = WORLD.gridCells;
  const a = grid[j * n + i];
  const b = grid[j * n + i + 1];
  const c = grid[(j + 1) * n + i];
  const d = grid[(j + 1) * n + i + 1];
  return a * (1 - tx) * (1 - tz) + b * tx * (1 - tz) + c * (1 - tx) * tz + d * tx * tz;
}

export function terrainColorFor(height, slope) {
  if (height <= 1.5) return height < -2 ? "#1d5f8a" : "#3f9db8";
  if (height <= 7) return "#e3cf96";
  if (height <= 60) return slope > 0.55 ? "#4a7d3e" : "#5d9b4a";
  if (height <= 130) return slope > 0.6 ? "#6f7a5e" : "#3c7a38";
  if (height <= 230) return "#8a7f74";
  return "#eef3f6";
}

// Project a world point into screen space from a chase camera.
// Returns null when the point is behind the camera.
export function projectPoint(point, camera, focal, centerX, horizonY) {
  const dx = point.x - camera.x;
  const dz = point.z - camera.z;
  const cos = Math.cos(-camera.heading);
  const sin = Math.sin(-camera.heading);
  const forward = dx * sin + dz * cos;
  const right = dx * cos - dz * sin;
  if (forward < 8) return null;
  const scale = focal / forward;
  return {
    x: centerX + right * scale,
    y: horizonY + (camera.altitude - point.y) * scale,
    scale,
    depth: forward,
  };
}

export function describeTerrain() {
  return {
    islands: ISLANDS.map((island) => island.name),
    runway: RUNWAY.name,
    strips: AIRSTRIPS.map((strip) => strip.name),
    lighthouse: LIGHTHOUSE,
  };
}
