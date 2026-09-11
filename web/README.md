# Dashboard VoC Cobranza

Tablero web (Vite + React + Recharts) que responde las cinco preguntas de negocio
del proyecto y documenta metodologia, EDA, propuesta RAG y limitaciones.

Sitio publicado (GitHub Pages): `https://andr3smor.github.io/Nexa-EDA/`

## Arquitectura

```
outputs/*.csv  ──►  scripts/construir_agregados.py  ──►  web/src/datos/agregados.json  ──►  build Vite  ──►  GitHub Pages
   (extraccion IA)        (agregacion, sin LLM)              (versionado en git)          (GitHub Actions)
```

- `web/src/datos/agregados.json` **se versiona**: es la unica entrada de datos del
  build. El workflow de GitHub Actions **no** ejecuta la extraccion ni llama al LLM.
- Los controles de calidad (auditoria de citas por rol, validacion contra NPS) se
  toman de `docs/BRIEFING_RAG.md` y se declaran en el tablero: las respuestas a las
  preguntas (a) y (c) no son utilizables con la corrida actual.

## Refrescar los datos

Cuando cambien los CSV de `outputs/` (reproceso de las 63 conversaciones fallidas,
revision de `motivo_no_pago`, autoconsistencia):

```bash
PYTHONIOENCODING=utf-8 python scripts/construir_agregados.py
git add web/src/datos/agregados.json
git commit -m "datos: refresco de agregados"
git push
```

El push a `master` que toque `web/**` dispara el deploy.

## Desarrollo local

```bash
cd web
npm install
npm run dev        # servidor de desarrollo
npm run build      # genera web/dist/
npm run preview    # sirve web/dist/ en local
```

Para servir en la raiz en vez de `/Nexa-EDA/` (p. ej. un fork con otro nombre):
`VITE_BASE=/ npm run build`.

## Despliegue

`.github/workflows/pages.yml` construye `web/` y publica en GitHub Pages en cada
push a `master` que toque `web/**`, y bajo demanda (`workflow_dispatch`).

Requisito inicial (una sola vez): en el repo, **Settings → Pages → Build and
deployment → Source = GitHub Actions**.
