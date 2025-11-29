import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Sidebar2 from "../Components/Sidebar2";
import { apiFetch } from "../lib/api";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox as turfBbox } from "@turf/turf";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function waitForImages(m,ids,maxMs=2000){const t0=Date.now();while(Date.now()-t0<maxMs){const ok=ids.every(id=>m.hasImage?.(id));if(ok)return true;await sleep(50)}return false}
function topSymbolBeforeId(m){const layers=m.getStyle()?.layers||[];for(let i=layers.length-1;i>=0;i--){if(layers[i].type==="symbol")return layers[i].id}return layers.at(-1)?.id||undefined}
const SHIP_SVG=`<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(32,32)"><path d="M0,-22 L8,-6 L20,-2 L20,4 L8,8 L0,22 L-8,8 L-20,4 L-20,-2 L-8,-6 Z" fill="#2563eb" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/></g></svg>`;
const CONT_SVG=`<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="14" width="36" height="20" rx="4" fill="#3E41C0" stroke="#ffffff" stroke-width="2"/><line x1="12" y1="14" x2="12" y2="34" stroke="#ffffff" stroke-width="2"/><line x1="36" y1="14" x2="36" y2="34" stroke="#ffffff" stroke-width="2"/></svg>`;
async function loadSvgIcon(svgString){try{const blob=new Blob([svgString],{type:"image/svg+xml"});return await createImageBitmap(blob)}catch{return await new Promise((resolve,reject)=>{const img=new Image();const svg=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;img.crossOrigin="anonymous";img.onload=()=>{try{const c=document.createElement("canvas");c.width=img.width||64;c.height=img.height||64;const ctx=c.getContext("2d");ctx.drawImage(img,0,0);c.toBlob(b=>{if(!b)return reject(new Error("canvas toBlob failed"));createImageBitmap(b).then(resolve,reject)})}catch(e){reject(e)}};img.onerror=reject;img.src=svg})}}

function buildTrailForShip(positions,shipKey,limit=80){if(!positions?.features?.length||!shipKey)return null;const pts=positions.features.filter(f=>{const p=f?.properties;const k=p?.voyage_code||p?.ship_id||p?.imo;return k===shipKey&&f?.geometry?.coordinates}).sort((a,b)=>new Date(a?.properties?.ts_iso||0)-new Date(b?.properties?.ts_iso||0)).slice(-limit).map(f=>f.geometry.coordinates);if(pts.length<2)return null;return{type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"LineString",coordinates:pts},properties:{role:"trail",count:pts.length}}]}}

function Drawer({open,onClose,shipProps,containersForShip,onComplete,canComplete}) {
  if(!open)return null;
  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-20">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="text-azulEscuro font-semibold">Detalhes do Navio</div>
        <button onClick={onClose} className="text-[#5B61B3] hover:text-violeta transition">✕</button>
      </div>
      <div className="p-5 space-y-4">
        <div className="text-sm text-azulEscuro">
          <div><span className="font-semibold">Viagem:</span> {shipProps?.voyage_code||"—"}</div>
          <div><span className="font-semibold">IMO:</span> {shipProps?.imo||"—"}</div>
          <div><span className="font-semibold">Atualizado:</span> {shipProps?.ts_iso||"—"}</div>
        </div>
        <div className="text-sm text-azulEscuro">
          <div className="font-semibold mb-2">Contêineres a bordo</div>
          <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-[#ECF2F9]">
            {containersForShip.length===0?(
              <div className="p-4 text-[#5B61B3] text-sm">Nenhum contêiner listado</div>
            ):containersForShip.map(c=>(
              <div key={c.id} className="px-4 py-2 border-b last:border-b-0 text-[13px] flex justify-between">
                <span className="text-roxo">{c.id}</span>
                <span className="opacity-60">{c.voyage_code||c.imo||""}</span>
              </div>
            ))}
          </div>
        </div>
        {canComplete&&(
          <button onClick={onComplete} className="w-full h-11 rounded-xl bg-violeta text-white text-sm font-medium hover:bg-roxo transition">Completar viagem</button>
        )}
      </div>
    </div>
  )
}

