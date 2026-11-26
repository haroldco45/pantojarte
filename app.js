/* Pantojarte · Planilla Diaria — Vibras Positivas HM */
const SITE = 'https://pantojarte.netlify.app/';
const ON_NETLIFY = /netlify\.app$/.test(location.hostname) || location.hostname === 'localhost';
const API = ON_NETLIFY ? '/api/planillas' : SITE + 'api/planillas';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch (e) { return false } },
  del(k) { try { localStorage.removeItem(k) } catch (e) {} }
};

const GASTOS_BASE = ['Arriendo', 'Servicios públicos', 'Gas', 'Nómina y pagos al personal', 'Transporte y fletes', 'Domicilios', 'Empaques y bolsas', 'Aseo y limpieza', 'Mantenimiento y reparaciones', 'Impuestos y trámites', 'Papelería', 'Publicidad', 'Alimentación del personal', 'Otros'];
const PRODUCTOS_BASE = ['Harina', 'Azúcar', 'Huevos', 'Mantequilla', 'Margarina', 'Leche', 'Queso', 'Levadura', 'Aceite', 'Sal', 'Chocolate', 'Crema de leche', 'Arequipe', 'Bocadillo', 'Frutas', 'Gaseosas', 'Jugos', 'Café', 'Desechables'];

let lang = LS.get('pj_lang', 'es');
let pin = LS.get('pj_pin', '');
let db = LS.get('pj_db', {});
let cat = LS.get('pj_cat', { productos: PRODUCTOS_BASE.slice(), gastos: GASTOS_BASE.slice(), updatedAt: 0, _dirty: false });
let wa = LS.get('pj_wa', '');
let lastSync = LS.get('pj_sync', 0);
let online = false;
const loaded = new Set();
let busy = false;

const st = { tab: 'pl', showMonths: 2, panel: null, id: null, draft: null, prevFecha: null,
  rep: { per: 'm', anchor: '', from: '', to: '', item: 'all' } };

/* ---------- Textos (español / inglés) ---------- */
const T = {
 es: {
  small: 'Planilla diaria', sub: 'Compras · Gastos operacionales · Cierre · Informes', update: 'Actualizar',
  tabPl: 'Planillas', tabInf: 'Informes', tabAj: 'Listas y ajustes',
  syncOk: 'En la nube · actualizado {h}', syncOff: 'Guardando en este celular', pend: '{n} sin subir',
  ventaHoy: 'Venta de hoy', ventaMes: 'Venta del mes', comprasMes: 'Compras del mes', gastosMes: 'Gastos del mes', efDisp: 'Efectivo disponible',
  sinPlanilla: 'sin planilla', ultima: 'última planilla', nPl: '{n} planillas',
  nuevaHoy: 'Hacer la planilla de hoy', abrirHoy: 'Ver la planilla de hoy', nueva: 'Nueva planilla', ult14: 'Venta de los últimos 14 días',
  verMas: 'Ver meses anteriores', wT: 'La planilla de papel, ahora en el celular', wP: 'Es la misma hoja de Pantojarte: compras, gastos operacionales y el cierre del día y de la noche. La app suma sola, guarda todo y saca los informes.',
  s1: 'Toque «Hacer la planilla de hoy».', s2: 'Escriba las compras y los gastos; el tipo de gasto se escoge con la flechita.', s3: 'Llene el cierre y guarde. Los informes salen solos.',
  vacio: 'Todavía no hay planillas.',
  // planilla
  planilla: 'Planilla diaria', fecha: 'Fecha', compras: 'Compras', productos: 'Productos', producto: 'Producto', valor: 'Valor',
  gastosOp: 'Gastos operacionales', gasto: 'Gasto', tipo: 'Tipo de gasto', detalle: 'Detalle (opcional)', otros: 'Otros gastos',
  addCompra: 'Agregar compra', addGasto: 'Agregar gasto', quitar: 'Quitar', nuevoTipo: 'Agregar otro tipo de gasto…', escoja: 'Escoja el gasto',
  tCompras: 'Total compras', tGastos: 'Total gastos operacionales', tOtros: 'Total otros gastos',
  cierre: 'Cierre', noche: 'Turno de la noche', dia: 'Turno del día',
  subtotal: 'Sub total', subN: 'Compras + gastos operacionales + otros gastos',
  egNoc: 'Total egreso nocturno', efNoc: 'Efectivo', realNoc: 'Total realizado nocturno', realNocN: 'Egreso nocturno + efectivo',
  egDia: 'Egreso del día', egDiaN: 'Sub total − egreso nocturno (puede cambiarlo)', efDia: 'Efectivo día', realDia: 'Realizado día', realDiaN: 'Egreso del día + efectivo día',
  saldoAnt: 'Saldo anterior', saldoAntN: 'El efectivo disponible de la planilla anterior', traer: 'Traer de la planilla anterior',
  efDispL: 'Efectivo disponible', efDispN: 'Saldo anterior + efectivo noche + efectivo día', ventaTotal: 'Venta total del día', ventaTotalN: 'Realizado nocturno + realizado día',
  nota: 'Nota', auto: 'Automático', guardar: 'Guardar', cancelar: 'Cancelar', editar: 'Editar', imprimir: 'Imprimir', whatsapp: 'WhatsApp', excel: 'Excel', eliminar: 'Eliminar', volver: 'Volver', cerrar: 'Cerrar',
  saved: 'Planilla guardada', savedOff: 'Guardada en este celular. Se sube sola cuando haya internet.',
  yaExiste: 'Ya hay una planilla del {d}. ¿Quiere abrirla en vez de hacer otra?', abrir: 'Abrir', hacerOtra: 'Hacer otra',
  delQ: '¿Eliminar la planilla del {d}? No se puede deshacer.', delOk: 'Planilla eliminada',
  sinPrev: 'No hay una planilla anterior.', traido: 'Saldo traído de la planilla del {d}', salir: '¿Salir sin guardar los cambios?', salirSi: 'Salir sin guardar',
  needFecha: 'Escriba la fecha.', vacia: 'La planilla está vacía. Escriba al menos una compra, un gasto o el efectivo.',
  // informes
  hoy: 'Hoy', semana: 'Semana', mes: 'Mes', anio: 'Año', rango: 'Escoger días', desde: 'Desde', hasta: 'Hasta', ant: '‹ Anterior', sig: 'Siguiente ›',
  ver: 'Qué quiere ver', resumen: 'Resumen general', gTodas: 'Compras (todas)', gGastos: 'Gastos operacionales (todos)', gOtros: 'Otros gastos (todos)',
  oCompras: 'Una compra en particular', oGastos: 'Un tipo de gasto en particular', oCierre: 'Del cierre',
  total: 'Total', promedio: 'Promedio por día', dias: 'Días con planilla', mayor: 'Día más alto', veces: 'Veces', pct: '%',
  porDia: 'Día por día', porMes: 'Mes por mes', porItem: 'Por rubro', topCompras: 'En qué se compró más', topGastos: 'En qué se gastó más',
  sinDatos: 'No hay planillas en estas fechas.', diaCol: 'Día', mesCol: 'Mes', informe: 'Informe', cargando: 'Trayendo planillas…',
  // listas y ajustes
  listaG: 'Tipos de gasto', listaGN: 'Son las opciones de la flechita en los gastos operacionales.', listaP: 'Productos que se compran', listaPN: 'Salen como sugerencia al escribir una compra; también puede escribir uno nuevo.',
  agregar: 'Agregar', renombrar: 'Cambiar', nombreNuevo: 'Nombre', nuevoG: 'Nuevo tipo de gasto', nuevoP: 'Nuevo producto', yaEsta: 'Ya está en la lista',
  quitarQ: '¿Quitar «{x}» de la lista? Las planillas viejas no cambian.',
  ajustes: 'Ajustes', idioma: 'Idioma', waDueno: 'WhatsApp del dueño', waDuenoN: 'A ese número se mandan las planillas e informes. Si lo deja vacío, WhatsApp le pregunta a quién.',
  clave: 'Clave de la app', claveN: 'Si la app pide clave, escríbala aquí.', guardado: 'Guardado',
  respaldo: 'Respaldo', respN: 'Descargue una copia de todas las planillas guardadas en este celular o súbala de nuevo.', bajar: 'Descargar copia', subir: 'Subir copia', subido: 'Copia cargada: {n} planillas',
  instalar: 'Instalar en el celular', instN: 'En Chrome toque los tres puntos y «Agregar a la pantalla principal». Queda como una app más.',
  pinT: 'Clave de Pantojarte', pinP: 'Escriba la clave que le dio el dueño.', pinMal: 'Clave incorrecta',
  hecho: 'App hecha por', ofrece: '¿Quiere una app así para su negocio?'
 },
 en: {
  small: 'Daily sheet', sub: 'Purchases · Operating expenses · Closing · Reports', update: 'Refresh',
  tabPl: 'Sheets', tabInf: 'Reports', tabAj: 'Lists & settings',
  syncOk: 'In the cloud · updated {h}', syncOff: 'Saving on this phone', pend: '{n} not uploaded',
  ventaHoy: 'Today\'s sales', ventaMes: 'Sales this month', comprasMes: 'Purchases this month', gastosMes: 'Expenses this month', efDisp: 'Cash available',
  sinPlanilla: 'no sheet', ultima: 'last sheet', nPl: '{n} sheets',
  nuevaHoy: 'Fill in today\'s sheet', abrirHoy: 'See today\'s sheet', nueva: 'New sheet', ult14: 'Sales, last 14 days',
  verMas: 'Show earlier months', wT: 'The paper sheet, now on your phone', wP: 'It is the same Pantojarte sheet: purchases, operating expenses and the day and night closing. The app adds everything up, saves it and builds the reports.',
  s1: 'Tap «Fill in today\'s sheet».', s2: 'Type the purchases and expenses; pick the expense type with the arrow.', s3: 'Fill in the closing and save. Reports are ready.',
  vacio: 'No sheets yet.',
  planilla: 'Daily sheet', fecha: 'Date', compras: 'Purchases', productos: 'Products', producto: 'Product', valor: 'Amount',
  gastosOp: 'Operating expenses', gasto: 'Expense', tipo: 'Expense type', detalle: 'Detail (optional)', otros: 'Other expenses',
  addCompra: 'Add purchase', addGasto: 'Add expense', quitar: 'Remove', nuevoTipo: 'Add another expense type…', escoja: 'Pick the expense',
  tCompras: 'Total purchases', tGastos: 'Total operating expenses', tOtros: 'Total other expenses',
  cierre: 'Closing', noche: 'Night shift', dia: 'Day shift',
  subtotal: 'Subtotal', subN: 'Purchases + operating expenses + other expenses',
  egNoc: 'Total night outflow', efNoc: 'Cash', realNoc: 'Total night takings', realNocN: 'Night outflow + cash',
  egDia: 'Day outflow', egDiaN: 'Subtotal − night outflow (you can change it)', efDia: 'Day cash', realDia: 'Day takings', realDiaN: 'Day outflow + day cash',
  saldoAnt: 'Previous balance', saldoAntN: 'Cash available on the previous sheet', traer: 'Bring from previous sheet',
  efDispL: 'Cash available', efDispN: 'Previous balance + night cash + day cash', ventaTotal: 'Total sales of the day', ventaTotalN: 'Night takings + day takings',
  nota: 'Note', auto: 'Automatic', guardar: 'Save', cancelar: 'Cancel', editar: 'Edit', imprimir: 'Print', whatsapp: 'WhatsApp', excel: 'Excel', eliminar: 'Delete', volver: 'Back', cerrar: 'Close',
  saved: 'Sheet saved', savedOff: 'Saved on this phone. It uploads by itself when there is internet.',
  yaExiste: 'There is already a sheet for {d}. Open it instead of making another?', abrir: 'Open', hacerOtra: 'Make another',
  delQ: 'Delete the sheet of {d}? This cannot be undone.', delOk: 'Sheet deleted',
  sinPrev: 'There is no previous sheet.', traido: 'Balance brought from the sheet of {d}', salir: 'Leave without saving changes?', salirSi: 'Leave without saving',
  needFecha: 'Type the date.', vacia: 'The sheet is empty. Type at least one purchase, expense or cash amount.',
  hoy: 'Today', semana: 'Week', mes: 'Month', anio: 'Year', rango: 'Pick days', desde: 'From', hasta: 'To', ant: '‹ Previous', sig: 'Next ›',
  ver: 'What to see', resumen: 'General summary', gTodas: 'Purchases (all)', gGastos: 'Operating expenses (all)', gOtros: 'Other expenses (all)',
  oCompras: 'One purchase item', oGastos: 'One expense type', oCierre: 'From the closing',
  total: 'Total', promedio: 'Daily average', dias: 'Days with sheet', mayor: 'Highest day', veces: 'Times', pct: '%',
  porDia: 'Day by day', porMes: 'Month by month', porItem: 'By item', topCompras: 'Biggest purchases', topGastos: 'Biggest expenses',
  sinDatos: 'No sheets on these dates.', diaCol: 'Day', mesCol: 'Month', informe: 'Report', cargando: 'Loading sheets…',
  listaG: 'Expense types', listaGN: 'These are the arrow options in operating expenses.', listaP: 'Products bought', listaPN: 'Suggested while typing a purchase; you can also type a new one.',
  agregar: 'Add', renombrar: 'Rename', nombreNuevo: 'Name', nuevoG: 'New expense type', nuevoP: 'New product', yaEsta: 'Already on the list',
  quitarQ: 'Remove «{x}» from the list? Old sheets do not change.',
  ajustes: 'Settings', idioma: 'Language', waDueno: 'Owner\'s WhatsApp', waDuenoN: 'Sheets and reports are sent to this number. Leave it empty and WhatsApp asks who to send to.',
  clave: 'App password', claveN: 'If the app asks for a password, type it here.', guardado: 'Saved',
  respaldo: 'Backup', respN: 'Download a copy of all sheets saved on this phone, or upload it again.', bajar: 'Download copy', subir: 'Upload copy', subido: 'Copy loaded: {n} sheets',
  instalar: 'Install on the phone', instN: 'In Chrome tap the three dots and «Add to Home screen». It becomes one more app.',
  pinT: 'Pantojarte password', pinP: 'Type the password the owner gave you.', pinMal: 'Wrong password',
  hecho: 'App made by', ofrece: 'Want an app like this for your business?'
 }
};
const t = (k, v) => { let s = (T[lang] && T[lang][k]) || T.es[k] || k; if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s };

