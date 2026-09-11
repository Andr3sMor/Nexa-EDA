import React from "react";
import { PAGINAS } from "../App.jsx";

// Íconos SVG profesionales en lugar de emojis
const ICONS = {
  resumen:    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  preguntas:  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>,
  explorador: <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>,
  eda:        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>,
  rag:        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-.992 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd"/></svg>,
  rec:        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  met:        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
};

function groupPages(paginas) {
  const groups = {};
  for (const p of paginas) {
    if (!groups[p.seccion]) groups[p.seccion] = [];
    groups[p.seccion].push(p);
  }
  return groups;
}

export function Sidebar({ paginaActiva, alSeleccionarPagina, meta }) {
  const groups = groupPages(PAGINAS);

  return (
    <aside className="dash-sidebar">
      {/* Logo / Identidad */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg viewBox="0 0 20 20" fill="white" style={{ width: 18, height: 18 }}>
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">VoC Cobranza</span>
          <span className="sidebar-logo-sub">Dashboard Ejecutivo</span>
        </div>
      </div>

      {/* Meta del informe */}
      <div className="sidebar-meta">
        <div className="sidebar-meta-item">
          <span className="sidebar-meta-label">Corpus</span>
          <span className="sidebar-meta-value">
            {meta.n_conversaciones_analizadas.toLocaleString("es")} conversaciones
          </span>
        </div>
        <div className="sidebar-meta-item">
          <span className="sidebar-meta-label">Modelo</span>
          <span className="sidebar-meta-value">OpenAI {meta.modelo}</span>
        </div>
        <div className="sidebar-meta-item">
          <span className="sidebar-meta-label">Fecha de corte</span>
          <span className="sidebar-meta-value">{meta.generado}</span>
        </div>
      </div>

      {/* Navegación agrupada */}
      <nav className="sidebar-nav" aria-label="Navegación del dashboard">
        {Object.entries(groups).map(([seccion, paginas]) => (
          <div key={seccion}>
            <div className="sidebar-nav-section">
              <span className="sidebar-nav-section-label">{seccion}</span>
            </div>
            {paginas.map((p) => {
              const activo = paginaActiva === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`sidebar-nav-item ${activo ? "active" : ""}`}
                  onClick={() => alSeleccionarPagina(p.id)}
                  aria-current={activo ? "page" : undefined}
                >
                  <span className="sidebar-nav-item-icon" style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ width: 15, height: 15, display: "inline-flex" }}>
                      {ICONS[p.icon]}
                    </span>
                  </span>
                  <span className="sidebar-nav-item-text">{p.titulo}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          Prueba Técnica<br />Científico(a) de AI · NEXA
        </div>
      </div>
    </aside>
  );
}
