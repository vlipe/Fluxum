const express = require("express")
const fs = require("fs")
const path = require("path")
const turf = require("@turf/turf")
const router = express.Router()

const CHANNEL_PATH = path.join(__dirname, "..", "data", "corridors", "santos_canal_refined.geojson")

function distOnLine(line, pt) {
  return turf.length(
    turf.lineSlice(line.geometry.coordinates[0], pt.geometry.coordinates, line),
    { units: "kilometers" }
  )
}

router.post("/route/maritime", async (req, res) => {
  try {
    const { origin, destination } = req.body || {}
    if (!origin || !destination) return res.status(400).json({ error: "origin e destination são obrigatórios" })

    const canal = JSON.parse(fs.readFileSync(CHANNEL_PATH, "utf8"))
    const line = canal.type === "Feature" ? canal
               : canal.type === "FeatureCollection" ? canal.features[0]
               : null
    if (!line || line.geometry?.type !== "LineString") return res.status(500).json({ error: "Canal inválido" })

    const o = turf.point([origin.lng, origin.lat])
    const d = turf.point([destination.lng, destination.lat])
    const projO = turf.nearestPointOnLine(line, o)
    const projD = turf.nearestPointOnLine(line, d)

    const maxSnapM = 600;
    const distO = turf.distance(o, projO, { units: "meters" })
    const distD = turf.distance(d, projD, { units: "meters" })
    if (distO > maxSnapM || distD > maxSnapM) return res.status(400).json({ error: "Pontos não estão próximos do canal" })

    const lo = distOnLine(line, projO)
    const ld = distOnLine(line, projD)
    const from = lo <= ld ? projO : projD
    const to = lo <= ld ? projD : projO

    const sliced = turf.lineSlice(from, to, line)
    const lenKm = turf.length(sliced, { units: "kilometers" })
    const step = 0.05
    const coords = []
    for (let dkm = 0; dkm <= lenKm; dkm += step) {
      coords.push(turf.along(sliced, dkm, { units: "kilometers" }).geometry.coordinates)
    }
    const route = turf.featureCollection([turf.lineString(coords, { via: "canal_centerline" })])

    const ends = turf.featureCollection([
      turf.point(from.geometry.coordinates, { role: "start" }),
      turf.point(to.geometry.coordinates, { role: "end" })
    ])

    return res.json({ route, ends })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Falha ao calcular rota marítima" })
  }
})

module.exports = router