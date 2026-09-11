import React from "react";
import { Card, Aviso, Tabla, Kpi } from "./ui.jsx";
import d from "../datos/agregados.json";

export function MetodologiaView() {
  const m = d.metodologia;
  const c = d.controles;
  const nps = c.validacion_nps;

  return (
    <div className="pbi-page-container">
      <div className="pbi-page-header">
        <div>
          <span className="pbi-section-pill">Entregable Obligatorio · Rigor Metodológico</span>
          <h2 className="pbi-page-title">Metodología, Validación y Limitaciones</h2>
          <p className="pbi-page-desc">
            Documentación técnica de la capa de extracción con IA, diseño de prompts, cálculo del score de
            satisfacción, validación externa contra NPS y limitaciones analíticas declaradas.
          </p>
        </div>
      </div>

      <div className="grid cols-3" style={{ margin: "20px 0" }}>
        <Card titulo="Contrato Pydantic Estricto" badge="22 variables">
          <p style={{ margin: 0, fontSize: 13.5 }}>
            Esquema tipado con 4 taxonomías cerradas (<code>Enum</code>) ancladas en frecuencias reales del corpus.
            Orden secuencial <strong>evidencia → conclusión</strong>: el modelo cita obligatoriamente el fragmento
            textual antes de emitir cualquier juicio.
          </p>
        </Card>

        <Card titulo="Prompt Engineering v13" badge="8.149 tokens">
          <p style={{ margin: 0, fontSize: 13.5 }}>
            Diseño iterativo (bitácora v1 a v13 en <code>prompts.py</code>) con 3 ejemplos few-shot que se validan
            automáticamente contra Pydantic al importar. Incorpora decodificador de anomalías de anonimización.
          </p>
        </Card>

        <Card titulo="Validadores Deterministas de Rol" badge="Cero Alucinación">
          <p style={{ margin: 0, fontSize: 13.5 }}>
            Algoritmos en Python post-extracción que verifican que las citas de acuerdo y motivo provengan de mensajes{" "}
            <code>[USUARIO]</code>, eliminando las auto-afirmaciones del asesor que inflaban las tasas.
          </p>
        </Card>
      </div>

      {/* Cálculo de Satisfacción & Validación NPS */}
      <div className="grid cols-2">
        <Card titulo="Fórmula y Cálculo del Score de Satisfacción">
          <p style={{ marginTop: 0, fontSize: 13.5 }}>{m.score_satisfaccion}</p>
          <div className="pbi-formula-box">
            <code>Score = 0.70 × (LLM_1_5 × 20) + 0.30 × (100 - Penalizaciones_Objetivas)</code>
          </div>
          <p style={{ fontSize: 13, color: "var(--pbi-text-sub)", marginTop: 10 }}>
            Penalizaciones objetivas: bucles de bot (-20), conversaciones largas sin acuerdo (-15), cliente repite
            frustración (-15), cierre abrupto negativo (-10).
          </p>
        </Card>

        <Card titulo="Validación Externa contra NPS Real Declarado por el Cliente" badge="n = 217 encuestas">
          <p style={{ margin: "0 0 10px", fontSize: 13 }}>{nps.descripcion}</p>
          <Tabla
            columnas={[
              { clave: "k", titulo: "Componente Evaluado" },
              {
                clave: "v",
                titulo: "Correlación (rho de Spearman)",
                num: true,
                render: (f) => (
                  <span style={{ fontWeight: 600, color: f.v > 0.7 ? "#059669" : "#d97706" }}>
                    {f.v}
                  </span>
                ),
              },
            ]}
            filas={[
              { k: "Solo Juicio del LLM (Rúbrica 1 a 5)", v: nps.solo_llm },
              { k: "Score Híbrido 70/30 (LLM + Señales)", v: nps.hibrido_70_30 },
              { k: "Solo Señales Objetivas de Fricción", v: nps.solo_objetivo },
            ]}
          />
          <p className="card-nota" style={{ marginTop: 8 }}>
            <strong>Hallazgo de evaluación:</strong> El juicio puro del LLM correlaciona más alto (+0,759) con el NPS
            real que las señales mecánicas (+0,345). Las señales objetivas reducen dispersión pero no superan el juicio semántico.
          </p>
        </Card>
      </div>

      {/* Auditoría de Citas por Rol */}
      <div style={{ marginTop: 20 }}>
        <Card
          titulo="Auditoría de Citas por Rol Emisor (Por qué el validador de rol es imprescindible)"
          subtitulo="Demostración empírica de cómo el LLM confunde roles si no se le restringe"
        >
          <Tabla
            columnas={[
              { clave: "campo", titulo: "Campo de Evidencia Evaluado" },
              { clave: "total", titulo: "Total Citas", num: true },
              { clave: "rol_correcto", titulo: "Rol Correcto", num: true },
              { clave: "rol_equivocado", titulo: "Rol Equivocado (Asesor/Bot)", num: true },
              { clave: "no_localizable", titulo: "No Localizable", num: true },
              {
                clave: "pct_correcto",
                titulo: "% Fidelidad Rol",
                num: true,
                render: (f) => (
                  <span style={{ fontWeight: 600 }}>
                    {((f.rol_correcto / f.total) * 100).toFixed(1)}%
                  </span>
                ),
              },
            ]}
            filas={c.auditoria_citas}
          />
        </Card>
      </div>

      {/* Limitaciones del Análisis */}
      <div style={{ marginTop: 20 }}>
        <Card
          titulo="Limitaciones Metodológicas que Condicionan Cualquier Conclusión de Negocio"
          subtitulo="Declaración de transparencia obligatoria para la toma de decisiones gerenciales"
        >
          <div className="pbi-limitaciones-grid">
            {d.limitaciones.map((lim, idx) => (
              <div key={idx} className="pbi-limitacion-item">
                <span className="pbi-lim-num">0{idx + 1}</span>
                <p className="pbi-lim-text">{lim}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
