import React from "react";
import { PbiCard, PbiVisual, PbiBarChart, PbiTable, PbiCallout, PALETA_PBI } from "./ui.jsx";
import d from "../datos/agregados.json";

const pct = (x) => (x == null ? "—" : `${x}%`);

export function ResumenEjecutivo({ alNavegar }) {
  const m = d.meta;
  const k = d.kpis;
  const motivos = d.pregunta_a.motivo_no_pago.filter((x) => x.clave !== "NINGUNO").slice(0, 5);
  const ofertas = d.pregunta_b.ofertas.slice(0, 5);

  return (
    <div className="pbi-canvas-page">
      {/* Banner Superior de Identificación del Informe */}
      <div className="pbi-hero-panel">
        <div className="pbi-hero-meta">
          <span className="pbi-hero-badge">Informe Ejecutivo de Cartera</span>
          <h1 className="pbi-hero-heading">Voice of Customer — Gestión de Cobranza Bancaria</h1>
          <p className="pbi-hero-description">
            Evaluación integral de <strong>{m.n_conversaciones_corpus.toLocaleString("es")} interacciones de WhatsApp</strong>{" "}
            entre la entidad financiera y clientes en mora. Extracción estructurada de 22 variables por llamada con{" "}
            <strong>{m.proveedor} {m.modelo}</strong> (cobertura 100%), incorporación de validadores deterministas de rol
            para acuerdo de pago y diseño de copiloto RAG normativo para asistencia al asesor de cobranza.
          </p>
        </div>
        <div className="pbi-hero-nav-actions">
          <button type="button" className="pbi-btn-action" onClick={() => alNavegar("preguntas")}>
            Ver Preguntas de Negocio (a - e)
          </button>
          <button type="button" className="pbi-btn-secondary" onClick={() => alNavegar("copiloto_rag")}>
            Probar Copiloto RAG en Vivo
          </button>
          <button type="button" className="pbi-btn-secondary" onClick={() => alNavegar("explorador")}>
            Explorador de Casos (1.197)
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Power BI */}
      <div className="pbi-cards-grid cols-4" style={{ margin: "14px 0" }}>
        <PbiCard
          titulo="Acuerdos de Pago Verificados"
          valor={pct(k.acuerdo_pago_pct)}
          subtitulo={`${k.acuerdo_pago_n} de ${m.n_conversaciones_analizadas} conv. (Validador estricto)`}
          indicadorColor={PALETA_PBI.azul1}
        />
        <PbiCard
          titulo="Score de Satisfacción Promedio"
          valor={`${k.score_satisfaccion_media} / 100`}
          subtitulo={`Desviación estándar: ${k.score_satisfaccion_sd} pts`}
          indicadorColor={PALETA_PBI.verde}
        />
        <PbiCard
          titulo="Fricción con Bot Automatizado"
          valor={pct(k.friccion_bot_pct)}
          subtitulo="Bucles de respuesta y demoras de transferencia"
          indicadorColor={PALETA_PBI.rojo}
        />
        <PbiCard
          titulo="Abandono de Conversación"
          valor={pct(k.abandono_pct)}
          subtitulo="Cierre de chat sin resolución del caso"
          indicadorColor={PALETA_PBI.naranja}
        />
      </div>

      {/* Nota Metodológica de Auditoría */}
      <PbiCallout tipo="info" titulo="Control de Calidad y Criterio de Fiabilidad de los Datos">
        Este reporte incorpora un doble control de calidad: auditoría de citas por rol emisor y correlación contra el
        NPS declarado por los clientes (+0,759 de Spearman). Cada métrica reportada distingue entre observaciones
        empíricamente comprobadas y tasas sujetas a sesgo de selección del asesor.
      </PbiCallout>

      {/* Gráficos Resumen */}
      <div className="pbi-visuals-grid cols-2" style={{ marginTop: 14 }}>
        <PbiVisual
          titulo="Top 5 Motivos de No Pago Declarados por Clientes"
          subtitulo="Frecuencia absoluta en conversaciones verificadas con cliente"
          accion={
            <button type="button" className="pbi-link-btn" onClick={() => alNavegar("preguntas")}>
              Ver detalle completo
            </button>
          }
        >
          <PbiBarChart datos={motivos} campo="n" sufijo=" conv." color={PALETA_PBI.azul1} />
        </PbiVisual>

        <PbiVisual
          titulo="Top 5 Ofertas Comerciales más Frecuentes"
          subtitulo="Estrategias planteadas por asesores humanos"
          accion={
            <button type="button" className="pbi-link-btn" onClick={() => alNavegar("preguntas")}>
              Ver análisis de efectividad
            </button>
          }
        >
          <PbiBarChart datos={ofertas} campo="n" sufijo=" ofertas" color={PALETA_PBI.morado} />
        </PbiVisual>
      </div>

      {/* Matriz de Fiabilidad por Pregunta de Negocio */}
      <div style={{ marginTop: 14 }}>
        <PbiVisual
          titulo="Matriz de Estado y Fiabilidad por Pregunta de la Prueba Técnica"
          subtitulo="Diagnóstico objetivo tras auditoría de citas y contraste léxico"
        >
          <PbiTable
            columnas={[
              { clave: "pregunta", titulo: "Numeral", ancho: "70px", render: (f) => `(${f.pregunta})` },
              { clave: "titulo", titulo: "Pregunta del Enunciado" },
              {
                clave: "estado",
                titulo: "Dictamen Técnico",
                ancho: "130px",
                render: (f) => (
                  <span
                    className={`pbi-status-cell ${
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
              { clave: "detalle", titulo: "Tratamiento Metodológico Aplicado" },
            ]}
            filas={d.controles.fiabilidad_por_pregunta}
            filasPorPagina={6}
          />
        </PbiVisual>
      </div>
    </div>
  );
}
