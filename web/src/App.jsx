import React, { useState, useEffect } from "react";
import { Sidebar } from "./componentes/Sidebar.jsx";
import { ResumenEjecutivo } from "./componentes/ResumenEjecutivo.jsx";
import { PreguntasNegocio } from "./componentes/PreguntasNegocio.jsx";
import { ExploradorLlamadas } from "./componentes/ExploradorLlamadas.jsx";
import { CopilotoRag } from "./componentes/CopilotoRag.jsx";
import { EdaView } from "./componentes/EdaView.jsx";
import { RecomendacionesView } from "./componentes/RecomendacionesView.jsx";
import { MetodologiaView } from "./componentes/MetodologiaView.jsx";
import d from "./datos/agregados.json";

export const PAGINAS = [
  { id: "resumen",         icon: "resumen",   titulo: "Resumen Ejecutivo",     seccion: "ANÁLISIS" },
  { id: "preguntas",       icon: "preguntas", titulo: "Preguntas de Negocio",  seccion: "ANÁLISIS" },
  { id: "explorador",      icon: "explorador",titulo: "Explorador de Casos",   seccion: "ANÁLISIS" },
  { id: "eda",             icon: "eda",       titulo: "EDA & Roles",           seccion: "ANÁLISIS" },
  { id: "copiloto_rag",    icon: "rag",       titulo: "Copiloto RAG",          seccion: "PRODUCTO" },
  { id: "recomendaciones", icon: "rec",       titulo: "Recomendaciones",       seccion: "PRODUCTO" },
  { id: "metodologia",     icon: "met",       titulo: "Metodología & Calidad", seccion: "METODOLOGÍA" },
];

const TOPBAR_TITLES = {
  resumen:         "Resumen Ejecutivo — VoC Cobranza Bancaria",
  preguntas:       "Preguntas de Negocio (a – e)",
  explorador:      "Explorador de Casos · 1.197 conversaciones",
  eda:             "Análisis EDA & Roles",
  copiloto_rag:    "Copiloto RAG en Vivo",
  recomendaciones: "Recomendaciones Estratégicas",
  metodologia:     "Metodología & Control de Calidad",
};

export default function App() {
  const [paginaActiva, setPaginaActiva] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return PAGINAS.find(p => p.id === hash) ? hash : "resumen";
  });

  useEffect(() => {
    window.location.hash = paginaActiva;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paginaActiva]);

  const m = d.meta;

  return (
    <div className="dash-shell">
      {/* ─── SIDEBAR LATERAL ─── */}
      <Sidebar
        paginaActiva={paginaActiva}
        alSeleccionarPagina={setPaginaActiva}
        meta={m}
      />

      {/* ─── ÁREA PRINCIPAL ─── */}
      <div className="dash-main">
        {/* Top Bar */}
        <header className="dash-topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-page-title">
              {TOPBAR_TITLES[paginaActiva]}
            </span>
            <span className="topbar-badge">Prueba Técnica — Científico(a) AI</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-stat">
              <span className="topbar-stat-dot" style={{ background: "#10b981" }} />
              OpenAI {m.modelo}
            </div>
            <div className="topbar-stat">
              <span className="topbar-stat-dot" style={{ background: "#6366f1" }} />
              {m.n_conversaciones_analizadas.toLocaleString("es")} conv. analizadas
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main className="dash-canvas">
          {paginaActiva === "resumen"         && <ResumenEjecutivo alNavegar={setPaginaActiva} />}
          {paginaActiva === "preguntas"       && <PreguntasNegocio alIrAExplorador={() => setPaginaActiva("explorador")} />}
          {paginaActiva === "explorador"      && <ExploradorLlamadas />}
          {paginaActiva === "copiloto_rag"    && <CopilotoRag />}
          {paginaActiva === "eda"             && <EdaView />}
          {paginaActiva === "recomendaciones" && <RecomendacionesView />}
          {paginaActiva === "metodologia"     && <MetodologiaView />}
        </main>

        {/* Status bar inferior */}
        <div className="dash-statusbar">
          <span>
            Datos: {m.proveedor} · Modelo: <code style={{ color: "#9ca3af", background: "transparent" }}>{m.modelo}</code> · {m.n_conversaciones_analizadas.toLocaleString("es")} conversaciones analizadas · {m.generado}
          </span>
          <span>Entregable Prueba Técnica Científico(a) de AI — NEXA</span>
        </div>
      </div>
    </div>
  );
}
