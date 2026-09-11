import React from "react";
import { PbiCard, PbiVisual, PbiBarChart, PbiTable, PbiCallout, PALETA } from "./ui.jsx";
import d from "../datos/agregados.json";

const pct = (x) => (x == null ? "—" : `${x}%`);

export function ResumenEjecutivo({ alNavegar }) {
  const m = d.meta;
  const k = d.kpis;
  const motivos = d.pregunta_a.motivo_no_pago.filter((x) => x.clave !== "NINGUNO").slice(0, 6);
  const ofertas = d.pregunta_b.ofertas.slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero Panel */}
      <div className="hero-panel">
        <div>
          <span className="hero-badge">Informe Ejecutivo de Cartera &mdash; Prueba Técnica AI</span>
          <h1 className="hero-title">Voice of Customer — Cobranza Bancaria (WhatsApp)</h1>
          <p className="hero-description">
            Evaluación integral de{" "}
            <strong style={{ color: "#ffffff" }}>
              {m.n_conversaciones_corpus.toLocaleString("es")} interacciones de WhatsApp
            </strong>{" "}
            entre la entidad financiera y clientes en mora. Extracción estructurada de 22 variables
            por conversación con <strong style={{ color: "#ffffff" }}>{m.proveedor} {m.modelo}</strong>{" "}
            &middot; Copiloto RAG normativo &middot; Validadores determinístas de acuerdo de pago.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn-hero-primary" onClick={() => alNavegar("preguntas")}>
            Ver Preguntas a – e
          </button>
          <button type="button" className="btn-hero-secondary" onClick={() => alNavegar("copiloto_rag")}>
            Copiloto RAG
          </button>
          <button type="button" className="btn-hero-secondary" onClick={() => alNavegar("explorador")}>
            Explorador de Casos
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid cols-4">
        <div className="kpi-card">
          <div className="kpi-card-accent" style={{ background: PALETA.accent }} />
          <div className="kpi-card-value">{pct(k.acuerdo_pago_pct)}</div>
          <div className="kpi-card-label">Acuerdos de Pago Verificados</div>
          <div className="kpi-card-sub">{k.acuerdo_pago_n} conv. · validador estricto</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-accent" style={{ background: PALETA.green }} />
          <div className="kpi-card-value">{k.score_satisfaccion_media}<span style={{ fontSize: 16, fontWeight: 600 }}>/100</span></div>
          <div className="kpi-card-label">Score de Satisfacción</div>
          <div className="kpi-card-sub">σ = {k.score_satisfaccion_sd} pts &middot; NPS correlación +0.76</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-accent" style={{ background: PALETA.red }} />
          <div className="kpi-card-value">{pct(k.friccion_bot_pct)}</div>
          <div className="kpi-card-label">Fricción con Bot</div>
          <div className="kpi-card-sub">Bucles y demoras en transferencia al asesor</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-accent" style={{ background: PALETA.orange }} />
          <div className="kpi-card-value">{pct(k.abandono_pct)}</div>
          <div className="kpi-card-label">Abandono</div>
          <div className="kpi-card-sub">Cierre sin resolución del caso</div>
        </div>
      </div>

      {/* Callout de auditoría */}
      <PbiCallout tipo="accent" titulo="Doble Control de Calidad — Criterio de Fiabilidad">
        Auditoría de citas por rol emisor (validador determinista) + correlación NPS Spearman +0,759.
        Cada métrica distingue entre observaciones empíricamente comprobadas y tasas sujetas a sesgo
        de selección del asesor.
      </PbiCallout>

      {/* Gráficos */}
      <div className="panels-grid cols-2">
        <PbiVisual
          titulo="Top 6 Motivos de No Pago"
          subtitulo="Frecuencia en conversaciones verificadas con cliente"
          accion={
            <button type="button" className="btn-ghost" onClick={() => alNavegar("preguntas")}>
              Ver análisis →
            </button>
          }
        >
          <PbiBarChart datos={motivos} campo="n" sufijo=" conv." color={PALETA.accent} />
        </PbiVisual>

        <PbiVisual
          titulo="Top 6 Ofertas Comerciales"
          subtitulo="Estrategias planteadas por asesores humanos"
          accion={
            <button type="button" className="btn-ghost" onClick={() => alNavegar("preguntas")}>
              Ver efectividad →
            </button>
          }
        >
          <PbiBarChart datos={ofertas} campo="n" sufijo=" ofertas" color={PALETA.purple} />
        </PbiVisual>
      </div>

      {/* Matriz de fiabilidad por pregunta */}
      <PbiVisual
        titulo="Matriz de Estado y Fiabilidad por Pregunta de la Prueba Técnica"
        subtitulo="Diagnóstico objetivo tras auditoría de citas y contraste léxico"
      >
        <PbiTable
          columnas={[
            { clave: "pregunta", titulo: "ID",       ancho: "60px",  render: (f) => `(${f.pregunta})` },
            { clave: "titulo",   titulo: "Pregunta del Enunciado" },
            {
              clave: "estado",
              titulo: "Dictamen",
              ancho: "140px",
              render: (f) => (
                <span
                  className={`status-badge ${
                    f.estado === "utilizable"
                      ? "status-ok"
                      : f.estado === "con_reservas"
                      ? "status-warn"
                      : "status-danger"
                  }`}
                >
                  {f.estado.replace(/_/g, " ")}
                </span>
              ),
            },
            { clave: "detalle", titulo: "Tratamiento Metodológico" },
          ]}
          filas={d.controles.fiabilidad_por_pregunta}
          filasPorPagina={7}
        />
      </PbiVisual>
    </div>
  );
}
