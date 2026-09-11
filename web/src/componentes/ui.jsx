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
  PieChart,
  Pie,
} from "recharts";

// Paleta corporativa Power BI / Stitch (Deep Trust Navy, Cobalt, Emerald, Amber, Rose)
export const PALETA = {
  primario: "#0a2540",
  secundario: "#0078d4",
  acento: "#0284c7",
  acentoClaro: "#e0f2fe",
  exito: "#059669",
  alerta: "#d97706",
  peligro: "#dc2626",
  neutro: "#64748b",
  fondoGrafico: "#f8fafc",
  colores: [
    "#0078d4",
    "#0284c7",
    "#0d9488",
    "#10b981",
    "#f59e0b",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#64748b",
  ],
};

/** Tarjeta KPI estilo Power BI */
export function Kpi({ valor, etiqueta, subtitulo, estado = "normal", icono }) {
  const bordeClase =
    estado === "exito"
      ? "kpi-exito"
      : estado === "alerta"
      ? "kpi-alerta"
      : estado === "peligro"
      ? "kpi-peligro"
      : "kpi-primario";

  return (
    <div className={`pbi-kpi-card ${bordeClase}`}>
      <div className="pbi-kpi-top">
        <span className="pbi-kpi-etiqueta">{etiqueta}</span>
        {icono && <span className="pbi-kpi-icono">{icono}</span>}
      </div>
      <div className="pbi-kpi-valor">{valor}</div>
      {subtitulo && <div className="pbi-kpi-sub">{subtitulo}</div>}
    </div>
  );
}

/** Contenedor Visual estilo Power BI Tile */
export function Card({ titulo, subtitulo, children, nota, badge, accion }) {
  return (
    <div className="pbi-card">
      {(titulo || badge || accion) && (
        <div className="pbi-card-header">
          <div>
            {titulo && <h3 className="pbi-card-title">{titulo}</h3>}
            {subtitulo && <p className="pbi-card-subtitle">{subtitulo}</p>}
          </div>
          <div className="pbi-card-actions">
            {badge && <span className="pbi-badge">{badge}</span>}
            {accion}
          </div>
        </div>
      )}
      <div className="pbi-card-body">{children}</div>
      {nota && <div className="pbi-card-footer">{nota}</div>}
    </div>
  );
}

/** Aviso metodológico o alerta */
export function Aviso({ children, tipo = "info" }) {
  const icono =
    tipo === "peligro" ? "⚠️" : tipo === "alerta" ? "⚡" : tipo === "exito" ? "✓" : "ℹ️";
  return (
    <div className={`pbi-aviso aviso-${tipo}`}>
      <span className="pbi-aviso-icono">{icono}</span>
      <div className="pbi-aviso-texto">{children}</div>
    </div>
  );
}

/** Cita textual con fuente */
export function Cita({ texto, fuente, etiqueta }) {
  return (
    <blockquote className="pbi-cita">
      <div className="pbi-cita-texto">{texto}</div>
      {(fuente || etiqueta) && (
        <div className="pbi-cita-meta">
          {fuente && <span className="pbi-cita-fuente">{fuente}</span>}
          {etiqueta && <span className="pbi-cita-tag">{etiqueta}</span>}
        </div>
      )}
    </blockquote>
  );
}

/** Pill / Badge de estado */
export function Pill({ activo, si = "Sí", no = "No", variante }) {
  let clase = "pbi-pill";
  if (variante) {
    clase += ` pill-${variante}`;
  } else {
    clase += activo ? " pill-si" : " pill-no";
  }
  return <span className={clase}>{typeof activo === "boolean" ? (activo ? si : no) : activo}</span>;
}

