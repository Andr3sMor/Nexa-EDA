import React, { useState, useEffect } from "react";
import { NavbarPowerBi } from "./componentes/NavbarPowerBi.jsx";
import { ResumenEjecutivo } from "./componentes/ResumenEjecutivo.jsx";
import { PreguntasNegocio } from "./componentes/PreguntasNegocio.jsx";
import { ExploradorLlamadas } from "./componentes/ExploradorLlamadas.jsx";
import { CopilotoRag } from "./componentes/CopilotoRag.jsx";
import { EdaView } from "./componentes/EdaView.jsx";
import { RecomendacionesView } from "./componentes/RecomendacionesView.jsx";
import { MetodologiaView } from "./componentes/MetodologiaView.jsx";
import d from "./datos/agregados.json";

export default function App() {
  const [paginaActiva, setPaginaActiva] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const paginasValidas = [
      "resumen",
      "preguntas",
      "explorador",
      "copiloto_rag",
      "eda",
      "recomendaciones",
      "metodologia",
    ];
    return paginasValidas.includes(hash) ? hash : "resumen";
  });

  useEffect(() => {
    window.location.hash = paginaActiva;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paginaActiva]);

  return (
    <div className="pbi-app-container">
      {/* Barra de Encabezado Superior de Microsoft Power BI */}
      <NavbarPowerBi
        paginaActiva={paginaActiva}
        alSeleccionarPagina={setPaginaActiva}
      />

      {/* Canvas Principal del Informe Power BI */}
      <main className="pbi-main-canvas">
        {paginaActiva === "resumen" && (
          <ResumenEjecutivo alNavegar={setPaginaActiva} />
        )}
        {paginaActiva === "preguntas" && (
          <PreguntasNegocio alIrAExplorador={() => setPaginaActiva("explorador")} />
        )}
        {paginaActiva === "explorador" && (
          <ExploradorLlamadas />
        )}
        {paginaActiva === "copiloto_rag" && (
          <CopilotoRag />
        )}
        {paginaActiva === "eda" && (
          <EdaView />
        )}
        {paginaActiva === "recomendaciones" && (
          <RecomendacionesView />
        )}
        {paginaActiva === "metodologia" && (
          <MetodologiaView />
        )}
      </main>

      {/* Barra de Estado Inferior de Power BI */}
      <footer className="pbi-bottom-statusbar">
        <div className="pbi-status-left">
          <span>Microsoft Power BI Report Canvas</span>
          <span className="pbi-sep">|</span>
          <span>
            Datos: {d.meta.proveedor} <code>{d.meta.modelo}</code> ({d.meta.n_conversaciones_analizadas.toLocaleString("es")} conv.)
          </span>
        </div>
        <div className="pbi-status-right">
          <span>Entregable Prueba Técnica: Científico(a) de AI</span>
        </div>
      </footer>
    </div>
  );
}
