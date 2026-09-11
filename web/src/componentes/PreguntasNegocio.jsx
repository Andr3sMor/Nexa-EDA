import React, { useState } from "react";
import { PbiCard, PbiVisual, PbiBarChart, PbiTable, PbiCallout, PbiSlicer, PALETA_PBI } from "./ui.jsx";
import d from "../datos/agregados.json";

const pct = (x) => (x == null ? "—" : `${x}%`);

export function PreguntasNegocio({ alIrAExplorador }) {
  const [preguntaActiva, setPreguntaActiva] = useState("todas");
  const a = d.pregunta_a;
  const b = d.pregunta_b;
  const c = d.pregunta_c;
  const e = d.pregunta_e;

  const OPCIONES_PREGUNTAS = [
    { valor: "todas", etiqueta: "Consolidado Completo (a - e)" },
    { valor: "a", etiqueta: "Pregunta a: Motivos de no pago" },
    { valor: "b", etiqueta: "Pregunta b: Ofertas de asesores" },
    { valor: "c", etiqueta: "Pregunta c: Argumentos y acuerdos" },
    { valor: "d", etiqueta: "Pregunta d: Resúmenes de llamadas" },
    { valor: "e", etiqueta: "Pregunta e: Satisfacción y 5 peores casos" },
  ];

  const motivosConDatos = a.motivo_no_pago.filter((m) => m.clave !== "NINGUNO");

  return (
    <div className="dash-page">
      {/* Panel Superior de Filtro de Pregunta (Slicer) */}
      <div className="pbi-slicer-bar">
        <PbiSlicer
          etiqueta="Filtro de Pregunta de Negocio"
          opciones={OPCIONES_PREGUNTAS}
          valorSeleccionado={preguntaActiva}
          alCambiar={setPreguntaActiva}
        />
      </div>

      {/* ========================================================================= */}
      {/* PREGUNTA A: MOTIVOS DE NO PAGO */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "a") && (
        <section className="section-block">
          <div className="section-heading-bar">
            <span className="section-tag">Pregunta de Negocio (a)</span>
            <h2 className="section-heading">¿Cuáles son los principales motivos de no pago?</h2>
          </div>

          <div className="exec-summary">
            <div className="exec-summary-label">Conclusión Analítica</div>
            <p className="exec-summary-text">
              En el 36,7% de las conversaciones en las que el cliente manifiesta explícitamente su causa de mora,
              el motivo predominante es <strong>Ingresos Insuficientes</strong> (139 casos, 31,7% de motivos declarados),
              seguido por <strong>Desacuerdo con el monto o cobro</strong> (84 casos, 19,2%),{" "}
              <strong>Descuento por nómina no aplicado</strong> (62 casos, 14,2%) y{" "}
              <strong>Desempleo</strong> (57 casos, 13,0%).
            </p>
            <p className="exec-summary-sub">
              En el 63,3% restante no se registra motivo (interacción trunca, validación de identidad o evasión). Un validador
              determinista de rol verificó que las citas provengan textualmente del cliente, descartando alucinaciones del modelo.
            </p>
          </div>

          <div className="kpi-grid cols-4">
            <PbiCard
              titulo="Motivos Identificados"
              valor={motivosConDatos.reduce((acc, x) => acc + x.n, 0)}
              subtitulo="En 1.197 conversaciones"
              indicadorColor={PALETA_PBI.azul1}
            />
            <PbiCard
              titulo="Ingresos Insuficientes"
              valor="139"
              subtitulo="31,7% de motivos declarados"
              indicadorColor={PALETA_PBI.naranja}
            />
            <PbiCard
              titulo="Reconoce la Deuda"
              valor={pct(a.reconoce_deuda_pct)}
              subtitulo="Manifestación explícita del cliente"
              indicadorColor={PALETA_PBI.verde}
            />
            <PbiCard
              titulo="Asesor Indaga Motivo"
              valor={pct(a.asesor_pregunta_motivo_pct)}
              subtitulo="Oportunidad de protocolo comercial"
              indicadorColor={PALETA_PBI.morado}
            />
          </div>

          <div className="panels-grid cols-2">
            <PbiVisual
              titulo="Distribución de Motivos de No Pago Verificados"
              subtitulo="Variable motivo_no_pago respaldada por evidencia textual [USUARIO]"
            >
              <PbiBarChart datos={motivosConDatos} campo="n" sufijo=" conv." color={PALETA_PBI.azul1} />
            </PbiVisual>

            <PbiVisual
              titulo="Evidencias Literales Citadas por los Clientes"
              subtitulo="Muestra de expresiones reales capturadas del corpus de WhatsApp"
            >
              <div className="evidence-list">
                {a.ejemplos_evidencia.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="evidence-item">
                    <span className="evidence-tag">{item.motivo.replace(/_/g, " ")}</span>
                    <span className="evidence-quote">"{item.evidencia}"</span>
                  </div>
                ))}
              </div>
            </PbiVisual>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA B: OFERTAS DE ASESORES */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "b") && (
        <section className="section-block">
          <div className="section-heading-bar">
            <span className="section-tag">Pregunta de Negocio (b)</span>
            <h2 className="section-heading">¿Qué ofertas realizan los asesores para lograr un acuerdo de pago?</h2>
          </div>

          <div className="exec-summary">
            <div className="exec-summary-label">Conclusión Analítica</div>
            <p className="exec-summary-text">
              Los asesores formulan ofertas comerciales en el <strong>{pct(b.conversaciones_con_oferta_pct)}</strong>{" "}
              de las conversaciones analizadas ({b.conversaciones_con_oferta} interacciones), con una media de{" "}
              <strong>{b.ofertas_por_conversacion_media}</strong> alternativas presentadas por llamada.
              La oferta más recurrente es <strong>Pago Total con Condonación de Intereses / Gastos</strong> (presente en{" "}
              558 menciones), seguida por <strong>Plan de Pago Diferido / Cuotas</strong> (207 ofertas) y{" "}
              <strong>Pago Mínimo o Cuota Inicial</strong> (164 ofertas).
            </p>
          </div>

          <div className="kpi-grid cols-3">
            <PbiCard
              titulo="Conversaciones con Oferta"
              valor={pct(b.conversaciones_con_oferta_pct)}
              subtitulo={`${b.conversaciones_con_oferta} de 1.197 llamadas`}
              indicadorColor={PALETA_PBI.verde}
            />
            <PbiCard
              titulo="Ofertas Promedio / Conversación"
              valor={b.ofertas_por_conversacion_media}
              subtitulo="Escalamiento comercial en la negociación"
              indicadorColor={PALETA_PBI.azul1}
            />
            <PbiCard
              titulo="Oferta Principal"
              valor="Pago Total + Condonación"
              subtitulo="46,6% de conversaciones con oferta"
              indicadorColor={PALETA_PBI.morado}
            />
          </div>

          <div className="panels-grid cols-2">
            <PbiVisual titulo="Frecuencia por Tipo de Oferta Comercial Formulada">
              <PbiBarChart datos={b.ofertas} campo="n" sufijo=" ofertas" color={PALETA_PBI.azul2} />
            </PbiVisual>

            <PbiVisual titulo="Argumentos de Persuasión Utilizados por los Asesores">
              <PbiBarChart datos={c.argumentos} campo="n" sufijo=" conv." color={PALETA_PBI.cian} />
            </PbiVisual>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA C: OFRECIMIENTOS Y EFECTIVIDAD EN ACUERDOS */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "c") && (
        <section className="section-block">
          <div className="section-heading-bar">
            <span className="section-tag">Pregunta de Negocio (c)</span>
            <h2 className="section-heading">
              ¿Qué ofrecimientos o argumentos que realiza el asesor logran más acuerdos de pago?
            </h2>
          </div>

          <div className="exec-summary">
            <div className="exec-summary-label">Conclusión Analítica y Rigor Metodológico</div>
            <p className="exec-summary-text">
              Aplicando la definición vinculante estricta del enunciado (
              <em>"aquellos casos en los que el cliente manifieste explícitamente su compromiso de pago indicando una fecha específica"</em>
              ), se registran <strong>78 acuerdos de pago verificados (6,5% del corpus)</strong>.
            </p>
            <p className="exec-summary-sub">
              En términos observacionales, ofertas como <strong>Pago Inmediato con Descuento (8,2%)</strong> y argumentos como{" "}
              <strong>Evitar Reporte a Centrales de Riesgo (7,9%)</strong> muestran tasas ligeramente superiores a la media.
              Sin embargo, <strong>estas tasas son correlacionales, no causales</strong>: el asesor selecciona qué oferta presentar
              según la capacidad previa del cliente. Estadísticamente no hay diferencias significativas entre alternativas.
            </p>
          </div>

          <PbiCallout tipo="warning" titulo="Control de Calidad: Corrección de Sobreestimación del LLM">
            El modelo sin validador de rol inflaba la tasa a 321 acuerdos (26,8%) al computar promesas del propio asesor.
            La verificación determinista sobre mensajes [USUARIO] corrigió el valor a <strong>78 acuerdos reales (6,5%)</strong>.
          </PbiCallout>

          <div className="panels-grid cols-2" style={{ marginTop: 14 }}>
            <PbiVisual
              titulo="Tasa Observacional de Acuerdo por Tipo de Oferta"
              subtitulo="Línea base global del corpus: 6,5%"
            >
              <PbiTable
                columnas={[
                  { clave: "clave", titulo: "Tipo de Oferta" },
                  { clave: "n_conversaciones", titulo: "Conv.", num: true, ancho: "70px" },
                  { clave: "n_acuerdo", titulo: "Acuerdos", num: true, ancho: "70px" },
                  {
                    clave: "tasa_acuerdo_pct",
                    titulo: "Tasa Acuerdo",
                    num: true,
                    ancho: "130px",
                    conBarra: (f) => (f.tasa_acuerdo_pct / 12) * 100,
                    colorBarra: PALETA_PBI.azul1,
                    render: (f) => pct(f.tasa_acuerdo_pct),
                  },
                ]}
                filas={c.oferta_x_acuerdo}
                filasPorPagina={8}
              />
            </PbiVisual>

            <PbiVisual
              titulo="Tasa Observacional de Acuerdo por Argumento de Persuasión"
              subtitulo="Efectividad observada según argumento esgrimido"
            >
              <PbiTable
                columnas={[
                  { clave: "clave", titulo: "Argumento de Negociación" },
                  { clave: "n_conversaciones", titulo: "Conv.", num: true, ancho: "70px" },
                  { clave: "n_acuerdo", titulo: "Acuerdos", num: true, ancho: "70px" },
                  {
                    clave: "tasa_acuerdo_pct",
                    titulo: "Tasa Acuerdo",
                    num: true,
                    ancho: "130px",
                    conBarra: (f) => (f.tasa_acuerdo_pct / 12) * 100,
                    colorBarra: PALETA_PBI.verde,
                    render: (f) => pct(f.tasa_acuerdo_pct),
                  },
                ]}
                filas={c.argumento_x_acuerdo}
                filasPorPagina={8}
              />
            </PbiVisual>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA D: RESUMEN DE LLAMADAS */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "d") && (
        <section className="section-block">
          <div className="section-heading-bar">
            <span className="section-tag">Pregunta de Negocio (d)</span>
            <h2 className="section-heading">
              ¿Qué está pasando en las conversaciones? Resumen de cada una de las llamadas
            </h2>
          </div>

          <div className="exec-summary">
            <div className="exec-summary-label">Conclusión Analítica</div>
            <p className="exec-summary-text">
              Se procesaron <strong>1.197 resúmenes sintéticos</strong> (cobertura 100% del corpus), estructurando
              el objetivo del contacto, la respuesta del cliente, la propuesta comercial y el desenlace de la llamada.
            </p>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={alIrAExplorador}>
                Abrir Explorador Interactivo de las 1.197 Conversaciones
              </button>
            </div>
          </div>

          <PbiVisual
            titulo="Muestra de Resúmenes Estructurados por Estrato de Satisfacción"
            subtitulo="Variable resumen generada con gpt-4o-mini"
          >
            <PbiTable
              columnas={[
                { clave: "id", titulo: "ID Conversación", ancho: "130px" },
                { clave: "resumen", titulo: "Resumen Analítico de la Interacción" },
                {
                  clave: "acuerdo_pago",
                  titulo: "Acuerdo",
                  num: true,
                  ancho: "80px",
                  render: (f) => (f.acuerdo_pago ? "Sí" : "No"),
                },
                {
                  clave: "score_satisfaccion",
                  titulo: "Score",
                  num: true,
                  ancho: "70px",
                },
                { clave: "n_mensajes", titulo: "Msjs", num: true, ancho: "60px" },
              ]}
              filas={d.pregunta_d.muestra_resumenes}
              filasPorPagina={5}
            />
          </PbiVisual>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA E: MENOR SATISFACCIÓN Y TOP 5 PEORES CASOS */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "e") && (
        <section className="section-block">
          <div className="section-heading-bar">
            <span className="section-tag">Pregunta de Negocio (e)</span>
            <h2 className="section-heading">
              ¿Qué características tienen las conversaciones con menor satisfacción? (Top 5 Peores Casos)
            </h2>
          </div>

          <div className="exec-summary">
            <div className="exec-summary-label">Conclusión Analítica y Factores Críticos</div>
            <p className="exec-summary-text">
              Las conversaciones con menor puntuación presentan una combinación de tres fallas operativas:{" "}
              <strong>No se resuelve la solicitud del cliente</strong> (342 casos),{" "}
              <strong>Falta de flexibilidad en la alternativa de pago</strong> (268 casos) y{" "}
              <strong>Fricción técnica con el bot automatizado</strong> (bucles de repetición y demoras en transferir a humano).
            </p>
            <p className="exec-summary-sub">
              Validación metodológica: El score híbrido presenta una correlación de Spearman de <strong>+0,759</strong>{" "}
              contra el NPS real declarado por los clientes (n=217), confirmando su validez empírica.
            </p>
          </div>

          <div className="kpi-grid cols-3">
            <PbiCard
              titulo="Score Medio del Corpus"
              valor={`${e.score_medio} / 100`}
              subtitulo="Desviación estándar: 25,8 pts"
              indicadorColor={PALETA_PBI.azul1}
            />
            <PbiCard
              titulo="Factor Crítico Principal"
              valor="No Resolvió Solicitud"
              subtitulo="342 conversaciones afectadas"
              indicadorColor={PALETA_PBI.rojo}
            />
            <PbiCard
              titulo="Validación Externa (NPS)"
              valor="+0,759"
              subtitulo="Spearman vs NPS declarado (n=217)"
              indicadorColor={PALETA_PBI.verde}
            />
          </div>

          {/* TABLA LITERAL OBLIGATORIA DEL ENUNCIADO */}
          <PbiVisual
            titulo="Las 5 Conversaciones Peor Calificadas del Corpus (Requerimiento Literal del Enunciado)"
            subtitulo="Score Mínimo: 7.5 / 100 — Factores de insatisfacción y recomendación de mejora de cada caso"
          >
            <PbiTable
              columnas={[
                { clave: "id", titulo: "ID Conversación", ancho: "130px" },
                {
                  clave: "score_satisfaccion",
                  titulo: "Score",
                  num: true,
                  ancho: "70px",
                  render: (f) => <strong>{f.score_satisfaccion}</strong>,
                },
                {
                  clave: "factores",
                  titulo: "Factores de Insatisfacción Detectados",
                  render: (f) => f.factores.replace(/\|/g, " · ").replace(/_/g, " "),
                },
                { clave: "resumen", titulo: "Hechos de la Interacción" },
                {
                  clave: "recomendacion_mejora",
                  titulo: "Recomendación Concreta de Mejora",
                  render: (f) => <span className="text-sm">{f.recomendacion_mejora}</span>,
                },
              ]}
              filas={e.peores.slice(0, 5)}
              filasPorPagina={5}
            />
          </PbiVisual>

          <div className="panels-grid cols-2" style={{ marginTop: 14 }}>
            <PbiVisual titulo="Factores de Insatisfacción Más Frecuentes">
              <PbiBarChart
                datos={e.factores.filter((f) => f.clave !== "NINGUNO")}
                campo="n"
                sufijo=" conv."
                color={PALETA_PBI.rojo}
              />
            </PbiVisual>

            <PbiVisual titulo="Histograma de Distribución del Score de Satisfacción (0 a 100)">
              <PbiBarChart datos={e.distribucion_score} campo="n" sufijo=" llamadas" color={PALETA_PBI.azul1} />
            </PbiVisual>
          </div>
        </section>
      )}
    </div>
  );
}
