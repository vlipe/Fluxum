// scripts/refine-channel.js
import fs from "fs";
import * as turf from "@turf/turf";

function refineChannelLine(lineFeature) {
  // 1) Densificar pontos ao longo da linha a cada ~50 m
  const lengthKm = turf.length(lineFeature, { units: "kilometers" });
  const stepKm = 0.05; // 50 m
  const coords = [];
  for (let d = 0; d <= lengthKm; d += stepKm) {
    const p = turf.along(lineFeature, d, { units: "kilometers" });
    coords.push(p.geometry.coordinates);
  }
  const densified = turf.lineString(coords, lineFeature.properties || {});

  // 2) Suavizar (cautela p/ não “invadir” margens)
  const smooth = turf.bezierSpline(densified, { resolution: 10000, sharpness: 0.7 });

  // Mantém propriedades e nome
  smooth.properties = { ...(lineFeature.properties || {}), refined: true };
  return smooth;
}

const inPath  = "data/corridors/santos_canal.geojson";
const outPath = "data/corridors/santos_canal_refined.geojson";

const raw = JSON.parse(fs.readFileSync(inPath, "utf8"));
const feature = raw.type === "Feature" ? raw
               : raw.type === "FeatureCollection" ? raw.features[0]
               : null;

if (!feature || feature.geometry?.type !== "LineString") {
  console.error("GeoJSON inválido: espere 1 Feature LineString.");
  process.exit(1);
}

const refined = refineChannelLine(feature);
fs.writeFileSync(outPath, JSON.stringify(refined, null, 2));
console.log("Canal refinado salvo em:", outPath);
