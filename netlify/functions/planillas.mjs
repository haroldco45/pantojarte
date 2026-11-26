// Pantojarte · Planilla Diaria — guarda las planillas en la nube de Netlify (Netlify Blobs)
// Clave opcional: si en Netlify se pone la variable APP_PIN, solo entra quien la sepa.
import { getStore } from "@netlify/blobs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-pin",
  "access-control-max-age": "86400"
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;
const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ID = /^[A-Za-z0-9_-]{6,40}$/;

const months = (from, to) => {
  const out = []; let [y, m] = from.split("-").map(Number); const [ty, tm] = to.split("-").map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < 60) { out.push(`${y}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; y++ } }
  return out;
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const pin = process.env.APP_PIN || "";
  if (pin && (req.headers.get("x-pin") || "") !== pin) return json({ needPin: true }, 401);

  const store = getStore("pantojarte");
  const key = ym => `m/${ym}`;

  if (req.method === "GET") {
    const q = new URL(req.url).searchParams;
    const from = q.get("from") || "", to = q.get("to") || "";
    if (!YM.test(from) || !YM.test(to) || from > to) return json({ error: "Rango inválido" }, 400);
    const planillas = [];
    await Promise.all(months(from, to).map(async ym => {
      const mes = await store.get(key(ym), { type: "json" });
      if (mes) planillas.push(...Object.values(mes));
    }));
    const catalogo = (await store.get("catalogo", { type: "json" })) || null;
    return json({ planillas, catalogo, from, to });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Datos inválidos" }, 400); }
    if (!body || typeof body !== "object") return json({ error: "Datos inválidos" }, 400);

    if (body.check) return json({ ok: true });

    // Listas de productos y tipos de gasto
    if (body.catalogo) {
      const c = body.catalogo;
      const clean = a => Array.isArray(a) ? [...new Set(a.map(x => String(x).trim().slice(0, 60)).filter(Boolean))].slice(0, 300) : [];
      const cat = { productos: clean(c.productos), gastos: clean(c.gastos), updatedAt: Date.now() };
      await store.setJSON("catalogo", cat);
      return json({ ok: true, updatedAt: cat.updatedAt });
    }

    if (body.del) {
      if (!ID.test(String(body.del)) || !FECHA.test(String(body.fecha))) return json({ error: "Datos inválidos" }, 400);
      const k = key(body.fecha.slice(0, 7));
      const mes = (await store.get(k, { type: "json" })) || {};
      delete mes[body.del];
      await store.setJSON(k, mes);
      return json({ ok: true });
    }

    const p = body.planilla;
    if (!p || typeof p !== "object" || !ID.test(String(p.id)) || !FECHA.test(String(p.fecha))) return json({ error: "Datos inválidos" }, 400);
    if (JSON.stringify(p).length > 80000) return json({ error: "Planilla demasiado grande" }, 413);
    const clean = { ...p, updatedAt: Date.now() };
    for (const f of Object.keys(clean)) if (f.startsWith("_")) delete clean[f];

    const ym = p.fecha.slice(0, 7);
    const prev = FECHA.test(String(body.prevFecha || "")) ? body.prevFecha.slice(0, 7) : ym;
    if (prev !== ym) {
      const old = await store.get(key(prev), { type: "json" });
      if (old && old[p.id]) { delete old[p.id]; await store.setJSON(key(prev), old); }
    }
    const mes = (await store.get(key(ym), { type: "json" })) || {};
    if (!clean.createdAt) clean.createdAt = mes[p.id]?.createdAt || clean.updatedAt;
    mes[p.id] = clean;
    await store.setJSON(key(ym), mes);
    return json({ ok: true, updatedAt: clean.updatedAt, createdAt: clean.createdAt });
  }

  return json({ error: "Método no permitido" }, 405);
};

export const config = { path: "/api/planillas" };
