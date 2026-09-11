import React, { useState, useMemo } from "react";
import { PbiVisual, PbiCard, PbiSlicer, PALETA_PBI } from "./ui.jsx";
import datosLlamadas from "../datos/conversaciones_resumen.json";

export function ExploradorLlamadas() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroAcuerdo, setFiltroAcuerdo] = useState("todos");
  const [filtroScore, setFiltroScore] = useState("todos");
  const [filtroFriccion, setFiltroFriccion] = useState("todos");
  const [seleccionada, setSeleccionada] = useState(datosLlamadas[0] || null);
  const [pagina, setPagina] = useState(1);
  const porPagina = 12;

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
    <div className="pbi-canvas-page">
      <div className="pbi-section-title-bar">
        <span className="pbi-section-tag">Pregunta (d) · Auditoría de Casos</span>
        <h2 className="pbi-section-heading">
          Explorador de Casos y Resúmenes de Conversación (1.197 Conversaciones)
        </h2>
      </div>

      {/* Panel Superior de Slicers de Power BI */}
      <div className="pbi-filters-panel">
        <div className="pbi-filter-input-cell">
          <label className="pbi-filter-label">Búsqueda rápida:</label>
          <input
            type="text"
            className="pbi-input-text"
            placeholder="Buscar por ID o texto en resumen..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
        </div>

        <PbiSlicer
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

        <PbiSlicer
          etiqueta="Score Satisfacción"
          opciones={[
            { valor: "todos", etiqueta: "Todos" },
            { valor: "baja", etiqueta: "Baja (<50)" },
            { valor: "media", etiqueta: "Media (50-75)" },
            { valor: "alta", etiqueta: "Alta (>75)" },
          ]}
          valorSeleccionado={filtroScore}
          alCambiar={(v) => {
            setFiltroScore(v);
            setPagina(1);
          }}
        />

        <PbiSlicer
          etiqueta="Fricción Bot"
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

      {/* Grid Principal: Matriz de Casos + Panel de Detalle */}
      <div className="pbi-explorer-grid">
        <div className="pbi-explorer-table-cell">
          <div className="pbi-table-toolbar-info">
            Registros encontrados: <strong>{total}</strong> de {datosLlamadas.length}
          </div>

          <div className="pbi-table-wrapper">
            <table className="pbi-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>ID Conversación</th>
                  <th>Resumen de la Interacción</th>
                  <th style={{ width: "140px" }}>Motivo Identificado</th>
                  <th style={{ width: "80px" }} className="num">Acuerdo</th>
                  <th style={{ width: "70px" }} className="num">Score</th>
                  <th style={{ width: "60px" }} className="num">Msjs</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((item) => {
                  const seleccionadaActual = seleccionada?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={seleccionadaActual ? "row-selected" : ""}
                      onClick={() => setSeleccionada(item)}
                    >
                      <td><strong>{item.id}</strong></td>
                      <td><div className="table-clamp-text">{item.resumen}</div></td>
                      <td>
                        <span className="pbi-motivo-tag">
                          {item.motivo === "NINGUNO" ? "No declarado" : item.motivo.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="num">{item.acuerdo ? "Sí" : "No"}</td>
                      <td className="num">
                        <span
                          style={{
                            fontWeight: 600,
                            color: item.score < 40 ? PALETA_PBI.rojo : item.score > 70 ? PALETA_PBI.verde : PALETA_PBI.gris,
                          }}
                        >
                          {item.score}
                        </span>
                      </td>
                      <td className="num">{item.mensajes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pbi-table-pagination">
              <button
                type="button"
                className="pbi-pag-btn"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="pbi-pag-text">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                className="pbi-pag-btn"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Detalle del Caso Seleccionado */}
        <div className="pbi-explorer-detail-cell">
          {seleccionada && (
            <PbiVisual
              titulo={`Detalle: ${seleccionada.id}`}
              subtitulo={`Score Calculado: ${seleccionada.score} / 100`}
            >
              <div className="pbi-detail-block">
                <div className="detail-header-label">Resumen de la Conversación</div>
                <p className="detail-body-text">{seleccionada.resumen}</p>
              </div>

              <div className="pbi-detail-meta-grid">
                <div>
                  <span className="meta-k">Acuerdo de Pago</span>
                  <span className="meta-v">{seleccionada.acuerdo ? "Sí (Verificado)" : "No formalizado"}</span>
                </div>
                <div>
                  <span className="meta-k">Tipo de Fecha</span>
                  <span className="meta-v">{seleccionada.tipo_fecha}</span>
                </div>
                <div>
                  <span className="meta-k">Motivo Asignado</span>
                  <span className="meta-v">{seleccionada.motivo}</span>
                </div>
                <div>
                  <span className="meta-k">Fricción de Bot</span>
                  <span className="meta-v">{seleccionada.friccion_bot ? "Sí" : "No"}</span>
                </div>
              </div>

              {seleccionada.factores && seleccionada.factores.length > 0 && (
                <div className="pbi-detail-block" style={{ marginTop: 10 }}>
                  <div className="detail-header-label">Factores de Insatisfacción</div>
                  <div className="pbi-factors-chips">
                    {seleccionada.factores.map((fac, idx) => (
                      <span key={idx} className="pbi-chip-danger">{fac.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              )}

              {seleccionada.recomendacion && (
                <div className="pbi-detail-block" style={{ marginTop: 10 }}>
                  <div className="detail-header-label">Recomendación Operativa</div>
                  <div className="pbi-rec-quote">{seleccionada.recomendacion}</div>
                </div>
              )}
            </PbiVisual>
          )}
        </div>
      </div>
    </div>
  );
}