/* ---------- Utilidades ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { if (typeof v === 'number') return isFinite(v) ? v : 0; const d = String(v ?? '').replace(/[^\d-]/g, ''); return d && d !== '-' ? parseInt(d, 10) : 0 };
const fmtN = n => Math.round(num(n)).toLocaleString('es-CO');
const money = n => '$ ' + fmtN(n);
const loc = () => lang === 'en' ? 'en-US' : 'es-CO';
// Hora real de Colombia (UTC-5)
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const toD = s => new Date(s + 'T12:00:00');
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addD = (s, n) => { const d = toD(s); d.setDate(d.getDate() + n); return iso(d) };
const addM = (ym, n) => { let [y, m] = ym.split('-').map(Number); m += n; while (m > 12) { m -= 12; y++ } while (m < 1) { m += 12; y-- } return y + '-' + String(m).padStart(2, '0') };
const fLarga = s => { const x = toD(s).toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return x.charAt(0).toUpperCase() + x.slice(1) };
const fCorta = s => toD(s).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
const mesNom = ym => { const x = toD(ym + '-15').toLocaleDateString(loc(), { month: 'long', year: 'numeric' }); return x.charAt(0).toUpperCase() + x.slice(1) };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const horaCol = ts => new Date(ts).toLocaleTimeString(loc(), { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' });

function toast(m) { const e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 3000) }

// Ventana propia para preguntar (sin alertas del navegador)
function ask({ title, text = '', input = null, ok = t('guardar'), cancel = t('cancelar'), danger = false }) {
  return new Promise(res => {
    const b = $('#dlgBox');
    b.innerHTML = `<h3>${esc(title)}</h3>${text ? `<p class="muted" style="margin-bottom:12px">${esc(text)}</p>` : ''}
      ${input !== null ? `<input class="inp" id="dlgIn" value="${esc(input)}" style="margin-bottom:12px">` : ''}
      <div class="row" style="justify-content:flex-end"><button class="btn b-line b-sm" id="dlgNo">${esc(cancel)}</button><button class="btn ${danger ? 'b-bad' : 'b-main'} b-sm" id="dlgOk">${esc(ok)}</button></div>`;
    $('#dlg').classList.add('open');
    const inp = $('#dlgIn'); if (inp) setTimeout(() => inp.focus(), 50);
    const close = v => { $('#dlg').classList.remove('open'); res(v) };
    $('#dlgNo').onclick = () => close(null);
    $('#dlgOk').onclick = () => close(inp ? inp.value.trim() : true);
    if (inp) inp.onkeydown = e => { if (e.key === 'Enter') close(inp.value.trim()) };
  });
}

/* ---------- Cuentas de la planilla ---------- */
function calc(p) {
  const compras = (p.compras || []).reduce((s, r) => s + num(r.v), 0);
  const gastos = (p.gastos || []).reduce((s, r) => s + num(r.v), 0);
  const otros = (p.gastos || []).reduce((s, r) => s + num(r.og), 0);
  const sub = compras + gastos + otros;
  const egNoc = num(p.egNoc), efNoc = num(p.efNoc), realNoc = egNoc + efNoc;
  const egDiaAuto = sub - egNoc;
  const egDia = (p.egDia === null || p.egDia === undefined || p.egDia === '') ? egDiaAuto : num(p.egDia);
  const efDia = num(p.efDia), realDia = egDia + efDia;
  const saldoAnt = num(p.saldoAnt), efDisp = saldoAnt + efNoc + efDia;
  return { compras, gastos, otros, sub, egNoc, efNoc, realNoc, egDiaAuto, egDia, efDia, realDia, saldoAnt, efDisp, venta: realNoc + realDia };
}
const byDate = (a, b) => (b.fecha + String(b.createdAt || 0).padStart(15, '0')).localeCompare(a.fecha + String(a.createdAt || 0).padStart(15, '0'));
const planillas = () => Object.values(db).sort(byDate);
const saveDb = () => LS.set('pj_db', db);
const saveCat = () => LS.set('pj_cat', cat);
function prevOf(fecha, id, createdAt) {
  return Object.values(db).filter(p => p.id !== id && (p.fecha < fecha || (p.fecha === fecha && (p.createdAt || 0) < (createdAt || Infinity)))).sort(byDate)[0] || null;
}

