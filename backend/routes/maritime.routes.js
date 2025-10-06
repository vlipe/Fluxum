const express = require("express");
const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

const router = express.Router();

// Cache simples para seaPoints (chave: bbox-string, valor: {points, timestamp})
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5min

// Caminho do arquivo GeoJSON de terra
const landPath = path.resolve("data/ne_10m_land.geojson");
if (!fs.existsSync(landPath)) {
  console.error("❌ Arquivo de terra não encontrado:", landPath);
  process.exit(1);
}

// Pré-carrega a camada de terra e cria buffer de segurança
const BUFFER_DISTANCE = 3; // km; rotas ficam pelo menos essa distância da costa
const landData = JSON.parse(fs.readFileSync(landPath));
const landBuffer = turf.buffer(landData, BUFFER_DISTANCE, { units: "kilometers" });

console.log(`🗺️ Buffer de terra aplicado: ${BUFFER_DISTANCE}km usando ne_10m_land.geojson.`);

// Função auxiliar: verifica se ponto está sobre terra
function isOnLand(point) {
  return landBuffer.features.some((poly) =>
    turf.booleanPointInPolygon(point, poly)
  );
}

// Função auxiliar: verifica se linha cruza terra
function crossesLand(line) {
  return turf.booleanIntersects(line, landBuffer);
}

