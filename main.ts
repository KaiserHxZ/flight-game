// Entry program for the Sriti Air Mail flight game. Copies game/ and
// screenshots/ from this repository to the output directory and writes
// dossier.json with buildDossier from the kit's vendor library. Runs
// twice with identical bytes: copying is deterministic and the dossier
// is built only from the repository's own files.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier, DOSSIER_MAX_BYTES, DOSSIER_MAX_IMAGES } from "./vendor/makefun-game.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outputDir, { recursive: true });
cpSync(join(root, "game"), join(outputDir, "game"), { recursive: true });
cpSync(join(root, "screenshots"), join(outputDir, "screenshots"), { recursive: true });

const dossier = await buildDossier(root, {
  text_max_bytes: 163840,
  screenshots: { max: DOSSIER_MAX_IMAGES, max_bytes: DOSSIER_MAX_BYTES },
});
writeFileSync(join(outputDir, "dossier.json"), Buffer.from(dossier));