/* ---------- Nube (Netlify) ---------- */
const hdr = () => ({ 'content-type': 'application/json', ...(pin ? { 'x-pin': pin } : {}) });
async function api(method, body, qs = '') {
  const r = await fetch(API + qs, { method, cache: 'no-store', headers: hdr(), body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) { const ok = await askPin(); if (ok) return api(method, body, qs); throw new Error('pin') }
  if (!r.ok) throw new Error('http');
  return r.json();
}
async function askPin() {
  if (askPin.open) return false; askPin.open = true;
  const v = await ask({ title: t('pinT'), text: t('pinP'), input: '' });
  askPin.open = false;
  if (!v) return false;
  pin = v; LS.set('pj_pin', pin); return true;
}
function merge(d) {
  const ids = new Set(d.planillas.map(p => p.id));
  for (const id of Object.keys(db)) { const p = db[id], ym = p.fecha.slice(0, 7); if (ym >= d.from && ym <= d.to && !p._dirty && !ids.has(id)) delete db[id] }
  for (const rp of d.planillas) { const l = db[rp.id]; if (l && l._dirty) continue; db[rp.id] = rp }
  if (d.catalogo && !cat._dirty && (d.catalogo.updatedAt || 0) >= (cat.updatedAt || 0)) { cat = { productos: d.catalogo.productos, gastos: d.catalogo.gastos, updatedAt: d.catalogo.updatedAt }; saveCat() }
  saveDb();
}
async function load(from, to) {
  try {
    const d = await api('GET', null, `?from=${from}&to=${to}`);
    let y = from; while (y <= to) { loaded.add(y); y = addM(y, 1) }
    merge(d); online = true; lastSync = Date.now(); LS.set('pj_sync', lastSync);
    return true;
  } catch (e) { online = false; return false }
}
async function pushDirty() {
  let fail = 0;
  for (const p of Object.values(db).filter(x => x._dirty)) {
    try {
      const { _dirty, _prev, _stamp, ...pl } = p;
      const j = await api('POST', { planilla: pl, prevFecha: _prev || pl.fecha });
      const cur = db[p.id];
      if (cur && cur._stamp === _stamp) { delete cur._dirty; delete cur._prev; delete cur._stamp; cur.updatedAt = j.updatedAt; cur.createdAt = j.createdAt }
      online = true;
    } catch (e) { fail++; online = false; break }
  }
  const dels = LS.get('pj_dels', []);
  const left = [];
  for (const d of dels) { try { await api('POST', d); } catch (e) { left.push(d) } }
  LS.set('pj_dels', left);
  if (cat._dirty) { try { const j = await api('POST', { catalogo: cat }); cat.updatedAt = j.updatedAt; delete cat._dirty; saveCat() } catch (e) {} }
  saveDb();
  return fail;
}
async function refresh(manual) {
  if (busy) return; busy = true; syncLine(true);
  await pushDirty();
  const now = hoy().slice(0, 7);
  loaded.clear();
  const ok = await load(addM(now, -(st.showMonths)), now);
  busy = false;
  if (manual) toast(ok ? t('syncOk', { h: horaCol(Date.now()) }) : t('syncOff'));
  syncLine(); if (!st.panel) render();
}
async function ensure(from, to) {
  if (!online) return;
  let need = false, y = from; while (y <= to) { if (!loaded.has(y)) need = true; y = addM(y, 1) }
  if (!need || ensure.busy) return;
  ensure.busy = true; await load(from, to); ensure.busy = false;
  if (st.tab === 'inf' && !st.panel) render();
}
function syncLine(loading) {
  const n = Object.values(db).filter(p => p._dirty).length;
  $('#sync').innerHTML = loading ? esc(t('cargando')) : `<b class="${online ? '' : 'off'}"></b>${esc(online && lastSync ? t('syncOk', { h: horaCol(lastSync) }) : t('syncOff'))}${n ? ' · ' + esc(t('pend', { n })) : ''}`;
}

/* ---------- Pantalla principal ---------- */
function chrome() {
  document.documentElement.lang = lang;
  $('#hSmall').textContent = t('small'); $('#hSub').textContent = t('sub');
  $('#refBtn').textContent = t('update'); $('#langBtn').textContent = lang === 'es' ? 'EN' : 'ES';
  $('#tabPl').textContent = t('tabPl'); $('#tabInf').textContent = t('tabInf'); $('#tabAj').textContent = t('tabAj');
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
  $('#foot').innerHTML = `${esc(t('hecho'))} <a href="https://vibraspositivashm.netlify.app/" target="_blank" rel="noopener">Vibras Positivas HM</a><br>${esc(t('ofrece'))} <a href="https://wa.me/573117700431" target="_blank" rel="noopener">311 770 0431</a>`;
}
function render() {
  chrome(); syncLine();
  const m = $('#main'); m.onclick = null; m.onchange = null;
  if (st.tab === 'pl') m.innerHTML = homeHTML();
  else if (st.tab === 'inf') { m.innerHTML = reportHTML(); bindReport() }
  else { m.innerHTML = settingsHTML(); bindSettings() }
}

function homeHTML() {
  const all = planillas(), h = hoy(), ym = h.slice(0, 7);
  const deHoy = all.find(p => p.fecha === h);
  const delMes = all.filter(p => p.fecha.slice(0, 7) === ym).map(calc);
  const s = k => delMes.reduce((a, c) => a + c[k], 0);
  const last = all[0] ? calc(all[0]) : null;
  let html = `<div class="kpis">
    <div class="kpi k1"><small>${t('ventaHoy')}</small><b class="num">${deHoy ? money(calc(deHoy).venta) : '—'}</b><span>${deHoy ? fCorta(h) : t('sinPlanilla')}</span></div>
    <div class="kpi k2"><small>${t('ventaMes')}</small><b class="num">${money(s('venta'))}</b><span>${t('nPl', { n: delMes.length })}</span></div>
    <div class="kpi k3"><small>${t('efDisp')}</small><b class="num">${last ? money(last.efDisp) : '—'}</b><span>${all[0] ? t('ultima') + ' · ' + fCorta(all[0].fecha) : ''}</span></div>
    <div class="kpi k4"><small>${t('gastosMes')}</small><b class="num">${money(s('compras') + s('gastos') + s('otros'))}</b><span>${t('compras')}: ${money(s('compras'))}</span></div>
  </div>
  <div class="row" style="margin-bottom:14px">
    <button class="btn b-main grow" id="goHoy">${deHoy ? t('abrirHoy') : t('nuevaHoy')}</button>
    ${deHoy ? `<button class="btn b-soft" id="goNew">${t('nueva')}</button>` : ''}
  </div>`;
  if (!all.length) {
    html += `<div class="card"><div class="welcome"><img src="img/planilla-papel.jpg" alt=""><div><h2>${t('wT')}</h2><p class="muted">${t('wP')}</p></div></div>
      <div class="steps"><div><b>1</b>${t('s1')}</div><div><b>2</b>${t('s2')}</div><div><b>3</b>${t('s3')}</div></div></div>`;
    return html;
  }
  // gráfica de 14 días
  const days = []; for (let i = 13; i >= 0; i--) days.push(addD(h, -i));
  const vals = days.map(d => all.filter(p => p.fecha === d).reduce((a, p) => a + calc(p).venta, 0));
  const max = Math.max(1, ...vals);
  html += `<div class="card"><h3>${t('ult14')}</h3><div class="chart">${days.map((d, i) => `<div class="bar ${d === h ? 'today' : ''}" data-day="${d}" title="${fCorta(d)} · ${money(vals[i])}"><i style="height:${Math.max(1.5, vals[i] / max * 100)}%;animation-delay:${i * 35}ms"></i><em>${toD(d).getDate()}</em></div>`).join('')}</div></div>`;
  // lista por meses
  let cur = '';
  all.forEach((p, i) => {
    const ymp = p.fecha.slice(0, 7);
    if (ymp !== cur) { cur = ymp; html += `<div class="mes">${mesNom(ymp)}</div>` }
    const c = calc(p), d = toD(p.fecha);
    html += `<div class="pl" data-id="${p.id}" style="animation-delay:${Math.min(i, 12) * 30}ms">
      <div class="d"><b>${d.getDate()}</b><small>${d.toLocaleDateString(loc(), { weekday: 'short' })}</small></div>
      <div class="i"><strong>${esc(d.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric' }).replace(/^./, x => x.toUpperCase()))}${p._dirty ? `<span class="tag">${lang === 'en' ? 'not uploaded' : 'sin subir'}</span>` : ''}</strong><span>${t('compras')} ${money(c.compras)}</span><br><span>${t('gasto')}s ${money(c.gastos + c.otros)}</span></div>
      <div class="v"><small class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em">${lang === 'en' ? 'Sales' : 'Venta'}</small><b class="num">${money(c.venta)}</b><span class="muted">${lang === 'en' ? 'Cash' : 'Efectivo'} ${money(c.efDisp)}</span></div></div>`;
  });
  html += `<div style="text-align:center;margin-top:10px"><button class="btn b-line" id="more">${t('verMas')}</button></div>`;
  return html;
}

/* ---------- Formulario de la planilla ---------- */
function blank(fecha) {
  const prev = prevOf(fecha, null, Infinity);
  return { id: uid(), fecha, compras: [{ p: '', v: '' }, { p: '', v: '' }, { p: '', v: '' }], gastos: [{ tipo: '', det: '', v: '', og: '' }, { tipo: '', det: '', v: '', og: '' }],
    egNoc: '', efNoc: '', egDia: null, efDia: '', saldoAnt: prev ? calc(prev).efDisp : '', nota: '' };
}
async function openNew(fecha) {
  fecha = fecha || hoy();
  const ex = planillas().find(p => p.fecha === fecha);
  if (ex) {
    const r = await ask({ title: t('planilla'), text: t('yaExiste', { d: fLarga(fecha) }), ok: t('abrir'), cancel: t('hacerOtra') });
    if (r) return openView(ex.id);
  }
  st.draft = blank(fecha); st.id = null; st.prevFecha = null; st.dirtyForm = false;
  openPanel('form');
}
function openEdit(id) {
  const p = db[id]; if (!p) return;
  const { _dirty, _prev, _stamp, ...clean } = p;
  st.draft = JSON.parse(JSON.stringify(clean));
  if (!st.draft.compras.length) st.draft.compras.push({ p: '', v: '' });
  if (!st.draft.gastos.length) st.draft.gastos.push({ tipo: '', det: '', v: '', og: '' });
  st.id = id; st.prevFecha = p._prev || p.fecha; st.dirtyForm = false;
  openPanel('form');
}
function openView(id) { st.id = id; openPanel('view') }
function openPanel(kind) {
  st.panel = kind;
  const P = $('#panel');
  P.innerHTML = kind === 'form' ? formHTML() : viewHTML();
  P.classList.add('open'); P.scrollTop = 0; document.body.style.overflow = 'hidden';
  if (kind === 'form') bindForm(); else { bindView(); fitPaper() }
}
function fitPaper() { const w = $('.paperwrap'), p = w && w.querySelector('.paper'); if (p) p.style.zoom = Math.min(1, (w.clientWidth - 2) / 820) }
window.addEventListener('resize', () => { if (st.panel === 'view') fitPaper() });
function closePanel() { st.panel = null; st.draft = null; $('#panel').classList.remove('open'); document.body.style.overflow = ''; render() }

const mInp = (val, attrs) => `<input class="inp money" inputmode="numeric" autocomplete="off" placeholder="0" value="${val === '' || val === null || val === undefined ? '' : fmtN(val)}" ${attrs}>`;
function tipoOptions(sel) {
  const list = cat.gastos.slice(); if (sel && !list.includes(sel)) list.unshift(sel);
  return `<option value="">${esc(t('escoja'))}</option>` + list.map(g => `<option ${g === sel ? 'selected' : ''}>${esc(g)}</option>`).join('') + `<option value="__new">${esc(t('nuevoTipo'))}</option>`;
}
function compraRow(r, i) {
  return `<div class="line" data-sec="compras" data-i="${i}">
    <input class="inp" list="dlProd" placeholder="${esc(t('producto'))}" value="${esc(r.p)}" data-f="p" autocomplete="off">
    ${mInp(r.v, 'data-f="v"')}
    <button class="x" data-del="compras" data-i="${i}">${t('quitar')}</button></div>`;
}
function gastoRow(r, i) {
  return `<div class="line gl" data-sec="gastos" data-i="${i}">
    <div class="t"><span class="minil">${t('gasto')}</span><select class="inp" data-f="tipo">${tipoOptions(r.tipo)}</select></div>
    <div class="dd"><span class="minil">${t('detalle')}</span><input class="inp" value="${esc(r.det)}" data-f="det" placeholder="${esc(t('detalle'))}"></div>
    <div class="vv"><span class="minil">${t('valor')}</span>${mInp(r.v, 'data-f="v"')}</div>
    <div class="oo"><span class="minil">${t('otros')}</span>${mInp(r.og, 'data-f="og"')}</div>
    <button class="x xx" data-del="gastos" data-i="${i}">${t('quitar')}</button></div>`;
}
function formHTML() {
  const p = st.draft, c = calc(p);
  return `<div class="ph"><button class="pill" id="fBack">${t('volver')}</button><h2>${st.id ? t('editar') : t('planilla')}</h2><button class="pill" id="fSave2">${t('guardar')}</button></div>
  <div class="pb">
    <datalist id="dlProd">${cat.productos.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    <div class="card"><label class="f">${t('fecha')}</label><input class="inp" type="date" id="fFecha" value="${p.fecha}"><div class="muted" style="margin-top:6px" id="fFechaL">${fLarga(p.fecha)}</div></div>

    <div class="card sec"><h2>${t('compras')}</h2><p class="muted">${t('productos')} · ${t('valor')}</p>
      <div id="lstCompras">${p.compras.map(compraRow).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn b-soft b-sm" id="addC">${t('addCompra')}</button><div class="grow"></div><div class="tot" style="padding:0">${t('tCompras')}: <span class="num" id="tC" style="margin-left:8px">${money(c.compras)}</span></div></div>
    </div>

    <div class="card sec g"><h2>${t('gastosOp')}</h2><p class="muted">${t('gasto')} · ${t('valor')} · ${t('otros')}</p>
      <div id="lstGastos">${p.gastos.map(gastoRow).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn b-soft b-sm" id="addG">${t('addGasto')}</button></div>
      <div class="tot">${t('tGastos')}<span class="num" id="tG">${money(c.gastos)}</span></div>
      <div class="tot" style="padding-top:4px">${t('tOtros')}<span class="num" id="tO">${money(c.otros)}</span></div>
    </div>

    <div class="card"><h2>${t('cierre')}</h2>
      <div class="sumrow"><span>${t('subtotal')}<i class="auto">${t('subN')}</i></span><b class="num" id="cSub">${money(c.sub)}</b></div>
    </div>
    <div class="card sec n"><h3>${t('noche')}</h3>
      <div class="sumrow"><span>${t('egNoc')}</span>${mInp(p.egNoc, 'data-k="egNoc"')}</div>
      <div class="sumrow"><span>${t('efNoc')}</span>${mInp(p.efNoc, 'data-k="efNoc"')}</div>
      <div class="sumrow"><span>${t('realNoc')}<i class="auto">${t('realNocN')}</i></span><b class="num" id="cRN">${money(c.realNoc)}</b></div>
    </div>
    <div class="card sec d"><h3>${t('dia')}</h3>
      <div class="sumrow"><span>${t('egDia')}<i class="auto">${t('egDiaN')}</i></span>${mInp(p.egDia, `data-k="egDia" placeholder="${fmtN(c.egDiaAuto)}"`)}</div>
      <div class="sumrow"><span>${t('efDia')}</span>${mInp(p.efDia, 'data-k="efDia"')}</div>
      <div class="sumrow"><span>${t('realDia')}<i class="auto">${t('realDiaN')}</i></span><b class="num" id="cRD">${money(c.realDia)}</b></div>
      <div class="sumrow"><span>${t('saldoAnt')}<i class="auto">${t('saldoAntN')}</i><button class="btn b-line b-sm" id="traer" style="margin-top:6px">${t('traer')}</button></span>${mInp(p.saldoAnt, 'data-k="saldoAnt"')}</div>
      <div class="big"><div class="sumrow"><span>${t('efDispL')}<i class="auto">${t('efDispN')}</i></span><b class="num" id="cED">${money(c.efDisp)}</b></div>
      <div class="sumrow"><span>${t('ventaTotal')}<i class="auto">${t('ventaTotalN')}</i></span><b class="num" id="cVT">${money(c.venta)}</b></div></div>
    </div>
    <div class="card"><h3>${t('nota')}</h3><textarea class="inp" rows="3" id="fNota">${esc(p.nota || '')}</textarea></div>
    <button class="btn b-main" style="width:100%" id="fSave">${t('guardar')}</button>
  </div>
  <div class="dock"><div class="m">
    <div><small>${t('subtotal')}</small><b class="num" id="dSub">${money(c.sub)}</b></div>
    <div><small>${t('ventaTotal')}</small><b class="num" id="dVT">${money(c.venta)}</b></div>
    <div><small>${t('efDispL')}</small><b class="num" id="dED">${money(c.efDisp)}</b></div>
  </div><button class="btn b-main b-sm" id="fSave3">${t('guardar')}</button></div>`;
}
function updTotals() {
  const c = calc(st.draft);
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = money(v) };
  set('tC', c.compras); set('tG', c.gastos); set('tO', c.otros); set('cSub', c.sub); set('dSub', c.sub);
  set('cRN', c.realNoc); set('cRD', c.realDia); set('cED', c.efDisp); set('dED', c.efDisp); set('cVT', c.venta); set('dVT', c.venta);
  const eg = document.querySelector('[data-k="egDia"]'); if (eg) eg.placeholder = fmtN(c.egDiaAuto);
}
function bindForm() {
  const P = $('#panel'), p = st.draft;
  const fmtMoney = el => { const raw = el.value.replace(/\D/g, ''); el.value = raw ? Number(raw).toLocaleString('es-CO') : ''; return raw };
  P.oninput = e => {
    const el = e.target; st.dirtyForm = true;
    if (el.id === 'fNota') { p.nota = el.value; return }
    if (el.id === 'fFecha') return;
    const isMoney = el.classList.contains('money');
    const val = isMoney ? fmtMoney(el) : el.value;
    if (el.dataset.k) { p[el.dataset.k] = (el.dataset.k === 'egDia' && val === '') ? null : val }
    else { const line = el.closest('[data-sec]'); if (line && el.dataset.f && el.tagName !== 'SELECT') p[line.dataset.sec][+line.dataset.i][el.dataset.f] = val }
    updTotals();
  };
  P.onchange = async e => {
    const el = e.target;
    if (el.id === 'fFecha') { if (el.value) { p.fecha = el.value; $('#fFechaL').textContent = fLarga(p.fecha) } return }
    if (el.tagName === 'SELECT' && el.dataset.f === 'tipo') {
      const line = el.closest('[data-sec]'), i = +line.dataset.i; st.dirtyForm = true;
      if (el.value === '__new') {
        const v = await ask({ title: t('nuevoG'), input: '' });
        if (v) { if (!cat.gastos.some(x => x.toLowerCase() === v.toLowerCase())) { cat.gastos.push(v); cat._dirty = true; cat.updatedAt = Date.now(); saveCat() } p.gastos[i].tipo = cat.gastos.find(x => x.toLowerCase() === v.toLowerCase()) }
        $$('#lstGastos select').forEach((s, k) => { s.innerHTML = tipoOptions(p.gastos[k].tipo) });
      } else p.gastos[i].tipo = el.value;
    }
  };
  P.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.del) {
      const sec = b.dataset.del; p[sec].splice(+b.dataset.i, 1); st.dirtyForm = true;
      if (!p[sec].length) p[sec].push(sec === 'compras' ? { p: '', v: '' } : { tipo: '', det: '', v: '', og: '' });
      redrawLines(sec); updTotals(); return;
    }
    switch (b.id) {
      case 'addC': p.compras.push({ p: '', v: '' }); redrawLines('compras'); $$('#lstCompras .line').pop().querySelector('input').focus(); break;
      case 'addG': p.gastos.push({ tipo: '', det: '', v: '', og: '' }); redrawLines('gastos'); $$('#lstGastos .line').pop().querySelector('select').focus(); break;
      case 'traer': {
        const prev = prevOf(p.fecha, p.id, p.createdAt || Infinity);
        if (!prev) { toast(t('sinPrev')); break }
        p.saldoAnt = calc(prev).efDisp; document.querySelector('[data-k="saldoAnt"]').value = fmtN(p.saldoAnt); updTotals(); toast(t('traido', { d: fCorta(prev.fecha) })); break;
      }
      case 'fBack':
        if (st.dirtyForm && !(await ask({ title: t('salir'), ok: t('salirSi'), cancel: t('volver'), danger: true }))) break;
        if (st.id) openView(st.id); else closePanel(); break;
      case 'fSave': case 'fSave2': case 'fSave3': save(); break;
    }
  };
}
function redrawLines(sec) {
  const p = st.draft;
  if (sec === 'compras') $('#lstCompras').innerHTML = p.compras.map(compraRow).join('');
  else $('#lstGastos').innerHTML = p.gastos.map(gastoRow).join('');
}
async function save() {
  const p = st.draft;
  if (!p.fecha) return toast(t('needFecha'));
  p.compras = p.compras.filter(r => String(r.p).trim() || num(r.v)).map(r => ({ p: String(r.p).trim(), v: num(r.v) }));
  p.gastos = p.gastos.filter(r => r.tipo || String(r.det).trim() || num(r.v) || num(r.og)).map(r => ({ tipo: r.tipo || 'Otros', det: String(r.det || '').trim(), v: num(r.v), og: num(r.og) }));
  for (const k of ['egNoc', 'efNoc', 'efDia', 'saldoAnt']) p[k] = num(p[k]);
  if (p.egDia !== null && p.egDia !== undefined && p.egDia !== '') p.egDia = num(p.egDia); else p.egDia = null;
  const c = calc(p);
  if (!p.compras.length && !p.gastos.length && !c.efNoc && !c.efDia && !c.egNoc) {
    if (!p.compras.length) p.compras.push({ p: '', v: '' }); if (!p.gastos.length) p.gastos.push({ tipo: '', det: '', v: '', og: '' });
    return toast(t('vacia'));
  }
  // Productos nuevos pasan a la lista de sugerencias
  let ch = false; for (const r of p.compras) if (r.p && !cat.productos.some(x => x.toLowerCase() === r.p.toLowerCase())) { cat.productos.push(r.p); ch = true }
  if (ch) { cat._dirty = true; cat.updatedAt = Date.now(); saveCat() }
  if (!p.createdAt) p.createdAt = Date.now();
  const old = db[p.id];
  db[p.id] = { ...p, _dirty: true, _prev: (old && (old._prev || old.fecha)) || st.prevFecha || p.fecha, _stamp: uid() };
  saveDb();
  const id = p.id; st.id = id; st.draft = null; st.dirtyForm = false;
  openView(id);
  const fail = await pushDirty();
  syncLine();
  toast(fail || !online ? t('savedOff') : t('saved'));
}

