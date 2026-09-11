import React from "react";
import d from "../datos/agregados.json";

export const PAGINAS = [
  { id: "resumen", titulo: "Resumen Ejecutivo", icono: "📊" },
  { id: "preguntas", titulo: "Preguntas de Negocio (a - e)", icono: "🎯", badge: "Enunciado" },
  { id: "explorador", titulo: "Explorador de Llamadas", icono: "🔍", badge: "1.197 conv" },
  { id: "eda", titulo: "Análisis EDA & Roles", icono: "📈" },
  { id: "rag", titulo: "Propuesta RAG", icono: "🤖", badge: "35 pts" },
  { id: "recomendaciones", titulo: "Recomendaciones", icono: "💡", badge: "15 pts" },
  { id: "metodologia", titulo: "Metodología & Calidad", icono: "🛡️" },
];

export function NavbarPowerBi({ paginaActiva, alSeleccionarPagina, modoOscuro, alToggleModoOscuro }) {
  const m = d.meta;

  return (
    <header className="pbi-header">
      {/* Barra superior institucional */}
      <div className="pbi-topbar">
        <div className="pbi-brand">
          <div className="pbi-logo-box">
            <span className="pbi-logo-icon">📊</span>
          </div>
          <div>
            <div className="pbi-title-group">
              <span className="pbi-title">NEXA · Voice of Customer en Cobranza</span>
              <span className="pbi-tag-eval">Prueba Técnica AI Scientist</span>
            </div>
            <div className="pbi-subtitle">
              Tablero de Analítica Conversacional, NLP e Inteligencia Artificial Generativa
            </div>
          </div>
        </div>

        <div className="pbi-meta-bar">
          <div className="pbi-meta-item">
            <span className="pbi-meta-label">MODELO</span>
            <span className="pbi-meta-value">
              {m.proveedor} <code>{m.modelo}</code>
            </span>
          </div>
          <div className="pbi-meta-item">
            <span className="pbi-meta-label">CORPUS</span>
            <span className="pbi-meta-value">
              {m.n_conversaciones_analizadas.toLocaleString("es")} conv. ({m.cobertura_pct}%)
            </span>
          </div>
          <div className="pbi-meta-item">
            <span className="pbi-meta-label">ACTUALIZADO</span>
            <span className="pbi-meta-value">{m.generado}</span>
          </div>
          <button
            type="button"
            className="pbi-theme-toggle"
            onClick={alToggleModoOscuro}
            title="Cambiar tema claro/oscuro"
          >
            {modoOscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
          </button>
        </div>
      </div>

      {/* Barra de pestañas / páginas de informe tipo Power BI */}
      <nav className="pbi-tabbar" aria-label="Páginas del reporte">
        <div className="pbi-tabbar-inner">
          {PAGINAS.map((p) => {
            const activa = paginaActiva === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`pbi-tab-btn ${activa ? "activo" : ""}`}
                onClick={() => alSeleccionarPagina(p.id)}
              >
                <span className="pbi-tab-icon">{p.icono}</span>
                <span className="pbi-tab-text">{p.titulo}</span>
                {p.badge && <span className="pbi-tab-badge">{p.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
