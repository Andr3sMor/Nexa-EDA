import React from "react";
import d from "../datos/agregados.json";

export const PAGINAS = [
  { id: "resumen", titulo: "Resumen General" },
  { id: "preguntas", titulo: "Preguntas de Negocio (a - e)" },
  { id: "explorador", titulo: "Explorador de Casos (1.197)" },
  { id: "copiloto_rag", titulo: "Copiloto RAG en Vivo" },
  { id: "eda", titulo: "Análisis EDA & Roles" },
  { id: "recomendaciones", titulo: "Recomendaciones de Negocio" },
  { id: "metodologia", titulo: "Metodología & Calidad" },
];

export function NavbarPowerBi({ paginaActiva, alSeleccionarPagina }) {
  const m = d.meta;

  return (
    <header className="pbi-top-header">
      {/* Barra de Título Oficial Microsoft Power BI Service */}
      <div className="pbi-title-bar">
        <div className="pbi-title-left">
          <div className="pbi-logo-bars" title="Microsoft Power BI">
            <span className="bar bar-1" />
            <span className="bar bar-2" />
            <span className="bar bar-3" />
          </div>
          <div className="pbi-report-info">
            <span className="pbi-report-title">
              Voice of Customer — Análisis de Cobranza Bancaria (WhatsApp)
            </span>
            <span className="pbi-report-badge">Entregable Prueba Técnica AI</span>
          </div>
        </div>

        <div className="pbi-title-right">
          <div className="pbi-meta-cell">
            <span className="meta-k">Modelo de Extracción</span>
            <span className="meta-v">OpenAI {m.modelo}</span>
          </div>
          <div className="pbi-meta-cell">
            <span className="meta-k">Corpus Analizado</span>
            <span className="meta-v">{m.n_conversaciones_analizadas.toLocaleString("es")} / {m.n_conversaciones_corpus.toLocaleString("es")} conv. (100%)</span>
          </div>
          <div className="pbi-meta-cell">
            <span className="meta-k">Fecha de Corte</span>
            <span className="meta-v">{m.generado}</span>
          </div>
        </div>
      </div>

      {/* Barra de Páginas del Reporte (Pestañas clásicas de Power BI) */}
      <nav className="pbi-page-tabs" aria-label="Páginas del informe">
        <div className="pbi-tabs-scroll">
          {PAGINAS.map((p) => {
            const activo = paginaActiva === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`pbi-page-tab-btn ${activo ? "active" : ""}`}
                onClick={() => alSeleccionarPagina(p.id)}
              >
                {p.titulo}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