/* ---------- Vista de la planilla (igual a la hoja de papel) ---------- */
function paperHTML(p) {
  const c = calc(p), rows = Math.max(20, p.compras.length, p.gastos.length);
  let body = '';
  for (let i = 0; i < rows; i++) {
    const a = p.compras[i] || {}, g = p.gastos[i] || {};
    body += `<tr><td>${esc(a.p || '')}</td><td class="r">${a.v ? fmtN(a.v) : ''}</td><td>${esc(g.tipo || '')}${g.det ? ' · ' + esc(g.det) : ''}</td><td class="r">${g.v ? fmtN(g.v) : ''}</td><td class="r">${g.og ? fmtN(g.og) : ''}</td></tr>`;
  }
  const L = (k, v) => `<tr><td class="lb">${k}</td><td class="r">${fmtN(v)}</td></tr>`;
  return `<div class="paper">
   <table><tr><td rowspan="2" style="width:50%;border-bottom:0"><img src="img/logo.jpg" alt="Pantojarte" style="height:58px;display:block;margin:4px auto;border-radius:4px"></td><td><b>${lang === 'en' ? 'DATE' : 'FECHA'}:</b> ${esc(fLarga(p.fecha))}</td></tr><tr><td class="c"><b>${lang === 'en' ? 'DAILY SHEET' : 'PLANILLA DIARIA'}</b></td></tr></table>
   <table style="margin-top:-1px"><colgroup><col style="width:38%"><col style="width:12%"><col style="width:28%"><col style="width:11%"><col style="width:11%"></colgroup>
    <tr><th colspan="2" class="c">${t('compras').toUpperCase()}</th><th colspan="3" class="c">${t('gastosOp').toUpperCase()}</th></tr>
    <tr><th>${t('productos').toUpperCase()}</th><th>${t('valor').toUpperCase()}</th><th>${(lang === 'en' ? 'EXPENSES' : 'GASTOS')}</th><th>${t('valor').toUpperCase()}</th><th>${t('otros').toUpperCase()}</th></tr>
    ${body}
    <tr><th class="r">${t('tCompras').toUpperCase()}</th><th class="r">${fmtN(c.compras)}</th><th class="r">${t('total').toUpperCase()}</th><th class="r">${fmtN(c.gastos)}</th><th class="r">${fmtN(c.otros)}</th></tr>
   </table>
   <table style="margin-top:-1px"><colgroup><col style="width:38%"><col style="width:12%"><col style="width:50%"></colgroup>
    <tr><td style="padding:0;border:0" colspan="2"><table><colgroup><col style="width:72%"><col style="width:28%"></colgroup>
      ${L(t('subtotal').toUpperCase(), c.sub)}${L(t('egNoc').toUpperCase(), c.egNoc)}${L(t('efNoc').toUpperCase(), c.efNoc)}${L(t('realNoc').toUpperCase(), c.realNoc)}
      ${L(t('egDia').toUpperCase(), c.egDia)}${L(t('efDia').toUpperCase(), c.efDia)}${L(t('realDia').toUpperCase(), c.realDia)}${L(t('saldoAnt').toUpperCase(), c.saldoAnt)}${L(t('efDispL').toUpperCase(), c.efDisp)}
      <tr><td class="lb">${t('ventaTotal').toUpperCase()}</td><td class="r"><b>${fmtN(c.venta)}</b></td></tr>
    </table></td><td style="vertical-align:top"><b>${t('nota').toUpperCase()}</b><div style="white-space:pre-wrap;margin-top:4px">${esc(p.nota || '')}</div></td></tr>
   </table></div>`;
}
function viewHTML() {
  const p = db[st.id]; if (!p) return '';
  const c = calc(p);
  return `<div class="ph"><button class="pill" id="vBack">${t('volver')}</button><h2>${esc(fCorta(p.fecha))}</h2><button class="pill" id="vEdit">${t('editar')}</button></div>
  <div class="pb">
   <div class="kpis">
    <div class="kpi k1"><small>${t('ventaTotal')}</small><b class="num">${money(c.venta)}</b><span>${t('realNoc')}: ${money(c.realNoc)}</span></div>
    <div class="kpi k3"><small>${t('efDispL')}</small><b class="num">${money(c.efDisp)}</b><span>${t('saldoAnt')}: ${money(c.saldoAnt)}</span></div>
    <div class="kpi k2"><small>${t('compras')}</small><b class="num">${money(c.compras)}</b><span>${p.compras.length} ${t('productos').toLowerCase()}</span></div>
    <div class="kpi k4"><small>${t('gastosOp')}</small><b class="num">${money(c.gastos + c.otros)}</b><span>${t('otros')}: ${money(c.otros)}</span></div>
   </div>
   <div class="row" style="margin-bottom:12px">
    <button class="btn b-main grow" id="vEdit2">${t('editar')}</button>
    <button class="btn b-dark" id="vWa">${t('whatsapp')}</button>
    <button class="btn b-soft" id="vPrint">${t('imprimir')}</button>
    <button class="btn b-soft" id="vXls">${t('excel')}</button>
    <button class="btn b-bad" id="vDel">${t('eliminar')}</button>
   </div>
   <div class="paperwrap">${paperHTML(p)}</div>
  </div>`;
}
function bindView() {
  const p = db[st.id];
  $('#panel').oninput = null; $('#panel').onchange = null;
  $('#panel').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    switch (b.id) {
      case 'vBack': closePanel(); break;
      case 'vEdit': case 'vEdit2': openEdit(p.id); break;
      case 'vPrint': printHTML(paperHTML(p)); break;
      case 'vWa': sendWa(waText(p)); break;
      case 'vXls': excelPlanilla(p); break;
      case 'vDel': {
        if (!(await ask({ title: t('eliminar'), text: t('delQ', { d: fLarga(p.fecha) }), ok: t('eliminar'), danger: true }))) break;
        const dels = LS.get('pj_dels', []); dels.push({ del: p.id, fecha: p.fecha }); if (p._prev && p._prev.slice(0, 7) !== p.fecha.slice(0, 7)) dels.push({ del: p.id, fecha: p._prev }); LS.set('pj_dels', dels);
        delete db[p.id]; saveDb(); closePanel(); toast(t('delOk')); pushDirty().then(syncLine); break;
      }
    }
  };
}
function printHTML(html) { $('#print').innerHTML = html; setTimeout(() => window.print(), 250) }
function sendWa(txt) { const n = String(wa || '').replace(/\D/g, ''); window.open(`https://wa.me/${n ? (n.length === 10 ? '57' + n : n) : ''}?text=${encodeURIComponent(txt)}`, '_blank') }
function waText(p) {
  const c = calc(p), L = [];
  L.push(`*PANTOJARTE · ${t('planilla').toUpperCase()}*`, fLarga(p.fecha), '');
  if (p.compras.length) { L.push(`*${t('compras')}*`); p.compras.forEach(r => L.push(`• ${r.p || '-'}: ${money(r.v)}`)); L.push(`${t('tCompras')}: ${money(c.compras)}`, '') }
  if (p.gastos.length) { L.push(`*${t('gastosOp')}*`); p.gastos.forEach(r => L.push(`• ${r.tipo}${r.det ? ' (' + r.det + ')' : ''}: ${money(r.v)}${r.og ? ' · ' + t('otros') + ' ' + money(r.og) : ''}`)); L.push(`${t('tGastos')}: ${money(c.gastos)}`, `${t('tOtros')}: ${money(c.otros)}`, '') }
  L.push(`*${t('cierre')}*`, `${t('subtotal')}: ${money(c.sub)}`, `${t('egNoc')}: ${money(c.egNoc)}`, `${t('efNoc')}: ${money(c.efNoc)}`, `${t('realNoc')}: ${money(c.realNoc)}`,
    `${t('egDia')}: ${money(c.egDia)}`, `${t('efDia')}: ${money(c.efDia)}`, `${t('realDia')}: ${money(c.realDia)}`, `${t('saldoAnt')}: ${money(c.saldoAnt)}`,
    `*${t('efDispL')}: ${money(c.efDisp)}*`, `*${t('ventaTotal')}: ${money(c.venta)}*`);
  if (p.nota) L.push('', `${t('nota')}: ${p.nota}`);
  return L.join('\n');
}
const XL = () => { if (!window.XLSX) { toast('Excel…'); return null } return window.XLSX };
function sheetFrom(rows, widths) { const X = XL(); const ws = X.utils.aoa_to_sheet(rows); ws['!cols'] = widths.map(w => ({ wch: w })); return ws }
function excelPlanilla(p) {
  const X = XL(); if (!X) return;
  const c = calc(p), rows = [['PANTOJARTE', '', '', '', ''], [t('planilla').toUpperCase(), '', t('fecha'), p.fecha, ''], [], [t('productos'), t('valor'), t('gasto'), t('valor'), t('otros')]];
  const n = Math.max(p.compras.length, p.gastos.length);
  for (let i = 0; i < n; i++) { const a = p.compras[i] || {}, g = p.gastos[i] || {}; rows.push([a.p || '', a.v || '', g.tipo ? g.tipo + (g.det ? ' · ' + g.det : '') : '', g.v || '', g.og || '']) }
  rows.push([t('tCompras'), c.compras, t('total'), c.gastos, c.otros], []);
  [['subtotal', c.sub], ['egNoc', c.egNoc], ['efNoc', c.efNoc], ['realNoc', c.realNoc], ['egDia', c.egDia], ['efDia', c.efDia], ['realDia', c.realDia], ['saldoAnt', c.saldoAnt], ['efDispL', c.efDisp], ['ventaTotal', c.venta]].forEach(([k, v]) => rows.push([t(k), v]));
  if (p.nota) rows.push([], [t('nota'), p.nota]);
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, sheetFrom(rows, [34, 14, 34, 14, 14]), 'Planilla');
  X.writeFile(wb, `Pantojarte_planilla_${p.fecha}.xlsx`);
}

