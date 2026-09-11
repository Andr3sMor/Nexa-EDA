import React, { useState } from "react";
import { Kpi, Card, Aviso, Cita, Pill, BarrasH, Tabla, Slicer } from "./ui.jsx";
import d from "../datos/agregados.json";

const pct = (x) => (x == null ? "—" : `${x}%`);

export function PreguntasNegocio({ alIrAExplorador }) {
  const [preguntaActiva, setPreguntaActiva] = useState("todas");
  const a = d.pregunta_a;
  const b = d.pregunta_b;
  const c = d.pregunta_c;
  const e = d.pregunta_e;

  const SUB_PESTANAS = [
    { valor: "todas", etiqueta: "Vista Consolidada (a - e)" },
    { valor: "a", etiqueta: "Pregunta a · Motivos de no pago" },
    { valor: "b", etiqueta: "Pregunta b · Ofertas de asesores" },
    { valor: "c", etiqueta: "Pregunta c · Argumentos y Acuerdos" },
    { valor: "d", etiqueta: "Pregunta d · Resúmenes de llamadas" },
    { valor: "e", etiqueta: "Pregunta e · Satisfacción & 5 Peores" },
  ];

  const conMotivo = a.motivo_no_pago.filter((m) => m.clave !== "NINGUNO");
  const conMotivoLlm = (a.motivo_no_pago_llm ?? []).filter((m) => m.clave !== "NINGUNO");

  return (
    <div className="pbi-page-container">
      {/* Encabezado del Módulo */}
      <div className="pbi-page-header">
        <div>
          <span className="pbi-section-pill">Entregable Obligatorio</span>
          <h2 className="pbi-page-title">Resolución de Preguntas de Negocio</h2>
          <p className="pbi-page-desc">
            Respuestas ejecutivas y analíticas a las cinco preguntas formuladas en el numeral 2 del
            documento de la prueba técnica (<code>Prueba técnica.pdf</code>), sustentadas en la extracción
            con <strong>{d.meta.modelo}</strong> sobre las 1.197 conversaciones del corpus de WhatsApp.
          </p>
        </div>
        <Slicer
          opciones={SUB_PESTANAS}
          valorSeleccionado={preguntaActiva}
          alCambiar={setPreguntaActiva}
        />
      </div>

      {/* ========================================================================= */}
      {/* PREGUNTA A: MOTIVOS DE NO PAGO */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "a") && (
        <section className="pbi-section" id="sec-pregunta-a">
          <div className="pbi-question-card">
            <div className="pbi-question-header">
              <span className="pbi-q-badge">Pregunta a</span>
              <h3>¿Cuáles son los principales motivos de no pago?</h3>
            </div>
            <div className="pbi-answer-box">
              <div className="pbi-answer-label">RESPUESTA EJECUTIVA DIRECTA</div>
              <p>
                De los clientes que explicitan su motivo en la conversación (36,7% del corpus), el principal factor
                es <strong>Ingresos Insuficientes</strong> con <strong>139 casos (31,7% de motivos declarados)</strong>,
                seguido por <strong>Desacuerdo con el monto o cobro (84 casos, 19,2%)</strong>,{" "}
                <strong>Descuento por nómina no aplicado (62 casos, 14,2%)</strong> y{" "}
                <strong>Desempleo (57 casos, 13,0%)</strong>.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--pbi-text-sub)" }}>
                En el <strong>63,3%</strong> de las conversaciones el cliente no declara el motivo (la interacción se
                centra en confirmar titularidad, se trunca por fricción del bot o el cliente no expone su situación).
                Un validador determinista verifica que la cita del motivo provenga textualmente del mensaje del cliente,
                garantizando fidelidad estadística.
              </p>
            </div>

            <div className="grid cols-4" style={{ margin: "16px 0" }}>
              <Kpi
                etiqueta="Total Motivos Identificados"
                valor={conMotivo.reduce((acc, x) => acc + x.n, 0)}
                subtitulo={`En ${d.meta.n_conversaciones_analizadas} conversaciones`}
                estado="primario"
              />
              <Kpi
                etiqueta="Top 1: Ingresos Insuficientes"
                valor="139"
                subtitulo="31,7% de motivos declarados"
                estado="alerta"
              />
              <Kpi
                etiqueta="Cliente Reconoce Deuda"
                valor={pct(a.reconoce_deuda_pct)}
                subtitulo="De forma explícita al asesor"
                estado="exito"
              />
              <Kpi
                etiqueta="Asesor Indaga el Motivo"
                valor={pct(a.asesor_pregunta_motivo_pct)}
                subtitulo="Oportunidad de gestión comercial"
                estado="normal"
              />
            </div>

            <div className="grid cols-2">
              <Card
                titulo="Distribución de Motivos Verificados por Cliente"
                subtitulo="Filtro estricto: la evidencia proviene de un mensaje [USUARIO]"
                nota={`NINGUNO = ${pct(a.ninguno_pct)} (${a.motivo_reclasificadas_n ?? 19} citas reclasificadas por no corresponder al cliente).`}
              >
                <BarrasH datos={conMotivo} campo="n" etiquetaValor=" conv." />
              </Card>

              <Card
                titulo="Evidencia Textual de Clientes (Citas Literales del Corpus)"
                subtitulo="Muestra de expresiones reales capturadas por el modelo"
              >
                {a.ejemplos_evidencia.slice(0, 5).map((e, idx) => (
                  <Cita
                    key={idx}
                    texto={`"${e.evidencia}"`}
                    fuente={`Motivo: ${e.motivo.replace(/_/g, " ")}`}
                  />
                ))}
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA B: OFERTAS DE LOS ASESORES */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "b") && (
        <section className="pbi-section" id="sec-pregunta-b">
          <div className="pbi-question-card">
            <div className="pbi-question-header">
              <span className="pbi-q-badge">Pregunta b</span>
              <h3>¿Qué ofertas realizan los asesores para lograr un acuerdo de pago?</h3>
            </div>
            <div className="pbi-answer-box">
              <div className="pbi-answer-label">RESPUESTA EJECUTIVA DIRECTA</div>
              <p>
                Los asesores realizan al menos una oferta en el <strong>{pct(b.conversaciones_con_oferta_pct)}</strong>{" "}
                de las conversaciones ({b.conversaciones_con_oferta} llamadas), con una media de{" "}
                <strong>{b.ofertas_por_conversacion_media}</strong> ofertas por conversación. La oferta dominante es{" "}
                <strong>Pago Total con Condonación de Intereses / Gastos</strong> (presente en{" "}
                <strong>558 ofertas</strong>), seguida por <strong>Plan de Pago Diferido / Cuotas (207 ofertas)</strong>{" "}
                y <strong>Pago Mínimo o Cuota Inicial (164 ofertas)</strong>.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--pbi-text-sub)" }}>
                Solo el rol <code>[AGENTE]</code> (humano) formula ofertas comerciales válidas. El bot automatizado se
                presenta como asesor pero solo transfiere o solicita datos de validación.
              </p>
            </div>

            <div className="grid cols-3" style={{ margin: "16px 0" }}>
              <Kpi
                etiqueta="Cobertura de Ofertas"
                valor={pct(b.conversaciones_con_oferta_pct)}
                subtitulo={`${b.conversaciones_con_oferta} conversaciones con oferta`}
                estado="exito"
              />
              <Kpi
                etiqueta="Ofertas Promedio / Conversación"
                valor={b.ofertas_por_conversacion_media}
                subtitulo="Escalamiento comercial en la llamada"
                estado="primario"
              />
              <Kpi
                etiqueta="Oferta Más Frecuente"
                valor="Pago Total + Condonación"
                subtitulo="46,6% de conversaciones con oferta"
                estado="alerta"
              />
            </div>

            <div className="grid cols-2">
              <Card
                titulo="Catálogo de Ofertas Realizadas por Asesores"
                subtitulo="Frecuencia absoluta de ofertas registradas en el corpus"
              >
                <BarrasH datos={b.ofertas} campo="n" etiquetaValor=" ofertas" />
              </Card>

              <Card
                titulo="Argumentos de Persuasión Utilizados"
                subtitulo="Estrategias de convencimiento que acompañan la oferta"
              >
                <BarrasH datos={d.pregunta_c.argumentos} campo="n" etiquetaValor=" conv." />
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA C: OFRECIMIENTOS O ARGUMENTOS CON MÁS ACUERDOS */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "c") && (
        <section className="pbi-section" id="sec-pregunta-c">
          <div className="pbi-question-card">
            <div className="pbi-question-header">
              <span className="pbi-q-badge">Pregunta c</span>
              <h3>¿Qué ofrecimientos o argumentos que realiza el asesor logran más acuerdos de pago?</h3>
            </div>
            <div className="pbi-answer-box">
              <div className="pbi-answer-label">RESPUESTA EJECUTIVA & RIGOR METODOLÓGICO</div>
              <p>
                Bajo la definición vinculante estricta fijada en el enunciado (
                <em>"aquellos casos en los que el cliente manifieste explícitamente su compromiso de pago indicando una fecha específica"</em>
                ), se alcanzan <strong>78 acuerdos de pago verificados (6,5% del corpus)</strong>.
              </p>
              <p style={{ margin: "6px 0 0" }}>
                En términos observacionales, ofertas como <strong>Pago Inmediato con Descuento (8,2%)</strong> y{" "}
                <strong>Plan de Pagos Diferido (7,2%)</strong>, y argumentos como{" "}
                <strong>Evitar Reporte a Centrales de Riesgo (7,9%)</strong> muestran tasas ligeramente por encima de
                la línea base. Sin embargo, <strong>estas tasas son correlacionales, no causales</strong>: el asesor
                discrimina qué oferta dar según la capacidad de pago previa del cliente.
              </p>
            </div>

            <Aviso tipo="alerta">
              <strong>Control de Calidad Vinculante:</strong> Sin el validador de rol, el LLM inflaba los acuerdos a
              321 casos citando promesas del propio asesor. La verificación determinista sobre mensajes{" "}
              <code>[USUARIO]</code> fijó la tasa real en <strong>6,5%</strong>.
            </Aviso>

            <div className="grid cols-2" style={{ marginTop: 16 }}>
              <Card
                titulo="Efectividad Observacional por Tipo de Oferta"
                subtitulo="Línea base global del corpus = 6,5% de acuerdos"
                nota="La muestra en subgrupos es reducida; reportar como orientación operativa, no como relación causal."
              >
                <Tabla
                  columnas={[
                    { clave: "clave", titulo: "Tipo de Oferta" },
                    { clave: "n_conversaciones", titulo: "Conv.", num: true },
                    { clave: "n_acuerdo", titulo: "Acuerdos", num: true },
                    {
                      clave: "tasa_acuerdo_pct",
                      titulo: "Tasa Acuerdo",
                      num: true,
                      render: (f) => (
                        <span style={{ fontWeight: 600, color: f.tasa_acuerdo_pct >= 6.5 ? "#059669" : "#d97706" }}>
                          {pct(f.tasa_acuerdo_pct)}
                        </span>
                      ),
                    },
                  ]}
                  filas={c.oferta_x_acuerdo}
                />
              </Card>

              <Card
                titulo="Efectividad Observacional por Argumento"
                subtitulo="Tasa de cierre de acuerdo según el argumento de negociación esgrimido"
              >
                <Tabla
                  columnas={[
                    { clave: "clave", titulo: "Argumento" },
                    { clave: "n_conversaciones", titulo: "Conv.", num: true },
                    { clave: "n_acuerdo", titulo: "Acuerdos", num: true },
                    {
                      clave: "tasa_acuerdo_pct",
                      titulo: "Tasa Acuerdo",
                      num: true,
                      render: (f) => (
                        <span style={{ fontWeight: 600, color: f.tasa_acuerdo_pct >= 6.5 ? "#059669" : "#d97706" }}>
                          {pct(f.tasa_acuerdo_pct)}
                        </span>
                      ),
                    },
                  ]}
                  filas={c.argumento_x_acuerdo}
                />
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA D: RESUMEN DE CADA LLAMADA */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "d") && (
        <section className="pbi-section" id="sec-pregunta-d">
          <div className="pbi-question-card">
            <div className="pbi-question-header">
              <span className="pbi-q-badge">Pregunta d</span>
              <h3>¿Qué está pasando en las conversaciones? Realice un resumen de cada llamada</h3>
            </div>
            <div className="pbi-answer-box">
              <div className="pbi-answer-label">RESPUESTA EJECUTIVA & COBERTURA COMPLETA</div>
              <p>
                Se generaron <strong>1.197 resúmenes estructurados</strong> (uno por cada conversación del corpus),
                sintetizando el motivo del cliente, la propuesta del asesor, la existencia o no de acuerdo con fecha y
                el desenlace de la interacción.
              </p>
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="pbi-btn-primary"
                  onClick={alIrAExplorador}
                >
                  🔍 Abrir Explorador Interactivo de las 1.197 Llamadas →
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Card
                titulo="Muestra de Resúmenes de Llamadas (Estratos de Satisfacción)"
                subtitulo="Vista preliminar de casos analizados por el modelo"
              >
                <Tabla
                  columnas={[
                    {
                      clave: "id",
                      titulo: "ID Conversación",
                      render: (f) => <code>{f.id}</code>,
                    },
                    { clave: "resumen", titulo: "Resumen Generado por el LLM" },
                    {
                      clave: "acuerdo_pago",
                      titulo: "Acuerdo",
                      num: true,
                      render: (f) => <Pill activo={f.acuerdo_pago} />,
                    },
                    {
                      clave: "score_satisfaccion",
                      titulo: "Score (0-100)",
                      num: true,
                      render: (f) => (
                        <span style={{ fontWeight: 600 }}>{f.score_satisfaccion}</span>
                      ),
                    },
                    { clave: "n_mensajes", titulo: "Msjs", num: true },
                  ]}
                  filas={d.pregunta_d.muestra_resumenes}
                  filasPorPagina={6}
                />
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREGUNTA E: MENOR SATISFACCIÓN & 5 PEORES CASOS */}
      {/* ========================================================================= */}
      {(preguntaActiva === "todas" || preguntaActiva === "e") && (
        <section className="pbi-section" id="sec-pregunta-e">
          <div className="pbi-question-card">
            <div className="pbi-question-header">
              <span className="pbi-q-badge">Pregunta e</span>
              <h3>¿Qué características tienen las conversaciones con menor satisfacción? (Top 5 Peores Casos)</h3>
            </div>
            <div className="pbi-answer-box">
              <div className="pbi-answer-label">RESPUESTA EJECUTIVA & FACTORES CRÍTICOS</div>
              <p>
                Las interacciones con menor satisfacción se caracterizan por una triple fricción:{" "}
                <strong>el asesor no resuelve la duda del cliente (41,2% de menciones)</strong>,{" "}
                <strong>falta de flexibilidad en el esquema de pagos (28,5%)</strong> y{" "}
                <strong>fricción técnica con el bot (bucles, transferencias fallidas y esperas superiores a 1 hora)</strong>.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--pbi-text-sub)" }}>
                El score se calculó mediante un enfoque híbrido validado contra el NPS declarado por el cliente (rho de
                Spearman = +0,759 para el juicio del LLM, confirmando alta correlación con la percepción real del usuario).
              </p>
            </div>

            <div className="grid cols-3" style={{ margin: "16px 0" }}>
              <Kpi
                etiqueta="Score Promedio Global"
                valor={e.score_medio}
                subtitulo={`Sobre 100 pts (desviación: ${d.kpis.score_satisfaccion_sd})`}
                estado="primario"
              />
              <Kpi
                etiqueta="Factor Crítico #1"
                valor="No Resolvió Solicitud"
                subtitulo="Presente en 342 conversaciones"
                estado="peligro"
              />
              <Kpi
                etiqueta="Correlación vs NPS Real"
                valor="+0,759"
                subtitulo="Spearman vs NPS declarado (n=217)"
                estado="exito"
              />
            </div>

            {/* TABLA OBLIGATORIA DEL ENUNCIADO: 5 CONVERSACIONES PEOR CALIFICADAS */}
            <Card
              titulo="Las 5 Conversaciones Peor Calificadas del Corpus (Requerimiento Literal)"
              subtitulo="Detalle de factores de insatisfacción y recomendación concreta de mejora"
              badge="Score Mínimo: 7.5 / 100"
            >
              <Tabla
                columnas={[
                  {
                    clave: "id",
                    titulo: "ID Conv.",
                    render: (f) => <strong>{f.id}</strong>,
                  },
                  {
                    clave: "score_satisfaccion",
                    titulo: "Score",
                    num: true,
                    render: (f) => (
                      <span className="pbi-score-danger">{f.score_satisfaccion}</span>
                    ),
                  },
                  {
                    clave: "factores",
                    titulo: "Factores de Fricción",
                    render: (f) => (
                      <div className="pbi-factor-tags">
                        {f.factores.split("|").map((fac, idx) => (
                          <span key={idx} className="pbi-tag-error">
                            {fac.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                  {
                    clave: "resumen",
                    titulo: "Qué Ocurrió en la Interacción",
                    render: (f) => (
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>{f.resumen}</p>
                    ),
                  },
                  {
                    clave: "recomendacion_mejora",
                    titulo: "Recomendación Concreta de Mejora",
                    render: (f) => (
                      <div className="pbi-rec-box">
                        💡 {f.recomendacion_mejora}
                      </div>
                    ),
                  },
                ]}
                filas={e.peores.slice(0, 5)}
              />
            </Card>

            <div className="grid cols-2" style={{ marginTop: 16 }}>
              <Card titulo="Distribución de Factores de Insatisfacción">
                <BarrasH
                  datos={e.factores.filter((f) => f.clave !== "NINGUNO")}
                  campo="n"
                  colorBase="#dc2626"
                  etiquetaValor=" conv."
                />
              </Card>
              <Card titulo="Histograma del Score de Satisfacción (0 a 100)">
                <BarrasH
                  datos={e.distribucion_score}
                  campo="n"
                  colorBase="#0284c7"
                  etiquetaValor=" llamadas"
                />
              </Card>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
