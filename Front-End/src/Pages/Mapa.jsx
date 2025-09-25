import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Sidebar2 from "../Components/Sidebar2";
import { apiFetch } from "../lib/api";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox as turfBbox } from "@turf/turf";

const shipPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAtElEQVRYhe2X0Q2CMBBFv0m4gV3Cwqg6JwK0C2k0b4wYc0Y9y0w+3oHqg0xR1Rk0WJwB3HhQz6g8m1iQy2m4Hqg7G9eZ8n7D6w0d0m4VqQJ1m0xg1w2Gx3v9M0T3z4nQSgQwC2e3P8m8bqgQ6v2E6mQqK7VqQkQmZ8w9l6o9r0mEJkQKk1mG9v1n6rU3LkYB4n0k8QmA8Vb2lQeN0m6qE1g0nqS7mF3dHfGq4m1uVJ8iQ3xw5dC5v2Kx1bYcE3oC3m0q3c1gq7h4W+SPk7w6g6c9l3oQ2f7wC0r8e3w9oUoAAAAASUVORK5CYII=";
const contPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAiUlEQVRYhe3WsQnCMBRF0R9hY7lC0QyQFZpQKu4H8oV7Cq8q9Q4yYy7HqN9z8lZyU8c0g0s9NwCw6w1tQqf3rJr4J/9mQwr9h8r4mKcY0b8WJbE3q1a1rBz3mG6i5+oCwBzYHq5eQ3Q2yQpKpV8xUe2Qw4iZ9bKqk8bZgq3lq6d4S7dOe4P0lX9mW9S9o2kN7r4cI+Y7I3WcGQ7A6m8KQAAAABJRU5ErkJggg==";

// pega o último ponto por viagem (um navio por voyage)
function latestBy(arr, keyFn, timeFn) {
  const m = new Map();
  for (const f of arr) {
    const k = keyFn(f);
    if (!k) continue;
    const t = timeFn(f);
    const prev = m.get(k);
    if (!prev || t > prev.t) m.set(k, { f, t });
  }
  return Array.from(m.values()).map((x) => x.f);
}
function toShipsFC(positions) {
  if (!positions?.features?.length) return { type: "FeatureCollection", features: [] };
  const feats = latestBy(
    positions.features.filter((f) => f?.properties?.voyage_code && f?.geometry?.coordinates),
    (f) => f.properties.voyage_code,
    (f) => new Date(f.properties.ts_iso || 0).getTime()
  ).map((f) => ({
    type: "Feature",
    geometry: f.geometry,
    properties: {
      voyage_code: f.properties.voyage_code,
      imo: f.properties.imo || null,
      ship_label: f.properties.imo || f.properties.voyage_code
    }
  }));
  return { type: "FeatureCollection", features: feats };
}

