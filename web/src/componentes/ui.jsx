import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

// ─── PALETA OFICIAL ─────────────────────────────────────────────────────────────
export const PALETA = {
  accent:   "#6366f1",
  blue:     "#3b82f6",
  green:    "#10b981",
  orange:   "#f97316",
  red:      "#ef4444",
  purple:   "#8b5cf6",
  cyan:     "#06b6d4",
  yellow:   "#f59e0b",
  indigo:   "#6366f1",
  teal:     "#14b8a6",
};

// Legacy alias
export const PALETA_PBI = {
  azul1: PALETA.blue,
  azul2: "#3730a3",
  morado: PALETA.purple,
  cian: PALETA.cyan,
  verde: PALETA.green,
  naranja: PALETA.orange,
  rojo: PALETA.red,
  gris: "#64748b",
  borde: "#e2e8f0",
  fondoVisual: "#ffffff",
  fondoCanvas: "#f8fafc",
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
export function PbiCard({ valor, titulo, subtitulo, indicadorColor, icono }) {
  return (
    <div className="kpi-card">
      {indicadorColor && (
        <div className="kpi-card-accent" style={{ background: indicadorColor }} />
      )}
      {icono && <div className="kpi-card-icon">{icono}</div>}
      <div className="kpi-card-value">{valor}</div>
      <div className="kpi-card-label">{titulo}</div>
      {subtitulo && <div className="kpi-card-sub">{subtitulo}</div>}
    </div>
  );
}

// ─── PANEL VISUAL ─────────────────────────────────────────────────────────────
export function PbiVisual({ titulo, subtitulo, children, accion, pie }) {
  return (
    <div className="panel">
      {(titulo || accion) && (
        <div className="panel-header">
          <div className="panel-title-group">
            {titulo && <h3 className="panel-title">{titulo}</h3>}
            {subtitulo && <span className="panel-subtitle">{subtitulo}</span>}
          </div>
          {accion && <div className="panel-action">{accion}</div>}
        </div>
      )}
      <div className="panel-body">{children}</div>
      {pie && <div className="panel-footer">{pie}</div>}
    </div>
  );
}

// ─── SLICER ───────────────────────────────────────────────────────────────────
export function PbiSlicer({ etiqueta, opciones, valorSeleccionado, alCambiar }) {
  return (
    <div className="slicer-bar">
      {etiqueta && <span className="slicer-label">{etiqueta}</span>}
      <div className="slicer-chips">
        {opciones.map((op) => {
          const val   = typeof op === "object" ? op.valor : op;
          const texto = typeof op === "object" ? op.etiqueta : op;
          const cant  = typeof op === "object" ? op.contador : null;
          const activo = valorSeleccionado === val;
          return (
            <button
              key={val}
              type="button"
              className={`chip ${activo ? "active" : ""}`}
              onClick={() => alCambiar(val)}
            >
              {texto}
              {cant != null && (
                <span style={{ opacity: 0.75, fontSize: "10px" }}>({cant})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CUSTOM TOOLTIP para Recharts ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label, sufijo = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      <div className="custom-tooltip-value">
        {payload[0].value?.toLocaleString("es")}{sufijo}
      </div>
    </div>
  );
}

// ─── BAR CHART HORIZONTAL ─────────────────────────────────────────────────────
export function PbiBarChart({ datos, campo = "n", altura, color = PALETA.accent, sufijo = "" }) {
  const h = altura ?? Math.max(140, datos.length * 34 + 20);
  return (
    <div style={{ width: "100%", height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 2, right: 55, bottom: 2, left: 8 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="clave"
            width={200}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#475569", fontFamily: "Inter, sans-serif" }}
          />
          <Tooltip
            content={<CustomTooltip sufijo={sufijo} />}
            cursor={{ fill: "rgba(99,102,241,0.05)" }}
          />
          <Bar dataKey={campo} fill={color} barSize={18} radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey={campo}
              position="right"
              formatter={(v) => `${v?.toLocaleString("es")}${sufijo}`}
              style={{
                fill: "#0f172a",
                fontSize: 11.5,
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── DATA TABLE CON PAGINACIÓN Y BÚSQUEDA ────────────────────────────────────
export function PbiTable({ columnas, filas, filasPorPagina = 10, conBuscador = false }) {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");

  const filtradas = conBuscador && busqueda.trim()
    ? filas.filter((f) =>
        Object.values(f).some(
          (v) => v != null && String(v).toLowerCase().includes(busqueda.toLowerCase())
        )
      )
    : filas;

  const total = filtradas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / filasPorPagina));
  const inicio = (pagina - 1) * filasPorPagina;
  const visibles = filtradas.slice(inicio, inicio + filasPorPagina);

  return (
    <div className="table-container">
      {conBuscador && (
        <div className="table-search-bar">
          <input
            type="text"
            className="input-search"
            placeholder="Buscar registros..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {total.toLocaleString("es")} registros
          </span>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th
                key={col.clave}
                className={col.num ? "num" : undefined}
                style={{ width: col.ancho }}
              >
                {col.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibles.length === 0 ? (
            <tr>
              <td
                colSpan={columnas.length}
                style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}
              >
                Sin registros
              </td>
            </tr>
          ) : (
            visibles.map((fila, idx) => (
              <tr key={idx}>
                {columnas.map((col) => {
                  if (col.conBarra) {
                    const pct = Math.min(100, Math.max(0, col.conBarra(fila)));
                    return (
                      <td key={col.clave} className="num data-bar-cell">
                        <div className="data-bar-track">
                          <div
                            className="data-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: col.colorBarra || PALETA.accent,
                            }}
                          />
                          <span className="data-bar-text">
                            {col.render ? col.render(fila) : fila[col.clave]}
                          </span>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={col.clave} className={col.num ? "num" : undefined}>
                      {col.render ? col.render(fila) : fila[col.clave]}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {totalPaginas > 1 && (
        <div className="table-pagination">
          <button
            type="button"
            className="pag-btn"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className="pag-info">
            Página {pagina} de {totalPaginas} · {total.toLocaleString("es")} registros
          </span>
          <button
            type="button"
            className="pag-btn"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CALLOUT ──────────────────────────────────────────────────────────────────
const CALLOUT_ICONS = {
  info:    "—",
  success: "+",
  warning: "!",
  danger:  "!",
  accent:  "·",
};

export function PbiCallout({ titulo, children, tipo = "info" }) {
  return (
    <div className={`callout callout-${tipo}`}>
      <span className="callout-icon">{CALLOUT_ICONS[tipo] ?? "ℹ️"}</span>
      <div className="callout-content">
        {titulo && <div className="callout-title">{titulo}</div>}
        <div className="callout-body">{children}</div>
      </div>
    </div>
  );
}
