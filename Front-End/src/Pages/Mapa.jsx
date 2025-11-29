import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Rota from "../assets/assetsDashboard/rota.svg";
import Lixeira from "../assets/assetsDashboard/lixeira.svg";;
import { apiFetch } from "../lib/api";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox as turfBbox } from "@turf/turf";


function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function waitForImages(m, ids, maxMs = 2000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const ok = ids.every(id => m.hasImage?.(id));
    if (ok) return true;
    await sleep(50);
  }
  return false;
}
function topSymbolBeforeId(m) {
  const layers = m.getStyle()?.layers || [];
  for (let i = layers.length - 1; i >= 0; i--) {
    if (layers[i].type === "symbol") return layers[i].id;
  }
  return layers.at(-1)?.id || undefined;
}

const SHIP_SVG = `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(32,32)">
    <path d="M0,-22 L8,-6 L20,-2 L20,4 L8,8 L0,22 L-8,8 L-20,4 L-20,-2 L-8,-6 Z"
          fill="#2563eb" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
  </g>
</svg>`;
const CONT_SVG = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="14" width="36" height="20" rx="4" fill="#3E41C0" stroke="#ffffff" stroke-width="2"/>
  <line x1="12" y1="14" x2="12" y2="34" stroke="#ffffff" stroke-width="2"/>
  <line x1="36" y1="14" x2="36" y2="34" stroke="#ffffff" stroke-width="2"/>