/* ---------- Informes ---------- */
function period() {
  const r = st.rep, h = hoy();
  if (!r.anchor) r.anchor = h;
  const a = r.anchor;
  if (r.per === 'd') return { from: a, to: a, label: fLarga(a) };
  if (r.per === 'w') { const d = toD(a), wd = (d.getDay() + 6) % 7, f = addD(a, -wd), to = addD(f, 6); return { from: f, to, label: `${fCorta(f)} – ${fCorta(to)}` } }
  if (r.per === 'm') { const ym = a.slice(0, 7), last = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); return { from: ym + '-01', to: ym + '-' + String(last).padStart(2, '0'), label: mesNom(ym) } }
  if (r.per === 'y') { const y = a.slice(0, 4); return { from: y + '-01-01', to: y + '-12-31', label: y } }
  if (!r.from) r.from = addD(h, -6); if (!r.to) r.to = h;
  const f = r.from <= r.to ? r.from : r.to, to = r.from <= r.to ? r.to : r.from;
  return { from: f, to, label: `${fCorta(f)} – ${fCorta(to)}` };
}
function shift(n) {
  const r = st.rep, a = r.anchor || hoy();
  if (r.per === 'd') r.anchor = addD(a, n);
  else if (r.per === 'w') r.anchor = addD(a, 7 * n);
  else if (r.per === 'm') r.anchor = addM(a.slice(0, 7), n) + '-01';
  else if (r.per === 'y') r.anchor = (+a.slice(0, 4) + n) + '-01-01';
  render();
}
const CIERRE_ITEMS = ['venta', 'realNoc', 'realDia', 'efNoc', 'efDia', 'egNoc', 'egDia', 'efDisp', 'sub'];
const cierreLabel = k => ({ venta: t('ventaTotal'), realNoc: t('realNoc'), realDia: t('realDia'), efNoc: t('efNoc') + ' (' + t('noche').toLowerCase() + ')', efDia: t('efDia'), egNoc: t('egNoc'), egDia: t('egDia'), efDisp: t('efDispL'), sub: t('subtotal') }[k]);
function itemLabel(it) {
  if (it === 'all') return t('resumen'); if (it === 'C*') return t('gTodas'); if (it === 'G*') return t('gGastos'); if (it === 'O*') return t('gOtros');
  if (it.startsWith('C:')) return t('compras') + ': ' + it.slice(2); if (it.startsWith('G:')) return t('gasto') + ': ' + it.slice(2); if (it.startsWith('K:')) return cierreLabel(it.slice(2));
  return it;
}
// Valor de un rubro en una planilla
function valueOf(p, it) {
  const c = calc(p);
  if (it === 'C*') return c.compras; if (it === 'G*') return c.gastos; if (it === 'O*') return c.otros;
  if (it.startsWith('C:')) { const n = it.slice(2).toLowerCase(); return p.compras.filter(r => (r.p || '').toLowerCase() === n).reduce((s, r) => s + num(r.v), 0) }
  if (it.startsWith('G:')) { const n = it.slice(2); return p.gastos.filter(r => r.tipo === n).reduce((s, r) => s + num(r.v) + num(r.og), 0) }
  if (it.startsWith('K:')) return c[it.slice(2)];
  return c.venta;
}
function report() {
  const pr = period(), it = st.rep.item;
  ensure(pr.from.slice(0, 7), pr.to.slice(0, 7));
  const list = planillas().filter(p => p.fecha >= pr.from && p.fecha <= pr.to).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const days = (toD(pr.to) - toD(pr.from)) / 864e5 + 1;
  const byMonth = days > 62;
  const groups = new Map();
  if (!byMonth && days <= 62) for (let d = pr.from; d <= pr.to; d = addD(d, 1)) groups.set(d, []);
  for (const p of list) { const k = byMonth ? p.fecha.slice(0, 7) : p.fecha; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p) }
  const series = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, ps]) => ({ k, v: ps.reduce((s, p) => s + valueOf(p, it === 'all' ? 'K:venta' : it), 0), n: ps.length }));
  // Desglose por producto o tipo de gasto
  const bd = (src, withOg = true) => { const m = new Map(); for (const p of list) for (const r of p[src]) { const name = src === 'compras' ? (r.p || '-') : (r.tipo || 'Otros'); const key = src === 'compras' ? name.toLowerCase() : name; const o = m.get(key) || { name, v: 0, n: 0 }; o.v += src === 'compras' ? num(r.v) : num(r.v) + (withOg ? num(r.og) : 0); o.n++; m.set(key, o) } return [...m.values()].sort((a, b) => b.v - a.v) };
  let breakdown = null;
  if (it === 'C*') breakdown = bd('compras'); else if (it === 'G*') breakdown = bd('gastos', false);
  else if (it === 'O*') { const m = new Map(); for (const p of list) for (const r of p.gastos) if (num(r.og)) { const o = m.get(r.tipo) || { name: r.tipo, v: 0, n: 0 }; o.v += num(r.og); o.n++; m.set(r.tipo, o) } breakdown = [...m.values()].sort((a, b) => b.v - a.v) }
  // Detalle de los renglones para un producto o tipo de gasto
  let lines = null;
  if (it.startsWith('C:')) { const n = it.slice(2).toLowerCase(); lines = []; for (const p of list) for (const r of p.compras) if ((r.p || '').toLowerCase() === n) lines.push({ f: p.fecha, d: r.p, v: num(r.v), id: p.id }) }
  if (it.startsWith('G:')) { const n = it.slice(2); lines = []; for (const p of list) for (const r of p.gastos) if (r.tipo === n) lines.push({ f: p.fecha, d: r.det || '', v: num(r.v) + num(r.og), id: p.id }) }
  const total = series.reduce((s, x) => s + x.v, 0);
  const withPl = list.length ? new Set(list.map(p => p.fecha)).size : 0;
  const best = series.reduce((b, x) => x.v > (b ? b.v : -Infinity) ? x : b, null);
  const sum = k => list.reduce((s, p) => s + calc(p)[k], 0);
  return { pr, it, list, series, byMonth, breakdown, lines, total, withPl, best, sum, comprasBD: it === 'all' ? bd('compras') : null, gastosBD: it === 'all' ? bd('gastos') : null };
}
function itemOptions() {
  const all = planillas();
  const prods = new Map(); cat.productos.forEach(x => prods.set(x.toLowerCase(), x)); all.forEach(p => p.compras.forEach(r => r.p && !prods.has(r.p.toLowerCase()) && prods.set(r.p.toLowerCase(), r.p)));
  const tipos = new Set(cat.gastos); all.forEach(p => p.gastos.forEach(r => r.tipo && tipos.add(r.tipo)));
  const o = (v, l) => `<option value="${esc(v)}" ${st.rep.item === v ? 'selected' : ''}>${esc(l)}</option>`;
  return `${o('all', t('resumen'))}${o('C*', t('gTodas'))}${o('G*', t('gGastos'))}${o('O*', t('gOtros'))}
   <optgroup label="${esc(t('oCierre'))}">${CIERRE_ITEMS.map(k => o('K:' + k, cierreLabel(k))).join('')}</optgroup>
   <optgroup label="${esc(t('oGastos'))}">${[...tipos].sort((a, b) => a.localeCompare(b)).map(x => o('G:' + x, x)).join('')}</optgroup>
   <optgroup label="${esc(t('oCompras'))}">${[...prods.values()].sort((a, b) => a.localeCompare(b)).map(x => o('C:' + x, x)).join('')}</optgroup>`;
}
const keyLabel = (k, byMonth) => byMonth ? mesNom(k) : toD(k).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' });
function reportHTML() {
  const r = st.rep, R = report(), chip = (v, l) => `<button class="chip ${r.per === v ? 'on' : ''}" data-per="${v}">${l}</button>`;
  let h = `<div class="card"><h2>${t('informe')}</h2>
   <div class="chips" style="margin-top:8px">${chip('d', t('hoy'))}${chip('w', t('semana'))}${chip('m', t('mes'))}${chip('y', t('anio'))}${chip('r', t('rango'))}</div>
   ${r.per === 'r' ? `<div class="row" style="margin-top:10px"><div class="grow"><label class="f">${t('desde')}</label><input type="date" class="inp" id="rFrom" value="${R.pr.from}"></div><div class="grow"><label class="f">${t('hasta')}</label><input type="date" class="inp" id="rTo" value="${R.pr.to}"></div></div>`
     : `<div class="per"><button class="btn b-line b-sm" id="rPrev">${t('ant')}</button><strong>${esc(R.pr.label)}</strong><button class="btn b-line b-sm" id="rNext">${t('sig')}</button></div>`}
   <label class="f" style="margin-top:10px">${t('ver')}</label><select class="inp" id="rItem">${itemOptions()}</select>
   <div class="row" style="margin-top:12px"><button class="btn b-dark b-sm" id="rWa">${t('whatsapp')}</button><button class="btn b-soft b-sm" id="rPrint">${t('imprimir')}</button><button class="btn b-soft b-sm" id="rXls">${t('excel')}</button></div>
  </div>`;
  if (!R.list.length) return h + `<div class="card"><p class="muted">${t('sinDatos')}</p></div>`;
  const nd = R.series.length || 1;
  if (R.it === 'all') {
    h += `<div class="kpis">
     <div class="kpi k1"><small>${t('ventaTotal')}</small><b class="num">${money(R.sum('venta'))}</b><span>${t('promedio')}: ${money(R.sum('venta') / (R.withPl || 1))}</span></div>
     <div class="kpi k2"><small>${t('compras')}</small><b class="num">${money(R.sum('compras'))}</b><span>${t('dias')}: ${R.withPl}</span></div>
     <div class="kpi k4"><small>${t('gastosOp')}</small><b class="num">${money(R.sum('gastos'))}</b><span>${t('otros')}: ${money(R.sum('otros'))}</span></div>
     <div class="kpi k3"><small>${t('efDispL')}</small><b class="num">${money(calc(R.list[R.list.length - 1]).efDisp)}</b><span>${fCorta(R.list[R.list.length - 1].fecha)}</span></div></div>`;
  } else {
    h += `<div class="kpis">
     <div class="kpi k1"><small>${t('total')}</small><b class="num">${money(R.total)}</b><span>${esc(itemLabel(R.it))}</span></div>
     <div class="kpi k2"><small>${t('promedio')}</small><b class="num">${money(R.total / (R.withPl || 1))}</b><span>${t('dias')}: ${R.withPl}</span></div>
     <div class="kpi k4"><small>${t('mayor')}</small><b class="num">${R.best ? money(R.best.v) : '—'}</b><span>${R.best ? esc(keyLabel(R.best.k, R.byMonth)) : ''}</span></div>
     <div class="kpi k3"><small>${R.lines ? t('veces') : t('dias')}</small><b class="num">${R.lines ? R.lines.length : R.withPl}</b><span>${esc(R.pr.label)}</span></div></div>`;
  }
  // gráfica
  const max = Math.max(1, ...R.series.map(x => x.v));
  h += `<div class="card"><h3>${esc(R.it === 'all' ? t('ventaTotal') : itemLabel(R.it))} · ${R.byMonth ? t('porMes') : t('porDia')}</h3><div class="chart ${R.series.length > 16 ? 'dense' : ''}">${R.series.map((x, i) => `<div class="bar ${(i % 5 === 0 || i === R.series.length - 1) ? 'lb' : ''}" data-day="${R.byMonth ? '' : x.k}" title="${esc(keyLabel(x.k, R.byMonth))} · ${money(x.v)}"><i style="height:${Math.max(1.5, x.v / max * 100)}%;animation-delay:${Math.min(i, 40) * 20}ms"></i><em>${R.byMonth ? toD(x.k + '-15').toLocaleDateString(loc(), { month: 'short' }) : toD(x.k).getDate()}</em></div>`).join('')}</div></div>`;
  const bdTable = (title, arr, it) => { if (!arr || !arr.length) return ''; const tot = arr.reduce((s, x) => s + x.v, 0) || 1; return `<div class="card"><h3>${esc(title)}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${t('porItem')}</th><th class="r">${t('veces')}</th><th class="r">${t('total')}</th></tr></thead><tbody>${arr.map(x => `<tr class="click" data-item="${esc(it + x.name)}"><td>${esc(x.name)}<div class="meter"><i style="width:${x.v / tot * 100}%"></i></div></td><td class="r">${x.n}</td><td class="r num">${money(x.v)}<div class="muted">${(x.v / tot * 100).toFixed(1)}%</div></td></tr>`).join('')}</tbody><tfoot><tr><td>${t('total')}</td><td></td><td class="r">${money(tot)}</td></tr></tfoot></table></div></div>` };
  if (R.it === 'all') { h += bdTable(t('topCompras'), R.comprasBD, 'C:'); h += bdTable(t('topGastos'), R.gastosBD, 'G:') }
  if (R.breakdown) h += bdTable(itemLabel(R.it), R.breakdown, R.it === 'C*' ? 'C:' : 'G:');
  if (R.lines) h += `<div class="card"><h3>${esc(itemLabel(R.it))}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${t('fecha')}</th><th>${t('detalle').replace(/ \(.*\)/, '')}</th><th class="r">${t('valor')}</th></tr></thead><tbody>${R.lines.map(l => `<tr class="click" data-open="${l.id}"><td>${esc(fCorta(l.f))}</td><td>${esc(l.d)}</td><td class="r num">${money(l.v)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">${t('total')}</td><td class="r">${money(R.total)}</td></tr></tfoot></table></div></div>`;
  // tabla por día / mes
  if (R.it === 'all') {
    const rowsMap = new Map(); for (const p of R.list) { const k = R.byMonth ? p.fecha.slice(0, 7) : p.fecha; const c = calc(p), o = rowsMap.get(k) || { compras: 0, gastos: 0, otros: 0, realNoc: 0, realDia: 0, venta: 0, efDisp: 0, id: p.id }; for (const f of ['compras', 'gastos', 'otros', 'realNoc', 'realDia', 'venta']) o[f] += c[f]; o.efDisp = c.efDisp; o.id = p.id; rowsMap.set(k, o) }
    const ks = [...rowsMap.keys()].sort(), tot = f => ks.reduce((s, k) => s + rowsMap.get(k)[f], 0);
    h += `<div class="card"><h3>${R.byMonth ? t('porMes') : t('porDia')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${R.byMonth ? t('mesCol') : t('diaCol')}</th><th class="r">${t('compras')}</th><th class="r">${t('gastosOp')}</th><th class="r">${t('otros')}</th><th class="r">${t('realNoc')}</th><th class="r">${t('realDia')}</th><th class="r">${t('ventaTotal')}</th><th class="r">${t('efDispL')}</th></tr></thead><tbody>
    ${ks.map(k => { const o = rowsMap.get(k); return `<tr class="click" ${R.byMonth ? `data-month="${k}"` : `data-open="${o.id}"`}><td>${esc(keyLabel(k, R.byMonth))}</td><td class="r">${fmtN(o.compras)}</td><td class="r">${fmtN(o.gastos)}</td><td class="r">${fmtN(o.otros)}</td><td class="r">${fmtN(o.realNoc)}</td><td class="r">${fmtN(o.realDia)}</td><td class="r"><b>${fmtN(o.venta)}</b></td><td class="r">${fmtN(o.efDisp)}</td></tr>` }).join('')}
    </tbody><tfoot><tr><td>${t('total')}</td><td class="r">${fmtN(tot('compras'))}</td><td class="r">${fmtN(tot('gastos'))}</td><td class="r">${fmtN(tot('otros'))}</td><td class="r">${fmtN(tot('realNoc'))}</td><td class="r">${fmtN(tot('realDia'))}</td><td class="r">${fmtN(tot('venta'))}</td><td></td></tr></tfoot></table></div></div>`;
  } else if (!R.lines) {
    h += `<div class="card"><h3>${R.byMonth ? t('porMes') : t('porDia')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${R.byMonth ? t('mesCol') : t('diaCol')}</th><th class="r">${esc(itemLabel(R.it))}</th></tr></thead><tbody>${R.series.filter(x => x.n).map(x => `<tr><td>${esc(keyLabel(x.k, R.byMonth))}</td><td class="r num">${money(x.v)}</td></tr>`).join('')}</tbody><tfoot><tr><td>${t('total')}</td><td class="r">${money(R.total)}</td></tr></tfoot></table></div></div>`;
  }
  return h;
}
function bindReport() {
  const m = $('#main');
  m.onclick = e => {
    const per = e.target.closest('[data-per]'); if (per) { st.rep.per = per.dataset.per; if (per.dataset.per !== 'r') st.rep.anchor = hoy(); return render() }
    const b = e.target.closest('button');
    if (b && b.id === 'rPrev') return shift(-1); if (b && b.id === 'rNext') return shift(1);
    if (b && b.id === 'rWa') return sendWa(reportText());
    if (b && b.id === 'rPrint') return printHTML(`<div class="paper"><img src="img/logo.jpg" style="height:56px;display:block;margin:0 auto 10px;border-radius:4px">${$('#main').innerHTML.replace(/<div class="row" style="margin-top:12px">[\s\S]*?<\/div>/, '').replace(/<select[\s\S]*?<\/select>/, `<p><b>${esc(itemLabel(st.rep.item))}</b></p>`).replace(/<div class="chips"[\s\S]*?<\/div>/, '').replace(/<button[\s\S]*?<\/button>/g, '')}</div>`);
    if (b && b.id === 'rXls') return excelReport();
    const it = e.target.closest('[data-item]'); if (it) { st.rep.item = it.dataset.item; return render() }
    const op = e.target.closest('[data-open]'); if (op) return openView(op.dataset.open);
    const mo = e.target.closest('[data-month]'); if (mo) { st.rep.per = 'm'; st.rep.anchor = mo.dataset.month + '-01'; return render() }
    const bar = e.target.closest('.bar[data-day]'); if (bar && bar.dataset.day) { const p = planillas().find(x => x.fecha === bar.dataset.day); if (p) openView(p.id) }
  };
  m.onchange = e => {
    if (e.target.id === 'rItem') { st.rep.item = e.target.value; render() }
    if (e.target.id === 'rFrom') { st.rep.from = e.target.value; render() }
    if (e.target.id === 'rTo') { st.rep.to = e.target.value; render() }
  };
}
function reportText() {
  const R = report(), L = [`*PANTOJARTE · ${t('informe').toUpperCase()}*`, R.pr.label, itemLabel(R.it), ''];
  if (!R.list.length) { L.push(t('sinDatos')); return L.join('\n') }
  if (R.it === 'all') {
    L.push(`${t('ventaTotal')}: ${money(R.sum('venta'))}`, `${t('compras')}: ${money(R.sum('compras'))}`, `${t('gastosOp')}: ${money(R.sum('gastos'))}`, `${t('otros')}: ${money(R.sum('otros'))}`, `${t('dias')}: ${R.withPl}`, '');
    if (R.gastosBD.length) { L.push(`*${t('topGastos')}*`); R.gastosBD.slice(0, 8).forEach(x => L.push(`• ${x.name}: ${money(x.v)}`)); L.push('') }
    if (R.comprasBD.length) { L.push(`*${t('topCompras')}*`); R.comprasBD.slice(0, 8).forEach(x => L.push(`• ${x.name}: ${money(x.v)}`)) }
  } else {
    L.push(`*${t('total')}: ${money(R.total)}*`, `${t('promedio')}: ${money(R.total / (R.withPl || 1))}`, '');
    if (R.breakdown) R.breakdown.forEach(x => L.push(`• ${x.name}: ${money(x.v)}`));
    else if (R.lines) R.lines.forEach(l => L.push(`• ${fCorta(l.f)}${l.d ? ' · ' + l.d : ''}: ${money(l.v)}`));
    else R.series.filter(x => x.n).forEach(x => L.push(`• ${keyLabel(x.k, R.byMonth)}: ${money(x.v)}`));
  }
  return L.join('\n');
}
function excelReport() {
  const X = XL(); if (!X) return;
  const R = report(), wb = X.utils.book_new();
  const head = [['PANTOJARTE · ' + t('informe')], [R.pr.label], [itemLabel(R.it)], []];
  const rows = head.concat([[t('fecha'), t('compras'), t('gastosOp'), t('otros'), t('subtotal'), t('egNoc'), t('efNoc'), t('realNoc'), t('egDia'), t('efDia'), t('realDia'), t('saldoAnt'), t('efDispL'), t('ventaTotal'), t('nota')]]);
  R.list.forEach(p => { const c = calc(p); rows.push([p.fecha, c.compras, c.gastos, c.otros, c.sub, c.egNoc, c.efNoc, c.realNoc, c.egDia, c.efDia, c.realDia, c.saldoAnt, c.efDisp, c.venta, p.nota || '']) });
  X.utils.book_append_sheet(wb, sheetFrom(rows, [12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 30]), t('porDia').slice(0, 30));
  const det = head.concat([[t('fecha'), t('compras') + ' / ' + t('gastosOp'), t('producto') + ' / ' + t('tipo'), t('detalle'), t('valor'), t('otros')]]);
  R.list.forEach(p => { p.compras.forEach(r => det.push([p.fecha, t('compras'), r.p, '', r.v, ''])); p.gastos.forEach(r => det.push([p.fecha, t('gastosOp'), r.tipo, r.det, r.v, r.og])) });
  X.utils.book_append_sheet(wb, sheetFrom(det, [12, 22, 28, 28, 13, 13]), 'Detalle');
  if (R.it !== 'all') { const s = head.concat([[R.byMonth ? t('mesCol') : t('diaCol'), itemLabel(R.it)]]); R.series.forEach(x => s.push([x.k, x.v])); s.push([t('total'), R.total]); X.utils.book_append_sheet(wb, sheetFrom(s, [14, 18]), t('total')) }
  const bdA = (name, arr) => { if (!arr || !arr.length) return; const s = head.concat([[t('porItem'), t('veces'), t('total')]]); arr.forEach(x => s.push([x.name, x.n, x.v])); X.utils.book_append_sheet(wb, sheetFrom(s, [30, 8, 14]), name.slice(0, 30)) };
  bdA(t('compras'), R.comprasBD || (R.it === 'C*' ? R.breakdown : null)); bdA(t('gastosOp'), R.gastosBD || (R.it !== 'C*' ? R.breakdown : null));
  X.writeFile(wb, `Pantojarte_informe_${R.pr.from}_${R.pr.to}.xlsx`);
}

/* ---------- Listas y ajustes ---------- */
function listCard(kind) {
  const arr = cat[kind], title = kind === 'gastos' ? t('listaG') : t('listaP'), note = kind === 'gastos' ? t('listaGN') : t('listaPN');
  return `<div class="card"><h2>${title}</h2><p class="muted" style="margin-bottom:8px">${note}</p>
   <div class="row" style="margin-bottom:6px"><input class="inp grow" id="new_${kind}" placeholder="${esc(kind === 'gastos' ? t('nuevoG') : t('nuevoP'))}" style="flex:1"><button class="btn b-main b-sm" data-add="${kind}">${t('agregar')}</button></div>
   ${arr.map((x, i) => `<div class="li"><span>${esc(x)}</span><button class="btn b-line b-sm" data-ren="${kind}" data-i="${i}">${t('renombrar')}</button><button class="x" data-rm="${kind}" data-i="${i}">${t('quitar')}</button></div>`).join('')}</div>`;
}
function settingsHTML() {
  return listCard('gastos') + listCard('productos') + `<div class="card"><h2>${t('ajustes')}</h2>
   <label class="f" style="margin-top:8px">${t('idioma')}</label><div class="chips"><button class="chip ${lang === 'es' ? 'on' : ''}" data-lang="es">Español</button><button class="chip ${lang === 'en' ? 'on' : ''}" data-lang="en">English</button></div>
   <label class="f" style="margin-top:14px">${t('waDueno')}</label><div class="row"><input class="inp" id="sWa" inputmode="tel" value="${esc(wa)}" placeholder="3001234567" style="flex:1"><button class="btn b-soft b-sm" id="sWaOk">${t('guardar')}</button></div><p class="muted" style="margin-top:4px">${t('waDuenoN')}</p>
   <label class="f" style="margin-top:14px">${t('clave')}</label><div class="row"><input class="inp" id="sPin" type="password" value="${esc(pin)}" style="flex:1"><button class="btn b-soft b-sm" id="sPinOk">${t('guardar')}</button></div><p class="muted" style="margin-top:4px">${t('claveN')}</p>
   <h3 style="margin-top:16px">${t('respaldo')}</h3><p class="muted">${t('respN')}</p><div class="row" style="margin-top:8px"><button class="btn b-line b-sm" id="sDown">${t('bajar')}</button><label class="btn b-line b-sm">${t('subir')}<input type="file" id="sUp" accept=".json,application/json" hidden></label></div>
   <h3 style="margin-top:16px">${t('instalar')}</h3><p class="muted">${t('instN')}</p></div>`;
}
function bindSettings() {
  const m = $('#main');
  m.onchange = async e => {
    if (e.target.id === 'sUp' && e.target.files[0]) {
      try { const d = JSON.parse(await e.target.files[0].text()); let n = 0; for (const p of (d.planillas || [])) if (p && p.id && p.fecha) { db[p.id] = { ...p, _dirty: true, _stamp: uid() }; n++ } if (d.catalogo) { cat = { ...d.catalogo, _dirty: true, updatedAt: Date.now() }; saveCat() } saveDb(); toast(t('subido', { n })); render(); pushDirty().then(syncLine) } catch (er) { toast('Error') }
    }
  };
  m.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    const touch = () => { cat._dirty = true; cat.updatedAt = Date.now(); saveCat(); render(); pushDirty() };
    if (b.dataset.add) { const k = b.dataset.add, inp = $('#new_' + k), v = inp.value.trim(); if (!v) return inp.focus(); if (cat[k].some(x => x.toLowerCase() === v.toLowerCase())) return toast(t('yaEsta')); cat[k].push(v); touch(); toast(t('guardado')); return }
    if (b.dataset.ren) { const k = b.dataset.ren, i = +b.dataset.i, old = cat[k][i]; const v = await ask({ title: t('renombrar'), input: old }); if (!v || v === old) return; cat[k][i] = v; if (k === 'gastos') { for (const p of Object.values(db)) { let ch = false; for (const r of p.gastos) if (r.tipo === old) { r.tipo = v; ch = true } if (ch) { p._dirty = true; p._stamp = uid() } } saveDb() } touch(); return }
    if (b.dataset.rm) { const k = b.dataset.rm, i = +b.dataset.i; if (!(await ask({ title: t('quitar'), text: t('quitarQ', { x: cat[k][i] }), ok: t('quitar'), danger: true }))) return; cat[k].splice(i, 1); touch(); return }
    if (b.dataset.lang) { lang = b.dataset.lang; LS.set('pj_lang', lang); render(); return }
    if (b.id === 'sWaOk') { wa = $('#sWa').value.replace(/\D/g, ''); LS.set('pj_wa', wa); toast(t('guardado')); return }
    if (b.id === 'sPinOk') { pin = $('#sPin').value.trim(); LS.set('pj_pin', pin); toast(t('guardado')); refresh(true); return }
    if (b.id === 'sDown') {
      const data = { app: 'pantojarte', fecha: hoy(), planillas: Object.values(db).map(({ _dirty, _prev, _stamp, ...p }) => p), catalogo: { productos: cat.productos, gastos: cat.gastos } };
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })); a.download = `Pantojarte_respaldo_${hoy()}.json`; a.click();
    }
  };
}