export default function Mapa() {
  const mapRef = useRef(null);
  const map = useRef(null);
  const wsRef = useRef(null);

  const [positions, setPositions] = useState(null);
  const [ships, setShips] = useState(null);
  const [track, setTrack] = useState(null);
  const [q, setQ] = useState("");
  const [voyageCode, setVoyageCode] = useState("");
  const [routeMode, setRouteMode] = useState("track");
  const [loading, setLoading] = useState(true);

  // seletor Streets/Satellite (padrão via .env)
  const [baseStyle, setBaseStyle] = useState(
    (import.meta.env.VITE_MAP_BASE || "streets").toLowerCase() === "satellite" ? "satellite" : "streets"
  );
  const [styleVersion, setStyleVersion] = useState(0); // força redesenho pós-troca de estilo

  const mapStyle = useMemo(() => {
    const key = import.meta.env.VITE_MAPTILER_KEY;
    if (!key) return "https://demotiles.maplibre.org/style.json";
    return baseStyle === "satellite"
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;
  }, [baseStyle]);

  // registra ícones + overlay OpenSeaMap
  const registerImagesAndOverlay = useCallback(async () => {
    const m = map.current;
    if (!m) return;
    try {
      // evita duplicar imagens se já existirem
      if (!m.hasImage?.("ship-icon")) {
        const imgShip = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = (e) => reject(e);
          i.src = shipPng;
        });
        // @ts-ignore
        m.addImage("ship-icon", imgShip, { pixelRatio: 2 });
      }
      if (!m.hasImage?.("cont-icon")) {
        const imgCont = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = (e) => reject(e);
          i.src = contPng;
        });
        // @ts-ignore
        m.addImage("cont-icon", imgCont, { pixelRatio: 2 });
      }

      const key = import.meta.env.VITE_MAPTILER_KEY;
      if (key && !m.getSource("openseamap")) {
        m.addSource("openseamap", {
          type: "raster",
          tiles: ["https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "MapTiler © OSM contributors, Seamarks © OpenSeaMap"
        });
        m.addLayer({
          id: "openseamap",
          type: "raster",
          source: "openseamap",
          paint: { "raster-opacity": 0.8 }
        });
      }
    } catch (err) {
      console.warn("Falha ao registrar imagens/overlay:", err);
    }
  }, []);

  // cria mapa (primeira vez) e troca de estilo depois com setStyle
  useEffect(() => {
    if (!mapRef.current) return;

    if (!map.current) {
      // inicialização
      const m = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: [-48, -15],
        zoom: 4,
        renderWorldCopies: false,
        maxBounds: new maplibregl.LngLatBounds([-179.99, -85], [179.99, 85]),
        cooperativeGestures: true
      });
      map.current = m;
      m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

      m.once("load", async () => {
        await registerImagesAndOverlay();
        try {
          m.resize();
        } catch (err) {
          console.warn("resize falhou:", err);
        }
      });

      const onWindowResize = () => {
        try {
          map.current?.resize();
        } catch (err) {
          console.warn("resize window falhou:", err);
        }
      };
      window.addEventListener("resize", onWindowResize);
      return () => {
        window.removeEventListener("resize", onWindowResize);
        try {
          map.current?.remove();
        } catch (err) {
          console.warn("map.remove falhou:", err);
        }
        map.current = null;
      };
    } else {
      // troca de estilo on-the-fly
      const m = map.current;
      try {
        m.setStyle(mapStyle);
        m.once("styledata", async () => {
          await registerImagesAndOverlay();
          // avisa o efeito de camadas para re-hidratar tudo
          setStyleVersion((v) => v + 1);
          try {
            m.resize();
          } catch (err) {
            console.warn("resize pós-style falhou:", err);
          }
        });
      } catch (err) {
        console.warn("setStyle falhou:", err);
      }
    }
  }, [mapStyle, registerImagesAndOverlay]);

  // carrega posições + WebSocket
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch("/api/v1/containers/positions");
        if (!alive) return;
        setPositions(data);
        setShips(toShipsFC(data));
      } catch (err) {
        console.warn("Falha carregando positions:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.host}/ws/positions`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg?.type === "positions") {
            setPositions(msg.data);
            setShips(toShipsFC(msg.data));
          }
        } catch (err) {
          console.warn("WS parse falhou:", err);
        }
      };
      ws.onclose = () => null;
    } catch (err) {
      console.warn("Falha ao abrir WebSocket:", err);
    }

    return () => {
      alive = false;
      try {
        wsRef.current?.close();
      } catch (err) {
        console.warn("WS close falhou:", err);
      }
    };
  }, []);

  // carrega track quando trocar voyage/mode
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!voyageCode) {
        setTrack(null);
        return;
      }
      const path =
        routeMode === "great-circle"
          ? `/api/v1/voyages/${encodeURIComponent(voyageCode)}/great-circle?npoints=180`
          : `/api/v1/voyages/${encodeURIComponent(voyageCode)}/track`;
      try {
        const t = await apiFetch(path);
        if (!alive) return;
        setTrack(t);
      } catch (err) {
        console.warn("Falha buscando track:", err);
        setTrack(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [voyageCode, routeMode]);

  // filtro digitado
  const filterExpr = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ["boolean", true];
    return [
      "any",
      ["in", ["downcase", ["get", "container_id"]], ["literal", [term]]],
      ["in", ["downcase", ["get", "voyage_code"]], ["literal", [term]]],
      ["in", ["downcase", ["get", "imo"]], ["literal", [term]]]
    ];
  }, [q]);

  // foco no voyage: zoom + rota (ou fallback) + start/end + filtra containers do voyage
  const highlightVoyage = useCallback(
    async (vcode, shipLngLat) => {
      setVoyageCode(vcode);

      const m = map.current;
      if (!m) return;

      try {
        m.easeTo({ center: shipLngLat, zoom: 7.8, duration: 900, essential: true });
      } catch (err) {
        console.warn("easeTo falhou:", err);
      }

      let lineFC = null;
      try {
        const t = await apiFetch(`/api/v1/voyages/${encodeURIComponent(vcode)}/track`);
        if (t?.features?.length) lineFC = t;
      } catch (err) {
        console.warn("Falha buscando track do voyage:", err);
      }

      if (!lineFC?.features?.length && positions?.features?.length) {
        const pts = positions.features
          .filter((f) => f?.properties?.voyage_code === vcode && f?.geometry?.coordinates)
          .sort((a, b) => new Date(a.properties.ts_iso || 0) - new Date(b.properties.ts_iso || 0))
          .map((f) => f.geometry.coordinates);
        if (pts.length >= 2) {
          lineFC = {
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "LineString", coordinates: pts }, properties: {} }]
          };
        }
      }

      const trackSrcId = "voyage-track";
      const endsSrcId = "voyage-ends";
      const focusSrcId = "ship-focus";

      if (lineFC) {
        try {
          if (m.getSource(trackSrcId)) m.getSource(trackSrcId).setData(lineFC);
          else {
            m.addSource(trackSrcId, { type: "geojson", data: lineFC });
            m.addLayer({
              id: "voyage-track-line",
              type: "line",
              source: trackSrcId,
              paint: { "line-color": "#1e90ff", "line-width": 3 }
            });
          }
          const b = turfBbox(lineFC);
          if (Number.isFinite(b[0])) {
            m.fitBounds(
              [
                [b[0], b[1]],
                [b[2], b[3]]
              ],
              { padding: 48, duration: 900, maxZoom: 8 }
            );
          }
        } catch (err) {
          console.warn("Desenho/fit da rota falhou:", err);
        }
      }

      if (lineFC?.features?.[0]?.geometry?.type === "LineString") {
        try {
          const coords = lineFC.features[0].geometry.coordinates;
          const endsFC = {
            type: "FeatureCollection",
            features: [
              { type: "Feature", geometry: { type: "Point", coordinates: coords[0] }, properties: { role: "start" } },
              { type: "Feature", geometry: { type: "Point", coordinates: coords[coords.length - 1] }, properties: { role: "end" } }
            ]
          };
          if (m.getSource(endsSrcId)) m.getSource(endsSrcId).setData(endsFC);
          else {
            m.addSource(endsSrcId, { type: "geojson", data: endsFC });
            m.addLayer({
              id: "voyage-ends-layer",
              type: "circle",
              source: endsSrcId,
              paint: {
                "circle-radius": 6,
                "circle-color": ["case", ["==", ["get", "role"], "start"], "#22c55e", "#ef4444"],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff"
              }
            });
          }
        } catch (err) {
          console.warn("Marcação de start/end falhou:", err);
        }
      }

      try {
        const focusFC = {
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: { type: "Point", coordinates: shipLngLat }, properties: {} }]
        };
        if (m.getSource(focusSrcId)) m.getSource(focusSrcId).setData(focusFC);
        else {
          m.addSource(focusSrcId, { type: "geojson", data: focusFC });
          m.addLayer({
            id: "ship-focus-ring",
            type: "circle",
            source: focusSrcId,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 10, 10, 20],
              "circle-color": "rgba(62,65,192,0.12)",
              "circle-stroke-color": "#3E41C0",
              "circle-stroke-width": 2
            }
          });
        }
      } catch (err) {
        console.warn("Anel de foco falhou:", err);
      }

      try {
        m.setFilter("containers-unclustered", [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "voyage_code"], vcode]
        ]);
      } catch (err) {
        console.warn("Filtro de containers por voyage falhou:", err);
      }
    },
    [positions]
  );

  // desenha/atualiza camadas (também roda após troca de estilo via styleVersion)
  useEffect(() => {
    const m = map.current;
    if (!m || !positions || !ships) return;

    const contSrc = "containers";
    const shipSrc = "ships";
    const trackSrcId = "track";

    const ensure = () => {
      // CONTAINERS
      if (m.getSource(contSrc)) {
        try {
          m.getSource(contSrc).setData(positions);
        } catch (err) {
          console.warn("setData containers falhou:", err);
        }
      } else {
        try {
          m.addSource(contSrc, {
            type: "geojson",
            data: positions,
            cluster: true,
            clusterMaxZoom: 12,
            clusterRadius: 50
          });
          m.addLayer({
            id: "containers-unclustered",
            type: "symbol",
            source: contSrc,
            filter: ["!", ["has", "point_count"]],
            layout: { "icon-image": "cont-icon", "icon-size": 0.9, "icon-allow-overlap": true }
          });
          m.addLayer({
            id: "containers-clusters",
            type: "circle",
            source: contSrc,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": ["step", ["get", "point_count"], "#8da2fb", 50, "#4f46e5", 200, "#1e1b4b"],
              "circle-radius": ["step", ["get", "point_count"], 16, 50, 22, 200, 30]
            }
          });
          m.addLayer({
            id: "containers-count",
            type: "symbol",
            source: contSrc,
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
            paint: { "text-color": "#ffffff" }
          });

          m.on("click", "containers-unclustered", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const p = f.properties || {};
            const coords = f.geometry.coordinates.slice();
            const html = `<div style="font-size:12px">
              <div><b>Container:</b> ${p.container_id || "—"}</div>
              <div><b>Viagem:</b> ${p.voyage_code || "—"}</div>
              <div><b>IMO:</b> ${p.imo || "—"}</div>
              <div><b>Atualizado:</b> ${p.ts_iso || "—"}</div>
            </div>`;
            try {
              new maplibregl.Popup().setLngLat(coords).setHTML(html).addTo(m);
            } catch (err) {
              console.warn("Popup container falhou:", err);
            }
          });

          m.on("click", "containers-clusters", (e) => {
            try {
              const features = m.queryRenderedFeatures(e.point, { layers: ["containers-clusters"] });
              const clusterId = features[0].properties.cluster_id;
              m.getSource(contSrc).getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) {
                  console.warn("clusterExpansionZoom falhou:", err);
                  return;
                }
                m.easeTo({ center: features[0].geometry.coordinates, zoom });
              });
            } catch (err) {
              console.warn("Clique em clusters falhou:", err);
            }
          });
        } catch (err) {
          console.warn("Criação das camadas containers falhou:", err);
        }
      }

    // SHIPS