function VoyageForm({ open, onClose, onCreated }) {
  const [ships, setShips] = useState([]);
  const [loadingShips, setLoadingShips] = useState(false);
  const [allContainers, setAllContainers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ship: null,
    voyage_code: "",
    departure_port: "",
    arrival_port: "",
    departure_date: "",
    arrival_date: "",
    selectedContainers: []
  });

  async function attachContainersWithFallback(voyageId, selectedIds) {
    if (!selectedIds?.length) return;

    const nowIso = new Date().toISOString();
    const items = selectedIds.map(id => ({
      container_id: String(id).trim(),
      loaded_at: nowIso,
    }));

    async function tryPost(body) {
      try {
        await apiFetch(`/api/v1/voyages/${voyageId}/containers`, {
          method: "POST",
          auth: true,
          body,
        });
        return true;
      } catch (e) {
        if (String(e?.message || "").toLowerCase().includes("bad request")) {
          return false;
        }
        throw e;
      }
    }

    if (await tryPost(items)) return;
    if (await tryPost({ items })) return;

    for (const it of items) {
      await apiFetch(`/api/v1/voyages/${voyageId}/containers`, {
        method: "POST",
        auth: true,
        body: it,
      });
    }
  }


  const containersByIMO = useMemo(() => {
  if (!form.ship) return [];
  const imo = String(form.ship?.imo || form.ship?.ship_imo || "").trim();

  return (allContainers || [])
    .map((c) => ({
      id: c.container_id || c.id || c.code || c.container || c.cntr_id,
      imo: String(c.imo || c.ship_imo || "").trim(),
      raw: c,
    }))
    .filter((c) => c.id && (!imo || c.imo === imo));
}, [allContainers, form.ship]);


  useEffect(()=>{
    (async()=>{
      setLoadingShips(true);
      try{
        const rows=await apiFetch(`/api/v1/ships`,{auth:true});
        setShips(rows||[])
      }catch{setShips([])}
      finally{setLoadingShips(false)}
    })();
    (async()=>{
      try{
        const list = await apiFetch(`/api/v1/containers`, { auth: true });
setAllContainers(
  Array.isArray(list) ? list :
  Array.isArray(list?.rows) ? list.rows :
  []
);

      }catch{setAllContainers([])}
    })();
  },[]);

  const canSubmit = useMemo(() => {
  const hasShip = Boolean(form.ship?.ship_id || form.ship?.imo);
  return (
    hasShip &&
    form.voyage_code.trim() &&
    form.departure_port.trim() &&
    form.arrival_port.trim() &&
    form.departure_date &&
    form.arrival_date
  );
}, [form]);


  async function handleSubmit(e) {
  e.preventDefault();
  setSaving(true);
  try {
    const body = {
  ship_id: form.ship?.ship_id ?? null,     // <- pega do navio selecionado
  ship_imo: form.ship?.imo ?? null,        // <- alternativa se quiser pelo IMO
  voyage_code: String(form.voyage_code || "").trim(),
  departure_port: String(form.departure_port || "").trim(),
  arrival_port: String(form.arrival_port || "").trim(),
  departure_date: form.departure_date ? new Date(form.departure_date).toISOString() : null,
  arrival_date: form.arrival_date ? new Date(form.arrival_date).toISOString() : null,
  origin_lat: typeof form.origin_lat === "number" ? form.origin_lat : null,
  origin_lng: typeof form.origin_lng === "number" ? form.origin_lng : null,
  dest_lat: typeof form.dest_lat === "number" ? form.dest_lat : null,
  dest_lng: typeof form.dest_lng === "number" ? form.dest_lng : null
};


    const created = await apiFetch(`/api/v1/voyages`, {
      method: "POST",
      body,
      auth: true
    });
    console.log("VIAGEM CRIADA:", created);

    // 2️⃣ ANEXA OS CONTÊINERES (com fallback)
    await attachContainersWithFallback(created.voyage_id, form.selectedContainers);

    // 3️⃣ CONFIRMA
    const confirm = await apiFetch(`/api/v1/voyages/${created.voyage_id}/containers`, {
      auth: true
    });

    console.log("[OK] Containers anexados:", confirm);

      
      await onCreated?.();
      onClose();

  } catch (err) {
    console.error("Erro ao criar viagem:", err);
  } finally {
    setSaving(false);
  }
}





  if(!open)return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 w-[95%] max-w-2xl z-10">
        <h2 className="text-2xl font-GT text-azulEscuro mb-6 text-center">Cadastrar uma Viagem</h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Navio</label>
              <Menu>
                <MenuButton className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violeta">
                  {form.ship?(`${form.ship.name||"Sem nome"}${form.ship.imo?` — ${form.ship.imo}`:""}`):"Selecione o navio"}
                  <svg className="w-6 h-6 text-violeta ml-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd"/></svg>
                </MenuButton>
                <MenuItems className="absolute mt-2 w-72 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10 max-h-60 overflow-y-auto">
                  {loadingShips&&<div className="px-4 py-2 text-sm text-azulEscuro">Carregando...</div>}
                  {!loadingShips&&ships.length===0&&<div className="px-4 py-2 text-sm text-azulEscuro">Nenhum navio</div>}
                  {!loadingShips&&ships.map(s=>(
                    <MenuItem key={s.ship_id}>
                      {({focus})=>(
                        <button type="button" onClick={()=>setForm(p=>({...p,ship:s}))} className={`w-full text-left px-4 py-2 text-sm rounded-xl ${focus?"bg-[#9F9CE8] text-white":"text-azulEscuro"}`}>
                          {s.name||"Sem nome"}{s.imo?` — ${s.imo}`:""}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Código da Viagem</label>
              <input type="text" value={form.voyage_code} onChange={e=>setForm(p=>({...p,voyage_code:e.target.value}))} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50" placeholder="Ex: BR-SANTOS-001"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Porto de Saída</label>
              <input type="text" value={form.departure_port} onChange={e=>setForm(p=>({...p,departure_port:e.target.value}))} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta" placeholder="Ex: Santos"/>
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Porto de Chegada</label>
              <input type="text" value={form.arrival_port} onChange={e=>setForm(p=>({...p,arrival_port:e.target.value}))} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta" placeholder="Ex: Roterdã"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Data de Saída</label>
              <input type="datetime-local" value={form.departure_date} onChange={e=>setForm(p=>({...p,departure_date:e.target.value}))} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta"/>
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Data de Chegada</label>
              <input type="datetime-local" value={form.arrival_date} onChange={e=>setForm(p=>({...p,arrival_date:e.target.value}))} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta"/>
            </div>
          </div>

          <div className="mb-6">
  <label className="block text-sm text-azulEscuro mb-2">Contêineres</label>

  {/* Torna o pai 'relative' para o dropdown absoluto ficar ancorado */}
  <div className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 flex items-center relative">
    <Menu>
      <MenuButton className="flex-1 text-left text-[13px] text-roxo focus:outline-none">
        {form.selectedContainers.length
          ? `${form.selectedContainers.length} selecionado(s)`
          : "Selecione contêiner(es) do navio"}
      </MenuButton>

      <MenuItems className="absolute mt-2 w-80 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10 max-h-72 overflow-y-auto">
        {(!form.ship || containersByIMO.length === 0) && (
          <div className="px-4 py-2 text-sm text-azulEscuro">
            Nenhum contêiner disponível para este navio
          </div>
        )}

        {containersByIMO.map((c) => (
          <MenuItem key={c.id}>
  {({ focus }) => {
    const cid = String(c.id).trim(); // ou c.container_id, se for esse o nome
    const checked = form.selectedContainers.includes(cid);
    return (
      <button
        type="button"
        onClick={() =>
          setForm((p) => ({
            ...p,
            selectedContainers: checked
              ? p.selectedContainers.filter((x) => x !== cid)
              : [...p.selectedContainers, cid],
          }))
        }
        className={`w-full text-left px-4 py-2 text-sm rounded-xl flex items-center justify-between ${
          focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
        }`}
      >
        <span>{cid}</span>
        <span
          className={`w-4 h-4 rounded border ${
            checked ? "bg-violeta border-violeta" : "border-[#9F9CE8]"
          }`}
        />
      </button>
    );
  }}
</MenuItem>

        ))}
      </MenuItems>
    </Menu>
  </div>
</div>


          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <button type="button" onClick={onClose} className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300">Voltar</button>
            <button
  type="submit"
  disabled={!canSubmit || saving}
  className="w-full sm:w-40 h-10 rounded-xl font-medium bg-violeta text-white text-[14px] hover:bg-roxo duration-300 disabled:opacity-60"
>
  {saving ? "Salvando..." : "Iniciar viagem"}
</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Viagens(){
  const mapRef=useRef(null);
  const map=useRef(null);
  const wsRef=useRef(null);
  const [positions,setPositions]=useState(null);
  const [ships,setShips]=useState(null);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [baseStyle,setBaseStyle]=useState((import.meta.env.VITE_MAP_BASE||"streets").toLowerCase()==="satellite"?"satellite":"streets");
  const [styleVersion,setStyleVersion]=useState(0);
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [drawerShipProps,setDrawerShipProps]=useState(null);
  const [containersForShip,setContainersForShip]=useState([]);
  const [showCreate,setShowCreate]=useState(false);

  const mapStyle=useMemo(()=>{
    const key=import.meta.env.VITE_MAPTILER_KEY;
    if(!key)return "https://demotiles.maplibre.org/style.json";
    return baseStyle==="satellite"?`https://api.maptiler.com/maps/hybrid/style.json?key=${key}`:`https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
  },[baseStyle]);

  const registerImagesAndOverlay=useCallback(async()=>{
    const m=map.current;if(!m)return;
    m.on?.("styleimagemissing",async e=>{
      try{
        if(e?.id==="ship-icon"){const ship=await loadSvgIcon(SHIP_SVG);m.addImage("ship-icon",ship,{pixelRatio:2})}
        if(e?.id==="cont-icon"){const cont=await loadSvgIcon(CONT_SVG);m.addImage("cont-icon",cont,{pixelRatio:2})}
      }catch(err){console.error(err)}
    });
    try{
      if(!m.hasImage?.("ship-icon")){const ship=await loadSvgIcon(SHIP_SVG);m.addImage("ship-icon",ship,{pixelRatio:2})}
      if(!m.hasImage?.("cont-icon")){const cont=await loadSvgIcon(CONT_SVG);m.addImage("cont-icon",cont,{pixelRatio:2})}
      const key=import.meta.env.VITE_MAPTILER_KEY;
      if(key&&!m.getSource("openseamap")){
        m.addSource("openseamap",{type:"raster",tiles:["https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"],tileSize:256,attribution:"MapTiler © OSM contributors, Seamarks © OpenSeaMap"});
        m.addLayer({id:"openseamap",type:"raster",source:"openseamap",paint:{"raster-opacity":0.8}},topSymbolBeforeId(m))
      }
    }catch(err){console.error(err)}
  },[]);

  useEffect(()=>{
    if(!mapRef.current)return;
    if(!map.current){
      const m=new maplibregl.Map({container:mapRef.current,style:mapStyle,center:[-48,-15],zoom:4,renderWorldCopies:false,maxBounds:new maplibregl.LngLatBounds([-179.99,-85],[179.99,85]),cooperativeGestures:true});
      map.current=m;
      m.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"top-right");
      m.once("load",async()=>{await registerImagesAndOverlay();m.resize()});
      const onWindowResize=()=>{try{map.current?.resize()}catch(err){console.error(err)}};
      window.addEventListener("resize",onWindowResize);
      return()=>{window.removeEventListener("resize",onWindowResize);try{map.current?.remove()}catch(err){console.error(err)};map.current=null}
    }else{
      const m=map.current;
      try{
        m.setStyle(mapStyle);
        m.once("load",async()=>{await registerImagesAndOverlay();setStyleVersion(v=>v+1);m.resize()})
      }catch(err){console.error(err)}
    }
  },[mapStyle,registerImagesAndOverlay]);

  const wsInit=useRef(false);
  useEffect(()=>{
    if(wsInit.current)return;
    wsInit.current=true;
    let alive=true;
    (async () => {
  try {
    const results = await Promise.allSettled([
      apiFetch("/api/v1/live/containers", { auth: true }),
      apiFetch("/api/v1/live/ships",      { auth: true }),
    ]);

    const cont = results[0].status === 'fulfilled' ? results[0].value : null;
    const sh   = results[1].status === 'fulfilled' ? results[1].value : null;

    if (cont) setPositions(cont);
    if (sh)   setShips(sh);     
  } catch (e) {
    console.error(e);
  } finally {
    if (alive) setLoading(false);
  }
})();

    const scheme=location.protocol==="https:"?"wss":"ws";
    const ws=new WebSocket(`${scheme}://${location.hostname}:3000/ws/positions`);
    wsRef.current=ws;
    ws.onmessage = (evt) => {
  try {
    const msg = JSON.parse(evt.data);
    if (msg?.type === "ships") {
      if (msg?.data?.features?.length) setShips(msg.data); 
    } else if (msg?.type === "containers") {
      setPositions(msg.data);
    }
  } catch (e) { console.error(e); }
};

    return()=>{alive=false;try{if(!wsRef.current)return;if(wsRef.current.readyState===WebSocket.OPEN){wsRef.current.close()}else if(wsRef.current.readyState===WebSocket.CONNECTING){wsRef.current.onopen=()=>wsRef.current?.close()}}catch(err){console.error(err)}}
  },[]);

  const filterExpr=useMemo(()=>{
    const term=q.trim().toLowerCase();
    if(!term)return["boolean",true];
    return["any",["in",["downcase",["get","container_id"]],["literal",[term]]],["in",["downcase",["get","voyage_code"]],["literal",[term]]],["in",["downcase",["get","imo"]],["literal",[term]]]]
  },[q]);

  const highlightShip=useCallback((shipFeature)=>{
    const m=map.current;if(!m||!shipFeature)return;
    const props=shipFeature.properties||{};
    const coords=shipFeature.geometry?.coordinates?.slice?.();if(!coords)return;
    try{m.easeTo({center:coords,zoom:8,duration:900,essential:true})}catch(err){console.error(err)}
    const shipKey=props.ship_key||props.voyage_code||props.ship_id||props.imo;
    const lineFC=buildTrailForShip(positions,shipKey,80);
    ["ship-trail-line","ship-trail-arrows","ship-trail-ends","ship-focus-ring"].forEach(id=>{try{if(m.getLayer(id))m.removeLayer(id)}catch(err){console.error(err)}});["ship-trail","ship-trail-ends","ship-focus"].forEach(sid=>{try{if(m.getSource(sid))m.removeSource(sid)}catch(err){console.error(err)}});
    try{
      const focusFC={type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:coords}}]};
      m.addSource("ship-focus",{type:"geojson",data:focusFC});
      m.addLayer({id:"ship-focus-ring",type:"circle",source:"ship-focus",paint:{"circle-radius":["interpolate",["linear"],["zoom"],3,10,10,22],"circle-color":"rgba(62,65,192,0.12)","circle-stroke-color":"#3E41C0","circle-stroke-width":2}})
    }catch(err){console.error(err)}
    if(!lineFC)return;
    try{
      m.addSource("ship-trail",{type:"geojson",data:lineFC});
      m.addLayer({id:"ship-trail-line",type:"line",source:"ship-trail",paint:{"line-color":"#1e90ff","line-width":3}});
      m.addLayer({id:"ship-trail-arrows",type:"symbol",source:"ship-trail",layout:{"symbol-placement":"line","symbol-spacing":60,"text-field":"▶","text-size":12,"text-allow-overlap":true},paint:{"text-color":"#1e90ff","text-halo-color":"#ffffff","text-halo-width":1}});
      const coordsL=lineFC.features[0].geometry.coordinates;
      const endsFC={type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:coordsL[0]},properties:{role:"start"}},{type:"Feature",geometry:{type:"Point",coordinates:coordsL[coordsL.length-1]},properties:{role:"end"}}]};
      m.addSource("ship-trail-ends",{type:"geojson",data:endsFC});
      m.addLayer({id:"ship-trail-ends",type:"circle",source:"ship-trail-ends",paint:{"circle-radius":6,"circle-color":["case",["==",["get","role"],"start"],"#22c55e","#ef4444"],"circle-stroke-width":2,"circle-stroke-color":"#ffffff"}});
      try{const b=turfBbox(lineFC);if(Number.isFinite(b[0]))m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:48,duration:800,maxZoom:9})}catch(err){console.error(err)}
    }catch(err){console.error(err)}
  },[positions]);

  useEffect(()=>{
    const m=map.current;if(!m)return;
    const contSrc="containers";const shipSrc="ships";
    const ensure=async()=>{
      if(positions){
        if(m.getSource(contSrc)){try{m.getSource(contSrc).setData(positions)}catch(err){console.error(err)}}else{
          try{
            m.addSource(contSrc,{type:"geojson",data:positions,cluster:true,clusterMaxZoom:12,clusterRadius:50});
            await waitForImages(m,["ship-icon","cont-icon"]);
            const beforeId=topSymbolBeforeId(m);
            m.addLayer({id:"containers-unclustered",type:"symbol",source:contSrc,filter:["!",["has","point_count"]],layout:{"icon-image":"cont-icon","icon-size":0.9,"icon-allow-overlap":true}},beforeId);
            m.addLayer({id:"containers-clusters",type:"circle",source:contSrc,filter:["has","point_count"],paint:{"circle-color":["step",["get","point_count"],"#8da2fb",50,"#4f46e5",200,"#1e1b4b"],"circle-radius":["step",["get","point_count"],16,50,22,200,30]}},beforeId);
            m.addLayer({id:"containers-count",type:"symbol",source:contSrc,filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":12},paint:{"text-color":"#ffffff"}},beforeId);
            m.on("click","containers-unclustered",(e)=>{const f=e.features?.[0];if(!f)return;const p=f.properties||{};const coords=f.geometry.coordinates.slice();try{new maplibregl.Popup().setLngLat(coords).setHTML(`<div style="font-size:12px"><div><b>Container:</b> ${p.container_id||"—"}</div><div><b>Viagem:</b> ${p.voyage_code||"—"}</div><div><b>IMO:</b> ${p.imo||"—"}</div><div><b>Atualizado:</b> ${p.ts_iso||"—"}</div></div>`).addTo(m)}catch(err){console.error(err)}});
            m.on("click","containers-clusters",(e)=>{try{const features=m.queryRenderedFeatures(e.point,{layers:["containers-clusters"]});const clusterId=features[0].properties.cluster_id;m.getSource(contSrc).getClusterExpansionZoom(clusterId,(err,zoom)=>{if(err)return;m.easeTo({center:features[0].geometry.coordinates,zoom})})}catch(err){console.error(err)}});
          }catch(err){console.error(err)}
        }
        try{if(m.getLayer("containers-unclustered")){m.setFilter("containers-unclustered",["all",["!",["has","point_count"]],filterExpr])}}catch(err){console.error(err)}
      }

      if(ships){
        if(m.getSource(shipSrc)){try{m.getSource(shipSrc).setData(ships)}catch(err){console.error(err)}}else{
          try{
            m.addSource(shipSrc,{type:"geojson",data:ships});
            const beforeId=topSymbolBeforeId(m);
            const hasIcon=typeof m.hasImage==="function"?m.hasImage("ship-icon"):true;
            if(hasIcon){
              m.addLayer({id:"ships-layer",type:"symbol",source:shipSrc,layout:{"icon-image":"ship-icon","icon-size":["interpolate",["linear"],["zoom"],3,0.8,10,1.15],"icon-allow-overlap":true,"icon-ignore-placement":true,"icon-rotate":["coalesce",["get","course"],0],"icon-rotation-alignment":"map","text-field":["coalesce",["get","ship_label"],["get","voyage_code"],"Ship"],"text-offset":[0,1.2],"text-size":12,"text-anchor":"top"},paint:{"text-color":"#0f172a","text-halo-color":"#ffffff","text-halo-width":1}},beforeId)
            }else{
              m.addLayer({id:"ships-layer-fallback",type:"circle",source:shipSrc,paint:{"circle-radius":["interpolate",["linear"],["zoom"],3,4,10,7],"circle-color":"#0ea5e9","circle-stroke-color":"#ffffff","circle-stroke-width":1.5}},beforeId)
            }
            const shipLayerId=m.getLayer("ships-layer")?"ships-layer":"ships-layer-fallback";
            m.on("click", shipLayerId, async (e) => {
              const f=e.features?.[0];if(!f)return;
              highlightShip(f);
              const props=f.properties||{};
              let conts = [];
   try {
     if (props.voyage_id) {
       const resp = await apiFetch(`/api/v1/voyages/${props.voyage_id}/containers`, { auth: true });
       // normaliza array
       const rows = Array.isArray(resp) ? resp : (Array.isArray(resp?.rows) ? resp.rows : []);
       conts = rows.map(r => ({
         id: r.container_id || r.id || r.code || r.container || r.cntr_id,
         voyage_code: r.voyage_code || props.voyage_code,
         imo: r.imo || props.imo
       }));
     }
   } catch (err) {
     console.error("Falha ao buscar contêineres da viagem:", err);
   }
   // 2) Se não achar nada, cai no fallback das posições (caso existam)
   if (!conts.length && positions?.features?.length) {
     const shipKey = props.ship_key || props.voyage_code || props.ship_id || props.imo;
     conts = positions.features
       .filter(cf => {
         const p = cf.properties || {};
         const k = p.voyage_code || p.ship_id || p.imo;
         return k === shipKey;
       })
       .map(cf => ({
         id: cf.properties?.container_id,
         imo: cf.properties?.imo,
         voyage_code: cf.properties?.voyage_code
       }));
   }
   setContainersForShip(conts);
              setDrawerShipProps(props);
              setDrawerOpen(true);
              try{
                const coords=f.geometry.coordinates.slice();
                new maplibregl.Popup().setLngLat(coords).setHTML(`<div style="font-size:12px"><div><b>Viagem:</b> ${props.voyage_code??"—"}</div><div><b>Contêineres a bordo:</b> ${conts.length}</div><div><b>Atualizado:</b> ${props.ts_iso||"—"}</div></div>`).addTo(m)
              }catch(err){console.error(err)}
            });
            m.on("mouseenter",shipLayerId,()=>{m.getCanvas().style.cursor="pointer"});
            m.on("mouseleave",shipLayerId,()=>{m.getCanvas().style.cursor=""});
            m.on("click",(ev)=>{try{const layersToCheck=[m.getLayer("ships-layer")?"ships-layer":"ships-layer-fallback","containers-unclustered","containers-clusters"].filter(Boolean);const feats=m.queryRenderedFeatures(ev.point,{layers:layersToCheck});if(!feats.length){["ship-trail","ship-trail-ends","ship-focus"].forEach((sid)=>{try{if(m.getSource(sid)){if(sid==="ship-trail"&&m.getLayer("ship-trail-line"))m.removeLayer("ship-trail-line");if(sid==="ship-trail"&&m.getLayer("ship-trail-arrows"))m.removeLayer("ship-trail-arrows");if(sid==="ship-trail-ends"&&m.getLayer("ship-trail-ends"))m.removeLayer("ship-trail-ends");if(sid==="ship-focus"&&m.getLayer("ship-focus-ring"))m.removeLayer("ship-focus-ring");m.removeSource(sid)}}catch(err){console.error(err)}});setDrawerOpen(false)}}catch(err){console.error(err)}});

          }catch(err){console.error(err)}
        }
      }

      if(!ships?.features?.length&&positions?.features?.length){
        try{const b=turfBbox(positions);if(Number.isFinite(b[0]))m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:40,duration:700,maxZoom:6})}catch(err){console.error(err)}
      }else if(ships?.features?.length){
        try{const b=turfBbox(ships);if(Number.isFinite(b[0]))m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:40,duration:700,maxZoom:6})}catch(err){console.error(err)}
      }
    };
    if(m.isStyleLoaded())ensure();else m.once("load",ensure);
    const onErr=(ev)=>console.error("Map error:",ev?.error||ev);
    m.on("error",onErr);
    return()=>m.off("error",onErr)
  },[positions,ships,filterExpr,styleVersion,highlightShip]);

  const hasVoyages=useMemo(()=>{
    const list=ships?.features||[];
    return list.some(f=>f?.properties?.voyage_code)
  },[ships]);

  const handleComplete=useCallback(async()=>{
    const id=drawerShipProps?.voyage_id;
    if(!id){alert("Sem voyage_id disponível para completar.");return}
    try{await apiFetch(`/api/v1/voyages/${id}/complete`, { method:"POST", body:{}, auth:true });

     const code = drawerShipProps?.voyage_code;
     // 1) some do mapa imediatamente (antes de chegar WS)
     setShips(prev => {
       if(!prev?.features) return prev;
       return {
         ...prev,
         features: prev.features.filter(f => {
           const p = f.properties||{};
           return p.voyage_id !== id && p.voyage_code !== code;
         })
       };
     });
     setPositions(prev => {
       if(!prev?.features) return prev;
       return {
         ...prev,
         features: prev.features.filter(f => {
           const p = f.properties||{};
           return p.voyage_id !== id && p.voyage_code !== code;
         })
       };
     });

     // 2) limpa camadas auxiliares (trail/focus)
     const m = map.current;
     if (m) {
       ["ship-trail-line","ship-trail-arrows","ship-trail-ends","ship-focus-ring"].forEach(id=>{
         try{ if(m.getLayer(id)) m.removeLayer(id) }catch{}
       });
       ["ship-trail","ship-trail-ends","ship-focus"].forEach(sid=>{
         try{ if(m.getSource(sid)) m.removeSource(sid) }catch{}
       });
     }

     setDrawerOpen(false);}catch(e){alert(e?.message||"Falha ao completar viagem")}
  },[drawerShipProps]);

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className="flex flex-col w-full md:w-[96%] mt-8 mb-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 max-[760px]:mt-14">
          <div className="flex gap-2 w-full flex-wrap justify-center">
            <input type="text" placeholder="Filtrar por contêiner, viagem ou IMO" value={q} onChange={(e)=>setQ(e.target.value)} className="h-12 rounded-3xl bg-white px-4 text-sm focus:outline-none flex-grow min-w-[200px]"/>
            <select value={baseStyle} onChange={(e)=>setBaseStyle(e.target.value)} className="h-12 rounded-3xl text-azulEscuro bg-white px-10 text-sm focus:outline-none cursor-pointer" title="Tipo de mapa">
              <option value="streets">Ruas</option>
              <option value="satellite">Satélite</option>
            </select>
            <button type="button" onClick={()=>setShowCreate(true)} className="h-12 rounded-3xl px-6 text-sm font-regular flex items-center justify-center gap-2 bg-violeta text-white hover:bg-roxo">Cadastrar viagem</button>
          </div>
        </div>

        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6 h-full relative">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">Mapa</h1>
           
          </div>

          <div className="w-full h-[70vh] rounded-2xl overflow-hidden relative">
            {!hasVoyages&&(
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur">
                <div className="bg-white rounded-3xl p-6 sm:p-8 w-[95%] max-w-xl text-center shadow-xl">
                  <h3 className="text-xl font-semibold text-azulEscuro mb-2">Você ainda não tem viagens cadastradas</h3>
                  <p className="text-sm text-[#5B61B3] mb-5">Cadastre uma viagem para começar a visualizar seus navios e contêineres no mapa.</p>
                  <button onClick={()=>setShowCreate(true)} className="h-11 rounded-xl px-6 text-sm font-medium bg-violeta text-white hover:bg-roxo">Cadastrar viagem</button>
                </div>
              </div>
            )}
            <div ref={mapRef} style={{ width:"100%", height:"100%" }}/>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={()=>setDrawerOpen(false)}
        shipProps={drawerShipProps}
        containersForShip={containersForShip}
        canComplete={Boolean(drawerShipProps?.voyage_id)}
        onComplete={handleComplete}
      />
     <VoyageForm
  open={showCreate}
  onClose={() => setShowCreate(false)}
  onCreated={async () => {
    try {
      const [cont, sh] = await Promise.all([
  apiFetch("/api/v1/live/containers", { auth: true }),
  apiFetch("/api/v1/live/ships",      { auth: true }),
]);
      setPositions(cont);
      setShips(sh);
    } catch (err) {
      console.error(err);
    }
  }}
/>


    </div>
  )
}
