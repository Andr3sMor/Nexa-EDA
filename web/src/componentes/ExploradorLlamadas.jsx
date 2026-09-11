import React, { useState, useMemo } from "react";
import { Pill, Slicer, Card } from "./ui.jsx";
import datosLlamadas from "../datos/conversaciones_resumen.json";

export function ExploradorLlamadas() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroAcuerdo, setFiltroAcuerdo] = useState("todos");
  const [filtroScore, setFiltroScore] = useState("todos");
  const [filtroFriccion, setFiltroFriccion] = useState("todos");
  const [seleccionada, setSeleccionada] = useState(null);
  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  // Filtrado reactivo en cliente (1.197 conversaciones)
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datosLlamadas.filter((item) => {
      if (q) {
        const idMatch = item.id.toLowerCase().includes(q);
        const resumenMatch = item.resumen.toLowerCase().includes(q);
        const motivoMatch = item.motivo.toLowerCase().includes(q);
        if (!idMatch && !resumenMatch && !motivoMatch) return false;
      }
      if (filtroAcuerdo === "si" && !item.acuerdo) return false;
      if (filtroAcuerdo === "no" && item.acuerdo) return false;

      if (filtroScore === "baja" && item.score >= 50) return false;
      if (filtroScore === "media" && (item.score < 50 || item.score > 75)) return false;
      if (filtroScore === "alta" && item.score <= 75) return false;

      if (filtroFriccion === "si" && !item.friccion_bot) return false;
      if (filtroFriccion === "no" && item.friccion_bot) return false;

      return true;
    });
  }, [busqueda, filtroAcuerdo, filtroScore, filtroFriccion]);

  const total = filtradas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const visibles = filtradas.slice(inicio, inicio + porPagina);

  return (
    <div className="pbi-page-container">
      <div className="pbi-page-header">
        <div>
          <span className="pbi-section-pill">Pregunta d · Resumen de Llamadas</span>
          <h2 className="pbi-page-title">Explorador de Conversaciones de WhatsApp</h2>
          <p className="pbi-page-desc">
            Base de datos interactiva con los resúmenes y variables de las{" "}
            <strong>{datosLlamadas.length.toLocaleString("es")} conversaciones</strong> analizadas con{" "}
            <code>gpt-4o-mini</code>. Permite auditar cada caso de cobranza de forma instantánea.
          </p>
        </div>
      </div>

      {/* Barra de Filtros / Slicers tipo Power BI */}
      <div className="pbi-filters-panel">
        <div className="pbi-filter-group">
          <label className="pbi-filter-label">Búsqueda rápida:</label>
          <input
            type="text"
            className="pbi-input-search"
            placeholder="Buscar por ID (ej. CONV_00000042) o palabras clave..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
        </div>

        <Slicer
          etiqueta="Acuerdo de Pago"
          opciones={[
            { valor: "todos", etiqueta: "Todos" },
            { valor: "si", etiqueta: "Con Acuerdo (78)" },
            { valor: "no", etiqueta: "Sin Acuerdo" },
          ]}
          valorSeleccionado={filtroAcuerdo}
          alCambiar={(v) => {
            setFiltroAcuerdo(v);
            setPagina(1);
          }}
        />

        <Slicer
          etiqueta="Nivel de Satisfacción"
          opciones={[
            { valor: "todos", etiqueta: "Todos" },
            { valor: "baja", etiqueta: "Crítica (<50)" },
            { valor: "media", etiqueta: "Media (50-75)" },
            { valor: "alta", etiqueta: "Alta (>75)" },
          ]}
          valorSeleccionado={filtroScore}
          alCambiar={(v) => {
            setFiltroScore(v);
            setPagina(1);
          }}
        />

        <Slicer
          etiqueta="Fricción con Bot"
          opciones={[
            { valor: "todos", etiqueta: "Todos" },
            { valor: "si", etiqueta: "Con Fricción" },
            { valor: "no", etiqueta: "Sin Fricción" },
          ]}
          valorSeleccionado={filtroFriccion}
          alCambiar={(v) => {
            setFiltroFriccion(v);
            setPagina(1);
          }}
        />
      </div>

      {/* Contenido principal: Tabla + Panel lateral de inspección */}
      <div className="pbi-explorer-layout">
        <div className="pbi-explorer-table-col">
          <div className="pbi-table-summary">
            Mostrando <strong>{visibles.length}</strong> de <strong>{total}</strong> conversaciones encontradas
            {busqueda && ` para "${busqueda}"`}
          </div>

          <div className="tabla-wrap">
            <table className="pbi-tabla pbi-interactive-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>ID Conversación</th>
                  <th>Resumen Sintético de la Llamada</th>
                  <th style={{ width: 150 }}>Motivo No Pago</th>
                  <th style={{ width: 90 }} className="num">Acuerdo</th>
                  <th style={{ width: 85 }} className="num">Score</th>
                  <th style={{ width: 70 }} className="num">Msjs</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--pbi-text-sub)" }}>
                      No hay conversaciones que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  visibles.map((item) => {
                    const activa = seleccionada?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`pbi-row-selectable ${activa ? "fila-activa" : ""}`}
                        onClick={() => setSeleccionada(item)}
                        title="Clic para ver detalle completo"
                      >
                        <td>
                          <strong>{item.id}</strong>
                        </td>
                        <td>
                          <div className="pbi-summary-clamp">{item.resumen}</div>
                        </td>
                        <td>
                          <span className="pbi-tag-motivo">
                            {item.motivo === "NINGUNO" ? "— No declarado —" : item.motivo.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="num">
                          <Pill activo={item.acuerdo} />
                        </td>
                        <td className="num">
                          <span
                            className={
                              item.score < 40
                                ? "pbi-score-danger"
                                : item.score > 70
                                ? "pbi-score-success"
                                : "pbi-score-mid"
                            }
                          >
                            {item.score}
                          </span>
                        </td>
                        <td className="num">{item.mensajes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="pbi-paginacion">
            <button
              type="button"
              className="pbi-pag-btn"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </button>
            <span className="pbi-pag-info">
              Página {pagina} de {totalPaginas} ({total} conversaciones)
            </span>
            <button
              type="button"
              className="pbi-pag-btn"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente →
            </button>
          </div>
        </div>

        {/* Panel lateral de inspección de la conversación seleccionada */}
        <div className="pbi-explorer-detail-col">
          {seleccionada ? (
            <Card
              titulo={`Detalle de ${seleccionada.id}`}
              badge={`Score: ${seleccionada.score} / 100`}
            >
              <div className="pbi-detail-section">
                <div className="pbi-detail-label">RESUMEN DEL LLM</div>
                <p className="pbi-detail-text">{seleccionada.resumen}</p>
              </div>

              <div className="pbi-detail-grid">
                <div className="pbi-detail-item">
                  <span className="pbi-detail-k">Acuerdo de Pago:</span>
                  <span className="pbi-detail-v">
                    <Pill activo={seleccionada.acuerdo} /> ({seleccionada.tipo_fecha})
                  </span>
                </div>
                <div className="pbi-detail-item">
                  <span className="pbi-detail-k">Motivo Asignado:</span>
                  <span className="pbi-detail-v">{seleccionada.motivo}</span>
                </div>
                <div className="pbi-detail-item">
                  <span className="pbi-detail-k">Fricción con Bot:</span>
                  <span className="pbi-detail-v">{seleccionada.friccion_bot ? "⚠️ Sí detectada" : "✓ No"}</span>
                </div>
                <div className="pbi-detail-item">
                  <span className="pbi-detail-k">Total Mensajes:</span>
                  <span className="pbi-detail-v">{seleccionada.mensajes} mensajes</span>
                </div>
              </div>

              {seleccionada.factores && seleccionada.factores.length > 0 && (
                <div className="pbi-detail-section">
                  <div className="pbi-detail-label">FACTORES DE INSATISFACCIÓN</div>
                  <div className="pbi-factor-tags">
                    {seleccionada.factores.map((fac, idx) => (
                      <span key={idx} className="pbi-tag-error">
                        {fac.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {seleccionada.recomendacion && (
                <div className="pbi-detail-section">
                  <div className="pbi-detail-label">RECOMENDACIÓN DE MEJORA OPERATIVA</div>
                  <div className="pbi-rec-box">💡 {seleccionada.recomendacion}</div>
                </div>
              )}
            </Card>
          ) : (
            <div className="pbi-placeholder-card">
              <span style={{ fontSize: 32 }}>👈</span>
              <p>Selecciona una conversación de la tabla para ver su análisis detallado y recomendaciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
