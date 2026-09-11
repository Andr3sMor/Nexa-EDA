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

// Paleta oficial predeterminada de Microsoft Power BI
export const PALETA_PBI = {
  azul1: "#118DFF",
  azul2: "#12239E",
  morado: "#5C2D91",
  cian: "#00B4D8",
  verde: "#059669",
  naranja: "#E66C37",
  rojo: "#D83B01",
  gris: "#605E5C",
  borde: "#E1DFDD",
  fondoVisual: "#FFFFFF",
  fondoCanvas: "#F3F2F1",
};

/** Visual Card de Power BI (Tarjeta de valor único) */
export function PbiCard({ valor, titulo, subtitulo, indicadorColor }) {
  return (
    <div className="pbi-visual pbi-visual-card">
      {indicadorColor && (
        <div className="pbi-card-indicator" style={{ backgroundColor: indicadorColor }} />
      )}
      <div className="pbi-card-content">
        <div className="pbi-card-value">{valor}</div>
        <div className="pbi-card-title">{titulo}</div>
        {subtitulo && <div className="pbi-card-sub">{subtitulo}</div>}
      </div>
    </div>
  );
}

/** Visual Container genérico de Power BI (Contenedor con barra de título sobria) */
export function PbiVisual({ titulo, subtitulo, children, accion, pie }) {
  return (
    <div className="pbi-visual">
      {(titulo || accion) && (
        <div className="pbi-visual-header">
          <div className="pbi-visual-title-box">
            {titulo && <h3 className="pbi-visual-title">{titulo}</h3>}
            {subtitulo && <span className="pbi-visual-subtitle">{subtitulo}</span>}
          </div>
          {accion && <div className="pbi-visual-action">{accion}</div>}
        </div>
      )}
      <div className="pbi-visual-body">{children}</div>
      {pie && <div className="pbi-visual-footer">{pie}</div>}
    </div>
  );
}

/** Segmentador / Slicer estilo Power BI (Lista de opciones sobria con radio o botón) */
export function PbiSlicer({ etiqueta, opciones, valorSeleccionado, alCambiar }) {
  return (
    <div className="pbi-slicer-container">
      {etiqueta && <span className="pbi-slicer-title">{etiqueta}</span>}
      <div className="pbi-slicer-list">
        {opciones.map((op) => {
          const val = typeof op === "object" ? op.valor : op;
          const texto = typeof op === "object" ? op.etiqueta : op;
          const cant = typeof op === "object" ? op.contador : null;
          const activo = valorSeleccionado === val;
          return (
            <button
              key={val}
              type="button"
              className={`pbi-slicer-item ${activo ? "activo" : ""}`}
              onClick={() => alCambiar(val)}
            >
              <span className="pbi-slicer-text">{texto}</span>
              {cant != null && <span className="pbi-slicer-count">({cant})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Gráfico de Barras Horizontales estilo Clustered Bar Chart de Power BI */
export function PbiBarChart({ datos, campo = "n", altura, color = PALETA_PBI.azul1, sufijo = "" }) {
  const h = altura ?? Math.max(120, datos.length * 28 + 20);
  return (
    <div style={{ width: "100%", height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 2, right: 45, bottom: 2, left: 10 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="clave"
            width={210}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#252423" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 120, 212, 0.05)" }}
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E1DFDD",
              borderRadius: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              fontSize: 11,
              padding: "6px 10px",
            }}
            formatter={(val) => [`${val.toLocaleString("es")}${sufijo}`, campo]}
          />
          <Bar dataKey={campo} fill={color} barSize={15} radius={[0, 1, 1, 0]}>
            <LabelList
              dataKey={campo}
              position="right"
              formatter={(v) => `${v.toLocaleString("es")}${sufijo}`}
              style={{ fill: "#323130", fontSize: 10.5, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tabla / Matriz con formato condicional de barras de datos (Data Bars) de Power BI */
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
    <div className="pbi-table-wrapper">
      {conBuscador && (
        <div className="pbi-table-search-bar">
          <input
            type="text"
            className="pbi-input-text"
            placeholder="Buscar registros..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
          <span className="pbi-table-total-count">{total} filas</span>
        </div>
      )}
      <table className="pbi-matrix-table">
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
              <td colSpan={columnas.length} style={{ textAlign: "center", padding: 16, color: "#605E5C" }}>
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
                      <td key={col.clave} className="num td-data-bar">
                        <div className="pbi-bar-container">
                          <div
                            className="pbi-bar-fill"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: col.colorBarra || PALETA_PBI.azul1,
                            }}
                          />
                          <span className="pbi-bar-label">
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
        <div className="pbi-table-pagination">
          <button
            type="button"
            className="pbi-pag-btn"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </button>
          <span className="pbi-pag-text">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            className="pbi-pag-btn"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

/** Cuadro de Nota Analítica o Alerta Regulatoria */
export function PbiCallout({ titulo, children, tipo = "info" }) {
  return (
    <div className={`pbi-callout callout-${tipo}`}>
      {titulo && <div className="pbi-callout-title">{titulo}</div>}
      <div className="pbi-callout-body">{children}</div>
    </div>
  );
}