if (m.getSource(shipSrc)) {
  try {
    m.getSource(shipSrc).setData(ships);
  } catch (err) {
    console.warn("setData ships falhou:", err);
  }
} else {
  try {
    m.addSource(shipSrc, { type: "geojson", data: ships });

    const hasIcon = typeof m.hasImage === "function" ? m.hasImage("ship-icon") : true;

    if (hasIcon) {
      // Camada com ícone
      m.addLayer({
        id: "ships-layer",
        type: "symbol",
        source: shipSrc,
        layout: {
          "icon-image": "ship-icon",
          "icon-size": 1.0,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "text-field": ["get", "ship_label"],
          "text-offset": [0, 1.2],
          "text-size": 12,
          "text-anchor": "top"
        },
        paint: { "text-color": "#0f172a" }
      }, "openseamap"); // insere acima do raster (se existir)
    } else {
      // Fallback visual se sprite ainda não estiver pronto
      m.addLayer({
        id: "ships-layer-fallback",
        type: "circle",
        source: shipSrc,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 3, 10, 6],
          "circle-color": "#0ea5e9",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5
        }
      }, "openseamap");
    }

    // handlers de interação (apontam para a camada que existir)
    const shipLayerId = m.getLayer("ships-layer") ? "ships-layer" : "ships-layer-fallback";

    m.on("click", shipLayerId, (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const vcode = f.properties?.voyage_code || "";
      const coords = f.geometry?.coordinates?.slice?.() || null;
      if (!vcode || !coords) return;
      highlightVoyage(vcode, coords);
    });

    m.on("mouseenter", shipLayerId, () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", shipLayerId, () => { m.getCanvas().style.cursor = ""; });

    // clique fora = limpar foco/rota e restaurar filtro digitado
    m.on("click", (ev) => {
      try {
        const layersToCheck = [
          m.getLayer("ships-layer") ? "ships-layer" : "ships-layer-fallback",
          "containers-unclustered",
          "containers-clusters"
        ].filter(Boolean);

        const feats = m.queryRenderedFeatures(ev.point, { layers: layersToCheck });
        if (!feats.length) {
          m.setFilter("containers-unclustered", ["all", ["!", ["has", "point_count"]], filterExpr]);
          ["voyage-track", "voyage-ends", "ship-focus"].forEach((sid) => {
            try {
              if (m.getSource(sid)) {
                if (sid === "voyage-track" && m.getLayer("voyage-track-line")) m.removeLayer("voyage-track-line");
                if (sid === "voyage-ends" && m.getLayer("voyage-ends-layer")) m.removeLayer("voyage-ends-layer");
                if (sid === "ship-focus" && m.getLayer("ship-focus-ring")) m.removeLayer("ship-focus-ring");
                m.removeSource(sid);
              }
            } catch (err) {
              console.warn(`Remoção de camada ${sid} falhou:`, err);
            }
          });
          setTrack(null);
        }
      } catch (err) {
        console.warn("Clique fora (limpeza) falhou:", err);
      }
    });
  } catch (err) {
    console.warn("Criação das camadas ships falhou:", err);
  }
}


      // aplica filtro digitado
      try {
        m.setFilter("containers-unclustered", ["all", ["!", ["has", "point_count"]], filterExpr]);
      } catch (err) {
        console.warn("Aplicar filtro digitado falhou:", err);
      }

      // camada “track” vinda do state (quando troca select / digita voyageCode)
      if (track) {
        try {
          if (m.getSource(trackSrcId)) {
            m.getSource(trackSrcId).setData(track);
          } else {
            m.addSource(trackSrcId, { type: "geojson", data: track });
            m.addLayer({
              id: "track-line",
              type: "line",
              source: trackSrcId,
              paint: { "line-color": "#1e90ff", "line-width": 3 }
            });
          }
          const b = turfBbox(track);
          if (Number.isFinite(b[0])) {
            m.fitBounds(
              [
                [b[0], b[1]],
                [b[2], b[3]]
              ],
              { padding: 40, duration: 700, maxZoom: 8 }
            );
          }
        } catch (err) {
          console.warn("Desenho/fit da track (state) falhou:", err);
        }
      } else if (m.getSource(trackSrcId)) {
        try {
          if (m.getLayer("track-line")) m.removeLayer("track-line");
          m.removeSource(trackSrcId);
        } catch (err) {
          console.warn("Remoção da track (state) falhou:", err);
        }
      }

      // sem track: enquadra os navios
      if (!track && ships?.features?.length) {
        try {
          const b = turfBbox(ships);
          if (Number.isFinite(b[0])) {
            m.fitBounds(
              [
                [b[0], b[1]],
                [b[2], b[3]]
              ],
              { padding: 40, duration: 700, maxZoom: 6 }
            );
          }
        } catch (err) {
          console.warn("fitBounds ships falhou:", err);
        }
      }
    };

    if (m.isStyleLoaded()) ensure();
    else m.once("load", ensure);

    const onErr = (ev) => console.error("Map error:", ev?.error || ev);
    m.on("error", onErr);
    return () => m.off("error", onErr);
  }, [positions, ships, track, filterExpr, highlightVoyage, styleVersion]);

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className="flex flex-col w-full md:w-[96%] mt-8 mb-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <p className="mr-4 text-xl">
            Oi, <span className="text-[#3E41C0]">Felipe</span>!
          </p>
          <div className="flex gap-2 w-full sm:w-auto items-center">
            <input
              type="text"
              placeholder="Filtrar por container/viagem/IMO"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Código da viagem (ex.: VOY-001)"
              value={voyageCode}
              onChange={(e) => setVoyageCode(e.target.value)}
              className="w-full h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none"
            />
            <select
              value={routeMode}
              onChange={(e) => setRouteMode(e.target.value)}
              className="h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none"
            >
              <option value="track">Track</option>
              <option value="great-circle">Great Circle</option>
            </select>

            {/* seletor de base (streets/satellite) */}
            <select
              value={baseStyle}
              onChange={(e) => setBaseStyle(e.target.value)}
              className="h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none"
              title="Tipo de mapa"
            >
              <option value="streets">Streets</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6 h-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">Mapa</h1>
            {loading && <div className="text-gray-500 text-sm">Carregando…</div>}
          </div>
          <div className="w-full h-[70vh] rounded-2xl overflow-hidden">
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
