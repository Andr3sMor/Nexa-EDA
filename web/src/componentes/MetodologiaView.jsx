import React from "react";
import { PbiVisual, PbiCard, PbiTable, PbiCallout, PALETA_PBI } from "./ui.jsx";
import d from "../datos/agregados.json";

export function MetodologiaView() {
  const m = d.metodologia;
  const c = d.controles;
  const nps = c.validacion_nps;

  return (
    <div className="dash-page">
      <div className="section-heading-bar">
        <span className="section-tag">Metodología, Validación y Límites</span>
        <h2 className="section-heading">Gobernanza de Datos, Validación y Controles de Calidad</h2>
      </div>

      <div className="kpi-grid cols-3" style={{ marginBottom: 14 }}>
        <PbiCard
          titulo="Contrato Pydantic"
          valor="22 Variables"
          subtitulo="Taxonomías cerradas con orden evidencia-conclusión"
          indicadorColor={PALETA_PBI.azul1}
        />
        <PbiCard
          titulo="Diseño de Prompts"
          valor="Versión 13"
          subtitulo="Few-shot contextual y reglas de desanonimización"
          indicadorColor={PALETA_PBI.azul2}
        />
        <PbiCard
          titulo="Validadores de Rol"
          valor="100% Deterministas"
          subtitulo="Verificación estricta de citas sobre rol [USUARIO]"
          indicadorColor={PALETA_PBI.verde}
        />
      </div>

      <div className="panels-grid cols-2">
        <PbiVisual titulo="Metodología del Score Híbrido de Satisfacción">
          <p style={{ margin: "0 0 10px", fontSize: 13 }}>{m.score_satisfaccion}</p>
          <div className="code-box">
            <code>Score = 0.70 * (LLM_1_5 * 20) + 0.30 * (100 - Penalizaciones_Objetivas)</code>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#605E5C" }}>
            Penalizaciones objetivas calculadas: bucle de bot (-20), llamadas extensas sin acuerdo (-15), cliente
            repite queja (-15), cierre negativo (-10).
          </p>
        </PbiVisual>

        <PbiVisual
          titulo="Validación Externa contra NPS Declarado por el Cliente"
          subtitulo="Evaluación sobre muestra con encuesta real de satisfacción (n = 217)"
        >
          <p style={{ margin: "0 0 8px", fontSize: 12 }}>{nps.descripcion}</p>
          <PbiTable
            columnas={[
              { clave: "k", titulo: "Componente Evaluado" },
              {
                clave: "v",
                titulo: "rho de Spearman vs. NPS",
                num: true,
                render: (f) => <strong>{f.v}</strong>,
              },
            ]}
            filas={[
              { k: "Juicio Semántico del LLM (Rúbrica 1 a 5)", v: nps.solo_llm },
              { k: "Score Híbrido 70/30 (LLM + Señales)", v: nps.hibrido_70_30 },
              { k: "Señales Mecánicas Objetivas de Fricción", v: nps.solo_objetivo },
            ]}
            filasPorPagina={4}
          />
          <span className="pbi-table-footer-note">
            El componente semántico de IA presenta mayor concordancia con la percepción del cliente que las señales aisladas.
          </span>
        </PbiVisual>
      </div>

      <div style={{ marginTop: 14 }}>
        <PbiVisual
          titulo="Auditoría de Citas por Rol Emisor (Demostración de Control de Alucinación)"
          subtitulo="Verificación de la fuente real de cada evidencia extraída por el modelo"
        >
          <PbiTable
            columnas={[
              { clave: "campo", titulo: "Campo de Evidencia Evaluado" },
              { clave: "total", titulo: "Total Citas", num: true },
              { clave: "rol_correcto", titulo: "Rol Correcto [USUARIO]", num: true },
              { clave: "rol_equivocado", titulo: "Rol Equivocado [AGENTE/BOT]", num: true },
              { clave: "no_localizable", titulo: "No Localizable", num: true },
              {
                clave: "pct_correcto",
                titulo: "% Fidelidad",
                num: true,
                render: (f) => `${((f.rol_correcto / f.total) * 100).toFixed(1)}%`,
              },
            ]}
            filas={c.auditoria_citas}
            filasPorPagina={5}
          />
        </PbiVisual>
      </div>

      <div style={{ marginTop: 14 }}>
        <PbiVisual titulo="Limitaciones Metodológicas Declaradas">
          <div className="lim-list">
            {d.limitaciones.map((lim, idx) => (
              <div key={idx} className="lim-row">
                <span className="lim-num">{idx + 1}.</span>
                <span className="lim-text">{lim}</span>
              </div>
            ))}
          </div>
        </PbiVisual>
      </div>
    </div>
  );
}
