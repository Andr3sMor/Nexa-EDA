import React, { useState, useEffect } from "react";
import { NavbarPowerBi } from "./componentes/NavbarPowerBi.jsx";
import { ResumenEjecutivo } from "./componentes/ResumenEjecutivo.jsx";
import { PreguntasNegocio } from "./componentes/PreguntasNegocio.jsx";
import { ExploradorLlamadas } from "./componentes/ExploradorLlamadas.jsx";
import { EdaView } from "./componentes/EdaView.jsx";
import { PropuestaRagView } from "./componentes/PropuestaRagView.jsx";
import { RecomendacionesView } from "./componentes/RecomendacionesView.jsx";
import { MetodologiaView } from "./componentes/MetodologiaView.jsx";
import d from "./datos/agregados.json";

export default function App() {
  const [paginaActiva, setPaginaActiva] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const paginasValidas = ["resumen", "preguntas", "explorador", "eda", "rag", "recomendaciones", "metodologia"];
    return paginasValidas.includes(hash) ? hash : "resumen";
  });

  const [modoOscuro, setModoOscuro] = useState(() => {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    window.location.hash = paginaActiva;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paginaActiva]);

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [modoOscuro]);

  return (
    <div className="pbi-app">
      {/* Barra de Navegación Estilo Power BI */}
      <NavbarPowerBi
        paginaActiva={paginaActiva}
        alSeleccionarPagina={setPaginaActiva}
        modoOscuro={modoOscuro}
        alToggleModoOscuro={() => setModoOscuro((m) => !m)}
      />

      {/* Contenido Dinámico de la Página Activa */}
      <main className="pbi-main-content">
        {paginaActiva === "resumen" && (
          <ResumenEjecutivo alNavegar={setPaginaActiva} />
        )}
        {paginaActiva === "preguntas" && (
          <PreguntasNegocio alIrAExplorador={() => setPaginaActiva("explorador")} />
        )}
        {paginaActiva === "explorador" && (
          <ExploradorLlamadas />
        )}
        {paginaActiva === "eda" && (
          <EdaView />
        )}
        {paginaActiva === "rag" && (
          <PropuestaRagView />
        )}
        {paginaActiva === "recomendaciones" && (
          <RecomendacionesView />
        )}
        {paginaActiva === "metodologia" && (
          <MetodologiaView />
        )}
      </main>

      {/* Pie de Página Institucional */}
      <footer className="pbi-footer">
        <div className="pbi-footer-inner">
          <div className="pbi-footer-left">
            <span>
              <strong>NEXA AI · Voice of Customer (Cobranza)</strong> — Extracción y análisis con {d.meta.proveedor}{" "}
              <code>{d.meta.modelo}</code> sobre {d.meta.n_conversaciones_analizadas.toLocaleString("es")} /{" "}
              {d.meta.n_conversaciones_corpus.toLocaleString("es")} conversaciones ({d.meta.cobertura_pct}% de cobertura).
            </span>
          </div>
          <div className="pbi-footer-right">
            <span>Prueba Técnica: Científico(a) de AI · Despliegue con GitHub Actions & Pages</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