</svg>`;
async function loadSvgIcon(svgString) {
  try {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    return await createImageBitmap(blob);
  } catch {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      const svg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.width || 64;
          c.height = img.height || 64;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0);
          c.toBlob((b) => {
            if (!b) return reject(new Error("canvas toBlob failed"));
            createImageBitmap(b).then(resolve, reject);
          });
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = svg;
    });
  }
}

function buildTrailForShip(positions, shipKey, limit = 80) {
  if (!positions?.features?.length || !shipKey) return null;
  const pts = positions.features
    .filter((f) => {
      const p = f?.properties;
      const k = p?.voyage_code || p?.ship_id || p?.imo;
      return k === shipKey && f?.geometry?.coordinates;
    })
    .sort((a, b) => new Date(a?.properties?.ts_iso || 0) - new Date(b?.properties?.ts_iso || 0))
    .slice(-limit)
    .map((f) => f.geometry.coordinates);
  if (pts.length < 2) return null;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: pts },
        properties: { role: "trail", count: pts.length }
      }
    ]
  };
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
  const [routeMode] = useState("track");
  const [loading, setLoading] = useState(true);

  const [planning, setPlanning] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [plannedEnds, setPlannedEnds] = useState(null);

  const [routeMeta, setRouteMeta] = useState({ isEstimated: false, label: "" });

  const [baseStyle, setBaseStyle] = useState(
    (import.meta.env.VITE_MAP_BASE || "streets").toLowerCase() === "satellite" ? "satellite" : "streets"
  );
  const [styleVersion, setStyleVersion] = useState(0);

  const mapStyle = useMemo(() => {
    const key = import.meta.env.VITE_MAPTILER_KEY;
    if (!key) return "https://demotiles.maplibre.org/style.json";
    return baseStyle === "satellite"
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;
  }, [baseStyle]);

  const registerImagesAndOverlay = useCallback(async () => {
    const m = map.current;
    if (!m) return;
    m.on?.("styleimagemissing", async (e) => {
      try {
        if (e?.id === "ship-icon") {
          const ship = await loadSvgIcon(SHIP_SVG);
          m.addImage("ship-icon", ship, { pixelRatio: 2 });
        }
        if (e?.id === "cont-icon") {
          const cont = await loadSvgIcon(CONT_SVG);
          m.addImage("cont-icon", cont, { pixelRatio: 2 });
        }
      } catch (err) {
        console.warn(err);
      }
    });
    try {
      if (!m.hasImage?.("ship-icon")) {
        const ship = await loadSvgIcon(SHIP_SVG);
        m.addImage("ship-icon", ship, { pixelRatio: 2 });
      }
      if (!m.hasImage?.("cont-icon")) {
        const cont = await loadSvgIcon(CONT_SVG);
        m.addImage("cont-icon", cont, { pixelRatio: 2 });
      }
      const key = import.meta.env.VITE_MAPTILER_KEY;
      if (key && !m.getSource("openseamap")) {
        m.addSource("openseamap", {
          type: "raster",
          tiles: ["https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "MapTiler © OSM contributors, Seamarks © OpenSeaMap"
        });
        m.addLayer(
          { id: "openseamap", type: "raster", source: "openseamap", paint: { "raster-opacity": 0.8 } },
          topSymbolBeforeId(m)
        );
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!map.current) {
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
        try {
          await registerImagesAndOverlay();
          m.resize();
        } catch (err) {
          console.warn(err);
        }
      });
      const onWindowResize = () => {
        try { map.current?.resize(); } catch (err) { console.warn(err); }
      };
      window.addEventListener("resize", onWindowResize);
      return () => {
        window.removeEventListener("resize", onWindowResize);
        try { map.current?.remove(); } catch (err) { console.warn(err); }
        map.current = null;
      };
    } else {
      const m = map.current;
      try {
        m.setStyle(mapStyle);
        m.once("load", async () => {
          try {
            await registerImagesAndOverlay();
            setStyleVersion(v => v + 1);
            setRouteMeta({ isEstimated: false, label: "" });
            m.resize();
          } catch (err) { console.warn(err); }
        });
      } catch (err) { console.warn(err); }
    }
  }, [mapStyle, registerImagesAndOverlay]);

  const wsInit = useRef(false);

  useEffect(() => {
    if (wsInit.current) return;  
    wsInit.current = true;

    let alive = true;

    (async () => {
      try {
        const [cont, sh] = await Promise.all([
          apiFetch("/api/v1/live/containers"),
          apiFetch("/api/v1/live/ships"),
        ]);
        if (!alive) return;
        setPositions(cont);
        setShips(sh);
      } catch (err) {
        console.warn("Falha carregando live:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const scheme = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${scheme}://${location.hostname}:3000/ws/positions`);
    wsRef.current = ws;

    ws.onerror = () => { };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg?.type === "ships") setShips(msg.data);
        else if (msg?.type === "containers") setPositions(msg.data);
      } catch (err) {
        console.warn("WS parse:", err);
      }
    };

    return () => {
      alive = false;
      try {
        if (!wsRef.current) return;
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.onopen = () => wsRef.current?.close();
        }
      } catch (err) { console.warn(err) }
    };
  }, []);


  useEffect(() => {
    let alive = true;
    (async () => {
      if (!voyageCode) {
        setTrack(null);
        setRouteMeta({ isEstimated: false, label: "" });
        return;
      }
      const path =
        routeMode === "great-circle"
          ? `/api/v1/voyages/${encodeURIComponent(voyageCode)}/great-circle?npoints=180`
          : `/api/v1/voyages/${encodeURIComponent(voyageCode)}/track.geojson`;
      try {
        const t = await apiFetch(path);
        if (!alive) return;
        setTrack(t);
        setRouteMeta({ isEstimated: false, label: voyageCode });
      } catch (err) {
        console.warn("Falha buscando track:", err);
        setTrack(null);
        setRouteMeta({ isEstimated: false, label: "" });
      }
    })();
    return () => { alive = false; };
  }, [voyageCode, routeMode]);

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

  const highlightShipTrail = useCallback((shipKey, shipLngLat, label = "") => {
    const m = map.current;
    if (!m) return;
    setRouteMeta({ isEstimated: false, label: "" });

    try { m.easeTo({ center: shipLngLat, zoom: 8, duration: 900, essential: true }); } catch (err) { console.warn(err); }

    const lineFC = buildTrailForShip(positions, shipKey, 80);
    const trackSrcId = "ship-trail";
    const endsSrcId = "ship-trail-ends";
    const focusSrcId = "ship-focus";

    ["ship-trail-line", "ship-trail-arrows", "ship-trail-ends", "ship-focus-ring"].forEach((id) => {
      try { if (m.getLayer(id)) m.removeLayer(id); } catch (err) { console.warn(err); }
    });
    [trackSrcId, endsSrcId, focusSrcId].forEach((sid) => {
      try { if (m.getSource(sid)) m.removeSource(sid); } catch (err) { console.warn(err); }
    });

    try {
      const focusFC = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: shipLngLat } }] };
      m.addSource(focusSrcId, { type: "geojson", data: focusFC });
      m.addLayer({
        id: "ship-focus-ring",
        type: "circle",
        source: focusSrcId,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 10, 10, 22],
          "circle-color": "rgba(62,65,192,0.12)",
          "circle-stroke-color": "#3E41C0",
          "circle-stroke-width": 2
        }
      });
    } catch (err) { console.warn(err); }

    if (!lineFC) return;

    try {
      m.addSource(trackSrcId, { type: "geojson", data: lineFC });
      m.addLayer({ id: "ship-trail-line", type: "line", source: trackSrcId, paint: { "line-color": "#1e90ff", "line-width": 3 } });
      m.addLayer({
        id: "ship-trail-arrows",
        type: "symbol",
        source: trackSrcId,
        layout: { "symbol-placement": "line", "symbol-spacing": 60, "text-field": "▶", "text-size": 12, "text-allow-overlap": true },
        paint: { "text-color": "#1e90ff", "text-halo-color": "#ffffff", "text-halo-width": 1 }
      });

      const coords = lineFC.features[0].geometry.coordinates;
      const endsFC = {
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: coords[0] }, properties: { role: "start" } },
          { type: "Feature", geometry: { type: "Point", coordinates: coords[coords.length - 1] }, properties: { role: "end" } }
        ]
      };
      m.addSource(endsSrcId, { type: "geojson", data: endsFC });
      m.addLayer({
        id: "ship-trail-ends",
        type: "circle",
        source: endsSrcId,
        paint: {
          "circle-radius": 6,
          "circle-color": ["case", ["==", ["get", "role"], "start"], "#22c55e", "#ef4444"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      const count = lineFC.features?.[0]?.properties?.count ?? coords.length;
      const isEstimated = count <= 2;
      setRouteMeta({ isEstimated, label });

      try {
        const b = turfBbox(lineFC);
        if (Number.isFinite(b[0])) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 48, duration: 800, maxZoom: 9 });
      } catch (err) { console.warn(err); }
    } catch (err) { console.warn(err); }
  }, [positions]);

  const drawPlannedRoute = useCallback(() => {
    const m = map.current;
    if (!m) return;
    if (!m.isStyleLoaded()) { m.once("load", drawPlannedRoute); return; }

    const routeSrc = "plan-route";
    const endsSrc = "plan-ends";

    ["plan-route-line", "plan-route-arrows", "plan-ends"].forEach((layer) => { try { if (m.getLayer(layer)) m.removeLayer(layer); } catch (err) { console.warn(err); } });
    [routeSrc, endsSrc].forEach((sid) => { try { if (m.getSource(sid)) m.removeSource(sid); } catch (err) { console.warn(err); } });

    if (!plannedRoute || !plannedRoute.features?.length) return;

    try {
      m.addSource(routeSrc, { type: "geojson", data: plannedRoute });
      if (plannedEnds) m.addSource(endsSrc, { type: "geojson", data: plannedEnds });

      const beforeId = m.getStyle().layers.findLast?.(l => l.type === "symbol")?.id || m.getStyle().layers.at(-1)?.id;

      m.addLayer({ id: "plan-route-line", type: "line", source: routeSrc, paint: { "line-color": "#0ea5e9", "line-width": 3 } }, beforeId);
      m.addLayer(
        {
          id: "plan-route-arrows", type: "symbol", source: routeSrc,
          layout: { "symbol-placement": "line", "symbol-spacing": 60, "text-field": "▶", "text-size": 12, "text-allow-overlap": true },
          paint: { "text-color": "#0ea5e9", "text-halo-color": "#ffffff", "text-halo-width": 1 }
        },
        beforeId
      );

      if (plannedEnds) {
        m.addLayer(
          {
            id: "plan-ends", type: "circle", source: endsSrc,
            paint: { "circle-radius": 6, "circle-color": ["case", ["==", ["get", "role"], "start"], "#22c55e", "#ef4444"], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" }
          },
          beforeId
        );
      }

      try {
        const b = turfBbox(plannedRoute);
        if (Number.isFinite(b[0])) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 48, duration: 800, maxZoom: 13 });
      } catch (err) { console.warn(err); }
    } catch (err) { console.warn(err); }
  }, [plannedRoute, plannedEnds]);

  useEffect(() => { if (!map.current) return; drawPlannedRoute(); }, [styleVersion, drawPlannedRoute]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const onMapClickPlan = async (e) => {
      if (!planning) return;

      const lngLat = e.lngLat;
      try {
        // Verifica se o ponto está sobre terra
        const res = await apiFetch("/api/v1/route/maritime/check", {
          method: "POST",
          body: { lat: lngLat.lat, lng: lngLat.lng },
        });

        if (res?.onLand) {
          alert("❌ Não é possível selecionar pontos sobre a terra.");
          return;
        }

        // Se estiver na água, permite selecionar
        if (!origin) setOrigin({ lat: lngLat.lat, lng: lngLat.lng });
        else if (!destination) setDestination({ lat: lngLat.lat, lng: lngLat.lng });
        else {
          setOrigin({ lat: lngLat.lat, lng: lngLat.lng });
          setDestination(null);
          setPlannedRoute(null);
          setPlannedEnds(null);
        }
      } catch (err) {
        console.warn("Erro ao verificar ponto:", err);
        alert("Falha ao verificar se o ponto está sobre a água.");
      }
    };

    m.on("click", onMapClickPlan);
    return () => {
      try { m.off("click", onMapClickPlan); } catch (err) { console.warn(err); }
    };
  }, [planning, origin, destination]);

  useEffect(() => {
    const doRoute = async () => {
      if (!origin || !destination) return;
      try {
        const body = { origin, destination };
        const res = await apiFetch("/api/v1/route/maritime", { method: "POST", body });
        let route = res?.route || null;
        if (!route) {
          throw new Error("Rota não retornada pelo servidor.");
        } else {
          if (route.type === "Feature") route = { type: "FeatureCollection", features: [route] };
          if (route.type === "FeatureCollection" && !route.features?.length) {
            throw new Error("Rota inválida retornada pelo servidor.");
          }
        }
        let ends = res?.ends || null;
        if (!ends) {
          ends = {
            type: "FeatureCollection",
            features: [
              { type: "Feature", geometry: { type: "Point", coordinates: [origin.lng, origin.lat] }, properties: { role: "start" } },
              { type: "Feature", geometry: { type: "Point", coordinates: [destination.lng, destination.lat] }, properties: { role: "end" } }
            ]
          };
        } else if (ends.type === "Feature") {
          ends = { type: "FeatureCollection", features: [ends] };
        }
        setPlannedRoute(route);
        setPlannedEnds(ends);
      } catch (err) {
        console.warn(err);
        // Removido fallback para linha reta (pode cruzar terra); agora alerta e limpa
        alert("❌ Erro ao calcular rota segura (evitando terra). Ajuste os pontos e tente novamente.");
        setPlannedRoute(null);
        setPlannedEnds(null);
      }
    };
    doRoute();
  }, [origin, destination]);

  useEffect(() => { drawPlannedRoute(); }, [plannedRoute, plannedEnds, drawPlannedRoute]);

  useEffect(() => {
  const m = map.current;
  if (!m) return;

  const contSrc = "containers";
  const shipSrc = "ships";
  const trackSrcId = "track";

  const ensure = async () => {
  
    if (positions) {
      if (m.getSource(contSrc)) {
        try { m.getSource(contSrc).setData(positions); } catch (err) { console.warn(err); }
      } else {
        try {
          m.addSource(contSrc, {
            type: "geojson",
            data: positions,
            cluster: true,
            clusterMaxZoom: 12,
            clusterRadius: 50
          });
          await waitForImages(m, ["ship-icon", "cont-icon"]);
          const beforeId = topSymbolBeforeId(m);

          m.addLayer(
            {
              id: "containers-unclustered",
              type: "symbol",
              source: contSrc,
              filter: ["!", ["has", "point_count"]],
              layout: { "icon-image": "cont-icon", "icon-size": 0.9, "icon-allow-overlap": true }
            },
            beforeId
          );
          m.addLayer(
            {
              id: "containers-clusters",
              type: "circle",
              source: contSrc,
              filter: ["has", "point_count"],
              paint: {
                "circle-color": ["step", ["get", "point_count"], "#8da2fb", 50, "#4f46e5", 200, "#1e1b4b"],
                "circle-radius": ["step", ["get", "point_count"], 16, 50, 22, 200, 30]
              }
            },
            beforeId
          );
          m.addLayer(
            {
              id: "containers-count",
              type: "symbol",
              source: contSrc,
              filter: ["has", "point_count"],
              layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
              paint: { "text-color": "#ffffff" }
            },
            beforeId
          );

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
            try { new maplibregl.Popup().setLngLat(coords).setHTML(html).addTo(m); } catch (err) { console.warn(err); }
          });

          m.on("click", "containers-clusters", (e) => {
            try {
              const features = m.queryRenderedFeatures(e.point, { layers: ["containers-clusters"] });
              const clusterId = features[0].properties.cluster_id;
              m.getSource(contSrc).getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                m.easeTo({ center: features[0].geometry.coordinates, zoom });
              });
            } catch (err) { console.warn(err); }
          });
        } catch (err) { console.warn(err); }
      }

      try {
        if (m.getLayer("containers-unclustered")) {
          m.setFilter("containers-unclustered", ["all", ["!", ["has", "point_count"]], filterExpr]);
        }
      } catch (err) { console.warn(err); }
    }

    if (ships) {
      if (m.getSource(shipSrc)) {
        try { m.getSource(shipSrc).setData(ships); } catch (err) { console.warn(err); }
      } else {
        try {
          m.addSource(shipSrc, { type: "geojson", data: ships });
          const beforeId = topSymbolBeforeId(m);
          const hasIcon = typeof m.hasImage === "function" ? m.hasImage("ship-icon") : true;

          if (hasIcon) {
            m.addLayer(
              {
                id: "ships-layer",
                type: "symbol",
                source: shipSrc,
                layout: {
                  "icon-image": "ship-icon",
                  "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.8, 10, 1.15],
                  "icon-allow-overlap": true,
                  "icon-ignore-placement": true,
                  "icon-rotate": ["coalesce", ["get", "course"], 0],
                  "icon-rotation-alignment": "map",
                  "text-field": ["coalesce", ["get", "ship_label"], ["get", "voyage_code"], "Ship"],
                  "text-offset": [0, 1.2],
                  "text-size": 12,
                  "text-anchor": "top"
                },
                paint: { "text-color": "#0f172a", "text-halo-color": "#ffffff", "text-halo-width": 1 }
              },
              beforeId
            );
          } else {
            m.addLayer(
              {
                id: "ships-layer-fallback",
                type: "circle",
                source: shipSrc,
                paint: {
                  "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 10, 7],
                  "circle-color": "#0ea5e9",
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 1.5
                }
              },
              beforeId
            );
          }

          const shipLayerId = m.getLayer("ships-layer") ? "ships-layer" : "ships-layer-fallback";

          m.on("click", shipLayerId, (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const props = f.properties || {};
            const coords = f.geometry?.coordinates?.slice?.();
            if (!coords) return;

            const shipKey = props.ship_key || props.voyage_code || props.ship_id || props.imo;
            const label = props.ship_label || shipKey || "";
            highlightShipTrail(shipKey, coords, label);

            const voyage = props.voyage_code || null;
            try { m.easeTo({ center: coords, zoom: 8, duration: 900 }); } catch (err) { console.warn(err); }

            try {
              new maplibregl.Popup()
                .setLngLat(coords)
                .setHTML(`
                  <div style="font-size:12px">
                    <div><b>Viagem:</b> ${voyage ?? "—"}</div>
                    <div><b>Containers a bordo:</b> ${props.containers_onboard ?? 0}</div>
                    <div><b>Atualizado:</b> ${props.ts_iso || "—"}</div>
                  </div>
                `)
                .addTo(m);
            } catch (err) { console.warn(err); }
          });

          m.on("mouseenter", shipLayerId, () => { m.getCanvas().style.cursor = "pointer"; });
          m.on("mouseleave", shipLayerId, () => { m.getCanvas().style.cursor = ""; });

          m.on("click", (ev) => {
            try {
              const layersToCheck = [
                m.getLayer("ships-layer") ? "ships-layer" : "ships-layer-fallback",
                "containers-unclustered",
                "containers-clusters"
              ].filter(Boolean);
              const feats = m.queryRenderedFeatures(ev.point, { layers: layersToCheck });
              if (!feats.length) {
                ["ship-trail", "ship-trail-ends", "ship-focus", "voyage-track"].forEach((sid) => {
                  try {
                    if (m.getSource(sid)) {
                      if (sid === "ship-trail" && m.getLayer("ship-trail-line")) m.removeLayer("ship-trail-line");
                      if (sid === "ship-trail" && m.getLayer("ship-trail-arrows")) m.removeLayer("ship-trail-arrows");
                      if (sid === "ship-trail-ends" && m.getLayer("ship-trail-ends")) m.removeLayer("ship-trail-ends");
                      if (sid === "ship-focus" && m.getLayer("ship-focus-ring")) m.removeLayer("ship-focus-ring");
                      if (sid === "voyage-track" && m.getLayer("voyage-track-line")) m.removeLayer("voyage-track-line");
                      m.removeSource(sid);
                    }
                  } catch (err) { console.warn(err); }
                });
                setTrack(null);
                setRouteMeta({ isEstimated: false, label: "" });

                try {
                  if (m.getLayer("containers-unclustered")) {
                    m.setFilter("containers-unclustered", ["all", ["!", ["has", "point_count"]], filterExpr]);
                  }
                } catch (err) { console.warn(err); }
              }
            } catch (err) { console.warn(err); }
          });
        } catch (err) { console.warn(err); }
      }
    }

    if (track) {
      try {
        if (m.getSource(trackSrcId)) m.getSource(trackSrcId).setData(track);
        else {
          m.addSource(trackSrcId, { type: "geojson", data: track });
          m.addLayer({ id: "track-line", type: "line", source: trackSrcId, paint: { "line-color": "#1e90ff", "line-width": 3 } });
        }
        try {
          const b = turfBbox(track);
          if (Number.isFinite(b[0])) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, duration: 700, maxZoom: 8 });
        } catch (err) { console.warn(err); }
      } catch (err) { console.warn(err); }
    } else if (m.getSource(trackSrcId)) {
      try {
        if (m.getLayer("track-line")) m.removeLayer("track-line");
        m.removeSource(trackSrcId);
      } catch (err) { console.warn(err); }
    }

    if (!track) {
      if (ships?.features?.length) {
        try {
          const b = turfBbox(ships);
          if (Number.isFinite(b[0])) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, duration: 700, maxZoom: 6 });
        } catch (err) { console.warn(err); }
      } else if (positions?.features?.length) {
        try {
          const b = turfBbox(positions);
          if (Number.isFinite(b[0])) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, duration: 700, maxZoom: 6 });
        } catch (err) { console.warn(err); }
      }
    }

   
    drawPlannedRoute();
  };

  if (m.isStyleLoaded()) ensure();
  else m.once("load", ensure);

  const onErr = (ev) => console.error("Map error:", ev?.error || ev);
  m.on("error", onErr);
  return () => m.off("error", onErr);
}, [positions, ships, track, filterExpr, highlightShipTrail, styleVersion, drawPlannedRoute]);


  return (
    <div className="min-h-screen w-full bg-deletar flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className="flex flex-col w-full md:w-[96%] mt-8 mb-8 px-4 md:px-6">
<div className="flex flex-col sm:flex-row items-center gap-4 mb-6 max-[760px]:mt-14">
  <div className="flex gap-2 w-full flex-wrap justify-center">
    <input type="text" placeholder="Filtrar por contêiner, viagem ou IMO" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none flex-grow min-w-[200px]" />
    <input type="text" placeholder="Código da viagem" value={voyageCode} onChange={(e) => setVoyageCode(e.target.value)} className="h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none w-72" />
    <select value={baseStyle} onChange={(e) => setBaseStyle(e.target.value)} className="h-12 rounded-3xl text-azulEscuro bg-white px-10 text-sm focus:outline-none cursor-pointer" title="Tipo de mapa">
      <option value="streets">Ruas</option>
      <option value="satellite">Satélite</option>
    </select>
    <button
      type="button"
      onClick={() => {
        const on = !planning;
        setPlanning(on);
        if (on) {
          setOrigin(null);
          setDestination(null);
          setPlannedRoute(null);
          setPlannedEnds(null);
        }
      }}
      className={`h-12 rounded-3xl px-6 text-sm font-regular flex items-center justify-center gap-2 transition-colors duration-300 ${
        planning
          ? "bg-emerald-600 text-white"
          : "bg-violeta text-white hover:bg-roxo"
      }`}
      title="Clique no mapa: primeiro ponto = origem, segundo = destino"
    >
      <img src={Rota} alt="" className="w-4 h-4" />
      {planning ? "Clique em 2 pontos" : "Planejar Rota"}
    </button>
    <button
      type="button"
      onClick={() => {
        setOrigin(null);
        setDestination(null);
        setPlannedRoute(null);
        setPlannedEnds(null);
        setPlanning(false);
      }}
      className="h-12 rounded-3xl px-6 text-sm font-regular flex items-center justify-center gap-2 bg-white text-[#F21D4E] hover:bg-[#ECF2F9] hover:text-red-600 transition-colors duration-300"
    >
      <img src={Lixeira} alt="" className="w-4 h-4" />
      Limpar Rota
    </button>
  </div>
</div>

        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6 h-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">Mapa</h1>
            {loading && <div className="text-gray-500 text-sm">Carregando…</div>}
          </div>

          <div className="w-full h-[70vh] rounded-2xl overflow-hidden relative">
            {routeMeta.isEstimated && (
              <div className="absolute top-3 left-3 z-10 select-none rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow">
                Estimativa (great-circle){routeMeta.label ? ` • ${routeMeta.label}` : ""}
              </div>
            )}
            {planning && (origin || destination) && (
              <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[12px] text-slate-700 shadow">
                {origin ? `Origem: ${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}` : "Clique a origem…"}
                {destination ? ` • Destino: ${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}` : origin ? " • clique o destino…" : ""}
              </div>
            )}
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