// Cache para seaPoints
function getSeaPoints(bboxKey, bbox) {
  const cached = cache.get(bboxKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Cache hit para bbox ${bboxKey.slice(0, 20)}...`);
    return cached.points;
  }
  // Gera nova grid (adaptativa)
  const GRID_RES = bbox[3] - bbox[1] > 20 || bbox[2] - bbox[0] > 20 ? 2.0 : 0.5; // Adaptativa: grossa para bbox grande
  const seaPoints = [];
  for (let lat = Math.ceil(bbox[1] / GRID_RES) * GRID_RES; lat <= Math.floor(bbox[3] / GRID_RES) * GRID_RES; lat += GRID_RES) {
    for (let lng = Math.ceil(bbox[0] / GRID_RES) * GRID_RES; lng <= Math.floor(bbox[2] / GRID_RES) * GRID_RES; lng += GRID_RES) {
      const pt = turf.point([lng, lat]);
      if (!isOnLand(pt)) seaPoints.push(pt);
    }
  }
  cache.set(bboxKey, { points: seaPoints, timestamp: Date.now() });
  console.log(`🌊 Gerados ${seaPoints.length} pontos marítimos (GRID_RES=${GRID_RES}°); cache set.`);
  return seaPoints;
}

// Priority Queue (inalterada, eficiente)
class PriorityQueue {
  constructor() {
    this._heap = [];
  }
  push(item, priority) {
    this._heap.push({ item, priority });
    this._heapifyUp();
  }
  pop() {
    if (this._heap.length === 0) return null;
    const root = this._heap[0];
    const end = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = end;
      this._heapifyDown();
    }
    return root;
  }
  size() {
    return this._heap.length;
  }
  _heapifyUp() {
    let index = this._heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this._heap[parentIndex].priority <= this._heap[index].priority) break;
      [this._heap[parentIndex], this._heap[index]] = [this._heap[index], this._heap[parentIndex]];
      index = parentIndex;
    }
  }
  _heapifyDown() {
    let index = 0;
    const length = this._heap.length;
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let smallest = index;
      if (left < length && this._heap[left].priority < this._heap[smallest].priority) smallest = left;
      if (right < length && this._heap[right].priority < this._heap[smallest].priority) smallest = right;
      if (smallest === index) break;
      [this._heap[index], this._heap[smallest]] = [this._heap[smallest], this._heap[index]];
      index = smallest;
    }
  }
}

// A* otimizado (só para bbox pequena; com timeout interno)
function aStar(seaPoints, startNode, endNode) {
  const openSet = new PriorityQueue();
  openSet.push(startNode, 0);
  const cameFrom = new Map();
  const gScore = new Map([[startNode, 0]]);
  const fScore = new Map([[startNode, turf.distance(startNode.geometry.coordinates, endNode.geometry.coordinates, { units: "kilometers" })]]);
  const visited = new Set();
  const startTime = Date.now();
  let iterations = 0;
  const maxIterations = seaPoints.length * 5; // Reduzido para mais velocidade

  const NEIGHBOR_RADIUS = 100; // km
  function getNeighbors(node) {
    // Filtro rápido por distância euclidiana aproximada (sem turf.distance full)
    const nodeCoords = node.geometry.coordinates;
    return seaPoints.filter(pt => {
      const dx = (pt.geometry.coordinates[0] - nodeCoords[0]) * 111; // ~km por ° lng
      const dy = (pt.geometry.coordinates[1] - nodeCoords[1]) * 111; // ~km por ° lat
      const approxDist = Math.sqrt(dx * dx + dy * dy);
      if (approxDist > NEIGHBOR_RADIUS || approxDist === 0) return false;
      const exactDist = turf.distance(node, pt);
      if (exactDist > NEIGHBOR_RADIUS) return false;
      const line = turf.lineString([node.geometry.coordinates, pt.geometry.coordinates]);
      return !crossesLand(line);
    });
  }

  while (openSet.size() > 0) {
    iterations++;
    if (iterations > maxIterations || Date.now() - startTime > 2000) { // Timeout 2s para A*
      return null;
    }

    const { item: current } = openSet.pop();
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endNode) {
      const path = [];
      let curr = endNode;
      while (curr) {
        path.unshift(curr);
        curr = cameFrom.get(curr);
      }
      console.log(`✅ A* sucesso: ${path.length} nós em ${Date.now() - startTime}ms.`);
      return path;
    }

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const tentativeG = (gScore.get(current) || Infinity) + turf.distance(current.geometry.coordinates, neighbor.geometry.coordinates, { units: "kilometers" });
      if (tentativeG < (gScore.get(neighbor) || Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + turf.distance(neighbor.geometry.coordinates, endNode.geometry.coordinates, { units: "kilometers" }));
        openSet.push(neighbor, fScore.get(neighbor));
      }
    }
  }
  return null;
}

// Heurística avançada (expandida para 100% cobertura sem A*)
function advancedHeuristic(start, end) {
  const startTime = Date.now();
  const originalBearing = turf.bearing(start, end);
  console.log(`🔄 Heurística avançada: Bearing original ${originalBearing.toFixed(1)}°.`);

  // 1. Bearings expandidos (±0 a ±45° em passos de 5°)
  const bearingOffsets = [];
  for (let i = -45; i <= 45; i += 5) bearingOffsets.push(i);
  for (const offset of bearingOffsets) {
    const adjustedBearing = (originalBearing + offset + 360) % 360;
    const gc = turf.greatCircle(start, end, { bearing: adjustedBearing, npoints: 128 });
    if (!crossesLand(gc)) {
      console.log(`✅ Heurística: Bearing ${adjustedBearing.toFixed(1)}° (${offset}°) seguro em ${Date.now() - startTime}ms.`);
      return gc;
    }
  }

  // 2. Desvios em múltiplos pontos (1/3 e 2/3 do caminho) para curvas complexas
  console.log("🔄 Tentando desvios multi-pontos...");
  const line = turf.lineString([start.geometry.coordinates, end.geometry.coordinates]);
  const totalLength = turf.length(line, { units: "kilometers" });
  const p1 = turf.along(line, totalLength / 3);
  const p2 = turf.along(line, totalLength * 2 / 3);
  const perpBearings = [(originalBearing + 90) % 360, (originalBearing - 90 + 360) % 360];
  const distances = [10, 20, 30, 50]; // km

  for (const dist of distances) {
    for (const perp of perpBearings) {
      // Desvio em p1
      const offset1 = turf.destination(p1, dist, perp, { units: "kilometers" });
      const curved1 = turf.bezierSpline(turf.lineString([start.geometry.coordinates, offset1.geometry.coordinates, p2.geometry.coordinates, end.geometry.coordinates]), { resolution: 128 });
      if (!crossesLand(curved1)) {
        console.log(`✅ Heurística multi: Desvio em 1/3 (${dist}km, ${perp.toFixed(1)}°) seguro em ${Date.now() - startTime}ms.`);
        return curved1;
      }

      // Desvio em p2
      const offset2 = turf.destination(p2, dist, perp, { units: "kilometers" });
      const curved2 = turf.bezierSpline(turf.lineString([start.geometry.coordinates, p1.geometry.coordinates, offset2.geometry.coordinates, end.geometry.coordinates]), { resolution: 128 });
      if (!crossesLand(curved2)) {
        console.log(`✅ Heurística multi: Desvio em 2/3 (${dist}km, ${perp.toFixed(1)}°) seguro em ${Date.now() - startTime}ms.`);
        return curved2;
      }
    }
  }

  console.log(`⚠️ Heurística falhou após ${Date.now() - startTime}ms; erro (rota impossível?).`);
  throw new Error("Nenhuma rota marítima segura encontrada. Tente pontos mais afastados da terra.");
}

// Gera rota segura (híbrida para 100% eficiência)
function computeSafeRoute(start, end) {
  const startTime = Date.now();
  console.log(`🔍 Iniciando rota de [${start.geometry.coordinates.join(',')}] para [${end.geometry.coordinates.join(',')}] usando ne_10m_land.geojson.`);

  // Passo 1: Teste great-circle direto (rápido, 100% se passa)
  const gcDirect = turf.greatCircle(start, end, { npoints: 128 });
  if (!crossesLand(gcDirect)) {
    console.log(`✅ Direto (great-circle) seguro em ${Date.now() - startTime}ms.`);
    return gcDirect;
  }

  // Passo 2: Heurística avançada (para maioria dos casos)
  try {
    const heuristicRoute = advancedHeuristic(start, end);
    if (!crossesLand(heuristicRoute)) {
      console.log(`✅ Heurística usada (total: ${Date.now() - startTime}ms).`);
      return heuristicRoute;
    }
  } catch (err) {
    console.warn("⚠️ Heurística errou:", err.message);
  }

  // Passo 3: A* só se bbox pequena (complexa, mas rápida)
  const bboxStart = turf.bbox(start);
  const bboxEnd = turf.bbox(end);
  const bboxWidth = Math.max(bboxEnd[2] - bboxEnd[0], bboxStart[2] - bboxStart[0]);
  const bboxHeight = Math.max(bboxEnd[3] - bboxEnd[1], bboxStart[3] - bboxStart[1]);
  if (bboxWidth > 20 || bboxHeight > 20) {
    console.log(`⚠️ Bbox grande (${bboxWidth.toFixed(1)}° x ${bboxHeight.toFixed(1)}°); heurística suficiente, sem A*.`);
    throw new Error("Rota muito longa para evasão perfeita; use heurística ou ajuste pontos.");
  }

  console.log("🔄 Ativando A* para bbox complexa...");
  const minLng = Math.min(bboxStart[0], bboxEnd[0]) - 2;
  const maxLng = Math.max(bboxStart[2], bboxEnd[2]) + 2;
  const minLat = Math.min(bboxStart[1], bboxEnd[1]) - 2;
  const maxLat = Math.max(bboxStart[3], bboxEnd[3]) + 2;
  const bbox = [minLng, minLat, maxLng, maxLat];
  const bboxKey = bbox.join(',');
  let seaPoints = getSeaPoints(bboxKey, bbox);

  if (seaPoints.length < 10) {
    throw new Error("Área muito pequena para A*; ajuste pontos.");
  }

  // Nós start/end
  let startNode = seaPoints.reduce((closest, pt) => turf.distance(start, pt) < turf.distance(start, closest) ? pt : closest);
  let endNode = seaPoints.reduce((closest, pt) => turf.distance(end, pt) < turf.distance(end, closest) ? pt : closest);

  const pathNodes = aStar(seaPoints, startNode, endNode);
  if (!pathNodes) {
    throw new Error("A* falhou; tente pontos diferentes.");
  }

  // Suaviza
  const coordinates = [start.geometry.coordinates];
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const segment = turf.greatCircle(pathNodes[i], pathNodes[i + 1], { npoints: 8 });
    coordinates.push(...segment.geometry.coordinates.slice(1, -1));
  }
  coordinates.push(end.geometry.coordinates);
  const aStarRoute = turf.lineString(coordinates);

  if (crossesLand(aStarRoute)) {
    throw new Error("Rota A* inválida (raro); retry heurística.");
  }

  console.log(`✅ A* usado (total: ${Date.now() - startTime}ms).`);
  return aStarRoute;
}

// Endpoint principal (com timeout global de 3s)
router.post("/maritime", (req, res) => {
  const timeoutId = setTimeout(() => {
    console.warn("⏰ Timeout de 3s no /maritime; forçando erro.");
    res.status(408).json({ error: "Timeout: Rota complexa, tente pontos mais simples." });
  }, 3000);

  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) {
      clearTimeout(timeoutId);
      return res.status(400).json({ error: "Origem e destino obrigatórios." });
    }

    const start = turf.point([origin.lng, origin.lat]);
    const end = turf.point([destination.lng, destination.lat]);

    if (isOnLand(start) || isOnLand(end)) {
      clearTimeout(timeoutId);
      return res
        .status(400)
        .json({ error: "Ponto de origem ou destino está em terra." });
    }

    const safeRoute = computeSafeRoute(start, end);

    const warnings = crossesLand(safeRoute) ? ["⚠️ Rota pode tocar terra (verifique pontos)."] : [];

    const ends = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: start.geometry, properties: { role: "start" } },
        { type: "Feature", geometry: end.geometry, properties: { role: "end" } },
      ],
    };

    clearTimeout(timeoutId);
    return res.json({ route: safeRoute, ends, warnings });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Erro em /api/v1/route/maritime:", err);
    res.status(500).json({ error: err.message || "Erro ao gerar rota marítima segura." });
  }
});

router.post("/maritime/check", (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: "Coordenadas ausentes." });
    }

    const point = turf.point([lng, lat]);
    const onLand = isOnLand(point);

    return res.json({ onLand });
  } catch (err) {
    console.error("Erro em /api/v1/route/maritime/check:", err);
    res.status(500).json({ error: "Erro ao verificar ponto." });
  }
});

module.exports = router;