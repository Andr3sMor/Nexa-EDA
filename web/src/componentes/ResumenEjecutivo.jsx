import React from "react";
import { Kpi, Card, Aviso, BarrasH, Tabla, Pill } from "./ui.jsx";
import d from "../datos/agregados.json";

const pct = (x) => (x == null ? "—" : `${x}%`);

const ESTADO_ETIQUETA = {
  utilizable: { texto: "Utilizable", clase: "si" },
  con_reservas: { texto: "Con reservas", clase: "alerta" },
  sin_auditar: { texto: "Sin auditar", clase: "no" },
  no_utilizable: { texto: "No utilizable", clase: "peligro" },
};

export function ResumenEjecutivo({ alNavegar }) {
  const m = d.meta;
  const k = d.kpis;
  const motivos = d.pregunta_a.motivo_no_pago.filter((x) => x.clave !== "NINGUNO").slice(0, 5);
  const ofertas = d.pregunta_b.ofertas.slice(0, 5);

  return (
    <div className="pbi-page-container">
      {/* Banner de Bienvenida Ejecutivo */}
      <div className="pbi-hero-card">
        <div className="pbi-hero-content">
          <span className="pbi-section-pill">Informe Ejecutivo de Operación</span>
          <h1 className="pbi-hero-title">Voice of Customer en Cobranza Bancaria</h1>
          <p className="pbi-hero-desc">
            Análisis de analítica conversacional e inteligencia artificial generativa sobre{" "}
            <strong>{m.n_conversaciones_corpus.toLocaleString("es")} conversaciones de WhatsApp</strong> entre un banco
            colombiano y clientes en mora. Cobertura del <strong>{m.cobertura_pct}%</strong> procesada con{" "}
            <code>{m.modelo}</code> de OpenAI, extrayendo 22 variables por conversación y aplicando validadores
            deterministas de rol para garantizar fidelidad estadística.
          </p>
          <div className="pbi-hero-buttons">
            <button
              type="button"
              className="pbi-btn-primary"
              onClick={() => alNavegar("preguntas")}
            >
              🎯 Ver Respuestas a las Preguntas de Negocio →
            </button>
            <button
              type="button"
              className="pbi-btn-secondary"
              onClick={() => alNavegar("explorador")}
            >
              🔍 Explorar 1.197 Llamadas en Vivo
            </button>
            <button
              type="button"
              className="pbi-btn-secondary"
              onClick={() => alNavegar("rag")}
            >
              🤖 Propuesta RAG (35 pts)
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI Principales */}
      <div className="grid cols-4" style={{ margin: "20px 0" }}>
        <Kpi
          etiqueta="Acuerdo de Pago Verificado"
          valor={pct(k.acuerdo_pago_pct)}
          subtitulo={`${k.acuerdo_pago_n} de ${m.n_conversaciones_analizadas} conv. (LLM marcó ${k.acuerdo_pago_llm_n})`}
          estado={k.acuerdo_pago_pct >= 6 ? "exito" : "alerta"}
          icono="🤝"
        />
        <Kpi
          etiqueta="Score de Satisfacción Medio"
          valor={`${k.score_satisfaccion_media} / 100`}
          subtitulo={`Desviación estándar: ${k.score_satisfaccion_sd} pts`}
          estado="primario"
          icono="⭐"
        />
        <Kpi
          etiqueta="Fricción con el Bot Automatizado"
          valor={pct(k.friccion_bot_pct)}
          subtitulo="Bucles, demoras y frustración del cliente"
          estado="peligro"
          icono="⚠️"
        />
        <Kpi
          etiqueta="Conversaciones Abandonadas"
          valor={pct(k.abandono_pct)}
          subtitulo="Cierre sin acuerdo ni resolución"
          estado="alerta"
          icono="⏳"
        />
      </div>

      {/* Alerta Metodológica de Transparencia */}
      <Aviso tipo="info">
        <strong>Transparencia Analítica de la Auditoría:</strong> Este dashboard integra dos capas de control de
        calidad (auditoría de citas por rol emisor y verificación contra el NPS declarado por el cliente). Para evitar
        conclusiones erradas en comités de negocio, cada métrica se publica con su nivel de fiabilidad explícito.
      </Aviso>

      {/* Gráficos de Resumen en 2 Columnas */}
      <div className="grid cols-2" style={{ margin: "20px 0" }}>
        <Card
          titulo="Top 5 Motivos de No Pago (Verificados)"
          subtitulo="Identificados en mensajes de clientes"
          accion={
            <button
              type="button"
              className="pbi-btn-link"
              onClick={() => alNavegar("preguntas")}
            >
              Ver todos →
            </button>
          }
        >
          <BarrasH datos={motivos} campo="n" etiquetaValor=" conv." />
        </Card>

        <Card
          titulo="Top 5 Ofertas de Negociación Más Utilizadas"
          subtitulo="Estrategias planteadas por los asesores humanos"
          accion={
            <button
              type="button"
              className="pbi-btn-link"
              onClick={() => alNavegar("preguntas")}
            >
              Ver detalle →
            </button>
          }
        >
          <BarrasH datos={ofertas} campo="n" etiquetaValor=" ofertas" />
        </Card>
      </div>

      {/* Matriz de Fiabilidad por Pregunta de Negocio */}
      <Card
        titulo="Semáforo de Fiabilidad por Pregunta del Enunciado"
        subtitulo="Evaluación objetiva tras auditar las 1.197 conversaciones con validadores de rol"
        badge={`Fuente: ${d.controles.fuente}`}
      >
        <Tabla
          columnas={[
            {
              clave: "pregunta",
              titulo: "Ref",
              ancho: "70px",
              render: (f) => <span className="pbi-q-mini-badge">({f.pregunta})</span>,
            },
            { clave: "titulo", titulo: "Pregunta de Negocio" },
            {
              clave: "estado",
              titulo: "Estado Técnico",
              ancho: "140px",
              render: (f) => {
                const e = ESTADO_ETIQUETA[f.estado] || { texto: f.estado, clase: "normal" };
                return <Pill variante={e.clase} activo={e.texto} />;
              },
            },
            { clave: "detalle", titulo: "Diagnóstico y Tratamiento Aplicado" },
          ]}
          filas={d.controles.fiabilidad_por_pregunta}
        />
      </Card>
    </div>
  );
}
