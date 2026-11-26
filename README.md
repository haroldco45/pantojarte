# Pantojarte · Planilla Diaria

App (PWA) de Vibras Positivas HM para la planilla diaria de Pantojarte: compras, gastos operacionales (tipo de gasto con lista desplegable que se puede ampliar), cierre del turno de la noche y del día, saldo anterior, efectivo disponible, nota, e informes por fechas o por rubro (WhatsApp, impresión y Excel). Español e inglés.

## Publicar en Netlify
1. Conectar este repo en Netlify con el nombre de sitio `pantojarte` (queda en https://pantojarte.netlify.app).
2. No necesita comando de compilación; Netlify instala `@netlify/blobs` solo, y la función `netlify/functions/planillas.mjs` guarda las planillas en la nube.
3. Opcional: en *Site configuration › Environment variables* poner `APP_PIN` con una clave. La app la pide una vez en cada celular.

Si el sitio queda con otro nombre, cambie `SITE` en `app.js` y las URL `og:` de `index.html`.

## Cuentas de la planilla
- Sub total = compras + gastos operacionales + otros gastos
- Total realizado nocturno = total egreso nocturno + efectivo
- Egreso del día = sub total − egreso nocturno (se puede escribir otro valor)
- Realizado día = egreso del día + efectivo día
- Efectivo disponible = saldo anterior + efectivo noche + efectivo día (pasa como saldo anterior a la planilla siguiente)
- Venta total del día = realizado nocturno + realizado día