/* ---------- Arranque ---------- */
$('nav .in').onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; st.tab = b.dataset.tab; window.scrollTo({ top: $('nav').offsetTop, behavior: 'smooth' }); render() };
$('#langBtn').onclick = () => { lang = lang === 'es' ? 'en' : 'es'; LS.set('pj_lang', lang); if (st.panel === 'view') openPanel('view'); render() };
$('#refBtn').onclick = () => refresh(true);
$('#main').addEventListener('click', e => {
  if (st.tab !== 'pl') return;
  const b = e.target.closest('button');
  if (b && b.id === 'goHoy') { const p = planillas().find(x => x.fecha === hoy()); return p ? openView(p.id) : openNew(hoy()) }
  if (b && b.id === 'goNew') return openNew(hoy());
  if (b && b.id === 'more') { st.showMonths += 3; refresh(); return }
  const pl = e.target.closest('.pl'); if (pl) return openView(pl.dataset.id);
  const bar = e.target.closest('.bar[data-day]'); if (bar) { const p = planillas().find(x => x.fecha === bar.dataset.day); if (p) openView(p.id); else openNew(bar.dataset.day) }
});
window.addEventListener('online', () => refresh());
document.addEventListener('visibilitychange', () => { if (!document.hidden && !st.panel) refresh() });
if ('serviceWorker' in navigator && ON_NETLIFY) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
refresh();