/** Segmentador / Slicer estilo Power BI */
export function Slicer({ opciones, valorSeleccionado, alCambiar, etiqueta }) {
  return (
    <div className="pbi-slicer">
      {etiqueta && <span className="pbi-slicer-label">{etiqueta}:</span>}
      <div className="pbi-slicer-items">
        {opciones.map((op) => {
          const valor = typeof op === "object" ? op.valor : op;
          const texto = typeof op === "object" ? op.etiqueta : op;
          const contador = typeof op === "object" ? op.contador : null;
          const activo = valorSeleccionado === valor;
          return (
            <button
              key={valor}
              type="button"
              className={`pbi-slicer-btn ${activo ? "activo" : ""}`}
              onClick={() => alCambiar(valor)}
            >
              {texto}
              {contador != null && <span className="pbi-slicer-count">{contador}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Gráfico de Barras Horizontales */
export function BarrasH({ datos, campo = "n", etiquetaValor, altura, destacar, colorBase }) {
  const h = altura ?? Math.max(130, datos.length * 36 + 25);
  const color = colorBase || PALETA.secundario;

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={datos}
        layout="vertical"
        margin={{ top: 6, right: 48, bottom: 6, left: 12 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="clave"
          width={210}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11.5, fill: "var(--pbi-text-sub)" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0, 120, 212, 0.06)" }}
          contentStyle={{
            background: "var(--pbi-surface)",
            border: "1px solid var(--pbi-border)",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: 12.5,
          }}
          formatter={(v) => [etiquetaValor ? `${v}${etiquetaValor}` : v.toLocaleString("es"), campo]}
        />
        <Bar dataKey={campo} radius={[0, 4, 4, 0]} barSize={18}>
          {datos.map((d, i) => (
            <Cell
              key={i}
              fill={destacar && destacar(d) ? PALETA.primario : color}
            />
          ))}
          <LabelList
            dataKey={campo}
            position="right"
            formatter={(v) => (etiquetaValor ? `${v}${etiquetaValor}` : v.toLocaleString("es"))}
            style={{ fill: "var(--pbi-text-main)", fontSize: 11.5, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Gráfico Donut para proporciones */
export function GraficoDonut({ datos, campo = "n", clave = "clave", altura = 220 }) {
  return (
    <div style={{ width: "100%", height: altura }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={datos}
            dataKey={campo}
            nameKey={clave}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={3}
          >
            {datos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PALETA.colores[index % PALETA.colores.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--pbi-surface)",
              border: "1px solid var(--pbi-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(val, name) => [`${val.toLocaleString("es")} (${((val / datos.reduce((a, b) => a + b[campo], 0)) * 100).toFixed(1)}%)`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tabla con formato condicional y estilo Power BI */
export function Tabla({ columnas, filas, filasPorPagina, conBuscador = false }) {
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState("");

  const filasFiltradas = conBuscador && filtro.trim()
    ? filas.filter((f) =>
        Object.values(f).some(
          (v) => v != null && String(v).toLowerCase().includes(filtro.toLowerCase())
        )
      )
    : filas;

  const total = filasFiltradas.length;
  const porPag = filasPorPagina || total;
  const totalPaginas = Math.max(1, Math.ceil(total / porPag));
  const inicio = (pagina - 1) * porPag;
  const fin = inicio + porPag;
  const filasVisibles = filasPorPagina ? filasFiltradas.slice(inicio, fin) : filasFiltradas;

  return (
    <div className="pbi-tabla-container">
      {conBuscador && (
        <div className="pbi-tabla-toolbar">
          <input
            type="text"
            className="pbi-input"
            placeholder="Filtrar en tabla..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPagina(1);
            }}
          />
          <span className="pbi-tabla-count">{total} registros</span>
        </div>
      )}
      <div className="tabla-wrap">
        <table className="pbi-tabla">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.clave} className={c.num ? "num" : undefined} style={{ width: c.ancho }}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasVisibles.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} style={{ textAlign: "center", padding: 20, color: "var(--pbi-text-sub)" }}>
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              filasVisibles.map((f, i) => (
                <tr key={i}>
                  {columnas.map((c) => (
                    <td key={c.clave} className={c.num ? "num" : undefined}>
                      {c.render ? c.render(f) : f[c.clave]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filasPorPagina && totalPaginas > 1 && (
        <div className="pbi-paginacion">
          <button
            type="button"
            className="pbi-pag-btn"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className="pbi-pag-info">
            Página {pagina} de {totalPaginas} ({total} filas)
          </span>
          <button
            type="button"
            className="pbi-pag-btn"
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
