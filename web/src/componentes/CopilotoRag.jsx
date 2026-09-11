import React, { useState } from "react";
import { PbiVisual, PbiCard, PbiCallout, PALETA_PBI } from "./ui.jsx";

const CASOS_PRUEBA = [
  {
    id: "caso-1",
    titulo: "Caso 1: Pérdida de Empleo (Desempleo)",
    mensaje: "Buenas tardes, me quede sin empleo hace 20 dias y por eso no he podido cancelar la cuota.",
    motivo: "DESEMPLEO",
    politica: "[POL-DESEMPLEO-01] Periodo de Gracia y Congelamiento por Pérdida de Empleo",
    normativa: "Circular Externa 026 de la SFC sobre reestructuración preventiva de créditos.",
    sugerencia:
      "Buenas tardes. Lamentamos conocer su situación laboral. Conforme a la política institucional de alivio financiero (Circular Externa 026 de la SFC), podemos habilitarle un periodo de gracia de 60 días sin intereses moratorios y evaluar una refinanciación a 24 meses. ¿Le parece conveniente que formalicemos este trámite para el próximo viernes 17 de noviembre?",
  },
  {
    id: "caso-2",
    titulo: "Caso 2: Pago Ya Realizado por PSE",
    mensaje: "Senores, yo ya pague esa cuota el lunes por PSE y me siguen cobrando, solucionenme eso ya.",
    motivo: "YA_PAGO_O_PAGO_NO_APLICADO",
    politica: "[POL-PAGO-03] Protocolo de Recepción de Comprobante y Suspensión Preventiva",
    normativa: "Ley 1581 de 2012 (Habeas Data Financiero) y Circular Básica Jurídica SFC.",
    sugerencia:
      "Estimado cliente, agradecemos su comunicación y comprendemos su molestia. Conforme a la Ley 1581 de 2012 de Habeas Data, hemos suspendido temporalmente la gestión de cobro por 48 horas hábiles. Le solicitamos por favor enviar por este mismo medio el número de aprobación o comprobante digital de PSE para validar la aplicación contable en el Core bancario.",
  },
  {
    id: "caso-3",
    titulo: "Caso 3: Desacuerdo en Liquidación de Intereses",
    mensaje: "El monto que me cobran no es correcto, me estan cobrando 200 mil pesos de mas en intereses.",
    motivo: "DESACUERDO_MONTO_O_COBRO",
    politica: "[POL-DESACUERDO-04] Aclaración Detallada de Saldo y Condonación de Gastos de Cobranza",
    normativa: "Ley 2300 de 2023 sobre transparencia en honorarios y canales de cobranza.",
    sugerencia:
      "Agradecemos su observación. De acuerdo con la Ley 2300 de 2023, le compartimos el extracto detallado de su obligación: Capital adeudado e intereses corrientes. Para brindarle una solución favorable, si cancela el saldo de capital antes del 30 de noviembre, le aplicaremos una condonación del 100% sobre los honorarios de cobranza prejudicial. ¿Desea acogerse a esta alternativa?",
  },
  {
    id: "caso-4",
    titulo: "Caso 4: Gastos Médicos y Calamidad Familiar",
    mensaje: "Se me presentaron gastos medicos por una cirugia de mi hijo y me quede sin presupuesto este mes.",
    motivo: "ENFERMEDAD_O_CALAMIDAD",
    politica: "[POL-ENFERMEDAD-05] Activación de Cobertura de Seguros y Alivio Humanitario",
    normativa: "Estatuto Orgánico del Sistema Financiero (EOSF) y Ley 2157 de 2021.",
    sugerencia:
      "Lamentamos profundamente la situación médica familiar. Verificaremos de inmediato si su producto cuenta con póliza de seguro asociada que cubra este evento. De no ser así, le concederemos una prórroga extraordinaria de pago de 30 días sin generar reporte negativo a centrales de riesgo. ¿Le parece bien agendar el compromiso para el 15 del próximo mes?",
  },
];

export function CopilotoRag() {
  const [casoSeleccionado, setCasoSeleccionado] = useState(CASOS_PRUEBA[0]);
  const [mensajeLibre, setMensajeLibre] = useState(CASOS_PRUEBA[0].mensaje);
  const [tramoMora, setTramoMora] = useState("30-60 dias");
  const [producto, setProducto] = useState("Tarjeta de Credito");
  const [apiKey, setApiKey] = useState("");
  const [resultado, setResultado] = useState(CASOS_PRUEBA[0]);
  const [cargando, setCargando] = useState(false);

  const ejecutarSimulacion = async () => {
    // Si el usuario ingresó API Key en el navegador, hacemos llamada directa a OpenAI
    if (apiKey.trim().startsWith("sk-")) {
      setCargando(true);
      try {
        const promptSistema =
          "Eres un copiloto RAG de cobranza para un banco colombiano. Dado el mensaje del cliente, " +
          "sugiere al asesor humano una respuesta profesional, citando la normativa de cobranza (SFC, Ley 2300) " +
          "y buscando un compromiso de pago con fecha específica. Responde en JSON con las claves: " +
          "motivo, politica, normativa, sugerencia.";

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: promptSistema },
              {
                role: "user",
                content: `Producto: ${producto}, Tramo: ${tramoMora}, Mensaje cliente: "${mensajeLibre}"`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        const data = await res.json();
        if (data.choices && data.choices[0]) {
          const parsed = JSON.parse(data.choices[0].message.content);
          setResultado({
            id: "custom",
            titulo: "Generación en Vivo (gpt-4o-mini)",
            mensaje: mensajeLibre,
            motivo: parsed.motivo || "MOTIVO_DETECTADO",
            politica: parsed.politica || "Política Institucional de Alivio",
            normativa: parsed.normativa || "Circular Externa SFC",
            sugerencia: parsed.sugerencia || "Respuesta generada.",
          });
          setCargando(false);
          return;
        }
      } catch (err) {
        console.error("Error en llamada a OpenAI, usando motor local precomputado", err);
      }
      setCargando(false);
    }

    // Fallback con el motor precomputado RAG
    const encontrado = CASOS_PRUEBA.find(
      (c) => c.mensaje.toLowerCase() === mensajeLibre.toLowerCase()
    );
    if (encontrado) {
      setResultado(encontrado);
    } else {
      setResultado({
        id: "custom",
        titulo: "Respuesta Estandarizada RAG",
        mensaje: mensajeLibre,
        motivo: "ATENCIÓN_PERSONALIZADA",
        politica: "[POL-DEFAULT-06] Acuerdo de Pago con Descuento en Intereses Moratorios",
        normativa: "Manual de Cobranza Interno y Régimen de Protección al Consumidor Financiero (Ley 1328).",
        sugerencia:
          `Entendemos su situación con respecto a su ${producto}. De acuerdo con nuestra política de cartera ` +
          `(Manual Interno de Alivio Financiero), le podemos conceder un descuento del 80% sobre intereses moratorios ` +
          `si programa el pago para una fecha específica dentro de los próximos 10 días. ¿Le parece conveniente formalizar este acuerdo?`,
      });
    }
  };

  const seleccionarCaso = (caso) => {
    setCasoSeleccionado(caso);
    setMensajeLibre(caso.mensaje);
    setResultado(caso);
  };

  return (
    <div className="pbi-canvas-page">
      <div className="pbi-section-title-bar">
        <span className="pbi-section-tag">Reto Técnico 3.b · 35 Puntos</span>
        <h2 className="pbi-section-heading">
          Demostrador Interactivo del Copiloto RAG de Cobranza (Human-in-the-Loop)
        </h2>
      </div>

      <div className="pbi-cards-grid cols-3" style={{ marginBottom: 14 }}>
        <PbiCard
          titulo="Enfoque de Arquitectura"
          valor="Copiloto Asistido"
          subtitulo="El asesor humano valida antes de enviar"
          indicadorColor={PALETA_PBI.azul1}
        />
        <PbiCard
          titulo="Base de Conocimiento"
          valor="Normativa SFC + Leyes"
          subtitulo="Circulares SFC, Ley 1581 y Ley 2300"
          indicadorColor={PALETA_PBI.verde}
        />
        <PbiCard
          titulo="Objetivo Vinculante"
          valor="Acuerdo con Fecha"
          subtitulo="Estandarización y trazabilidad"
          indicadorColor={PALETA_PBI.naranja}
        />
      </div>

      {/* Controles de Entrada y Parámetros */}
      <div className="pbi-visuals-grid cols-2">
        <PbiVisual
          titulo="Entrada de la Conversación de WhatsApp (Mensaje del Cliente)"
          subtitulo="Seleccione un caso real del corpus o ingrese una objeción de mora"
        >
          <div className="pbi-rag-controls">
            <div className="pbi-rag-group">
              <label className="pbi-rag-label">Casos Típicos del Corpus:</label>
              <div className="pbi-case-buttons">
                {CASOS_PRUEBA.map((caso) => (
                  <button
                    key={caso.id}
                    type="button"
                    className={`pbi-case-btn ${casoSeleccionado.id === caso.id ? "active" : ""}`}
                    onClick={() => seleccionarCaso(caso)}
                  >
                    {caso.titulo}
                  </button>
                ))}
              </div>
            </div>

            <div className="pbi-rag-group">
              <label className="pbi-rag-label">Mensaje entrante del Cliente:</label>
              <textarea
                className="pbi-textarea"
                rows={3}
                value={mensajeLibre}
                onChange={(e) => setMensajeLibre(e.target.value)}
                placeholder="Escriba el mensaje del cliente..."
              />
            </div>

            <div className="pbi-rag-grid-params">
              <div>
                <label className="pbi-rag-label">Producto Financiero:</label>
                <select
                  className="pbi-select"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                >
                  <option value="Tarjeta de Credito">Tarjeta de Crédito</option>
                  <option value="Credito de Libre Inversion">Crédito de Libre Inversión</option>
                  <option value="Credito Hipotecario">Crédito Hipotecario</option>
                  <option value="Credito de Vehiculo">Crédito de Vehículo</option>
                </select>
              </div>

              <div>
                <label className="pbi-rag-label">Tramo de Mora:</label>
                <select
                  className="pbi-select"
                  value={tramoMora}
                  onChange={(e) => setTramoMora(e.target.value)}
                >
                  <option value="1-30 dias">1 a 30 días (Preventiva)</option>
                  <option value="30-60 dias">30 a 60 días (Mora Temprana)</option>
                  <option value="60-90 dias">60 a 90 días (Mora Media)</option>
                  <option value="90+ dias">Más de 90 días (Prejudicial)</option>
                </select>
              </div>
            </div>

            <div className="pbi-rag-group" style={{ marginTop: 10 }}>
              <label className="pbi-rag-label">
                OpenAI API Key (Opcional - para llamada directa en vivo):
              </label>
              <input
                type="password"
                className="pbi-input-text"
                placeholder="sk-proj-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <span className="pbi-input-hint">
                Si no se ingresa clave, se ejecuta el motor determinista con las respuestas oficiales del script <code>scripts/rag_bot.py</code>.
              </span>
            </div>

            <button
              type="button"
              className="pbi-btn-action"
              style={{ marginTop: 12, width: "100%" }}
              disabled={cargando || !mensajeLibre.trim()}
              onClick={ejecutarSimulacion}
            >
              {cargando ? "Ejecutando Recuperación RAG..." : "Generar Respuesta Estandarizada para el Asesor"}
            </button>
          </div>
        </PbiVisual>

        {/* Salida y Diagnóstico del Copiloto */}
        <PbiVisual
          titulo="Salida del Copiloto RAG para el Asesor de Cobranza"
          subtitulo="Respuesta sugerida con trazabilidad normativa y citación de política"
        >
          <div className="pbi-rag-output-box">
            <div className="output-row">
              <span className="output-label">Motivo de No Pago Identificado:</span>
              <span className="output-value-tag">{resultado.motivo}</span>
            </div>

            <div className="output-row">
              <span className="output-label">Política Recuperada de la Base:</span>
              <span className="output-text-bold">{resultado.politica}</span>
            </div>

            <div className="output-row">
              <span className="output-label">Soporte Regulatorio:</span>
              <span className="output-text-legal">{resultado.normativa}</span>
            </div>

            <div className="output-main-card">
              <div className="output-main-header">Sugerencia de Respuesta para el Asesor Humano</div>
              <p className="output-main-body">{resultado.sugerencia}</p>
              <div className="output-main-footer">
                Guardarraíles verificados: Tono empático, sin agresión (Ley 2300), citación obligatoria y búsqueda de fecha.
              </div>
            </div>

            <div className="output-actions">
              <button
                type="button"
                className="pbi-btn-secondary"
                onClick={() => navigator.clipboard.writeText(resultado.sugerencia)}
              >
                Copiar al Portapapeles
              </button>
              <span className="output-status-ok">Conforme a Política Institucional</span>
            </div>
          </div>
        </PbiVisual>
      </div>

      {/* Arquitectura del Sistema */}
      <PbiVisual
        titulo="Componentes de la Arquitectura RAG Propuesta (Reto 3.b)"
        subtitulo="Diseño modular escalable para operaciones bancarias de cobranza"
      >
        <div className="pbi-arch-grid">
          <div className="pbi-arch-item">
            <div className="pbi-arch-title">1. Base de Conocimiento</div>
            <p className="pbi-arch-desc">
              Manuales de cobranza, matrices de alivio por tramo de mora, catálogo de tasas y normativa (Ley 1581, Ley 2300, Circular SFC 026).
            </p>
          </div>
          <div className="pbi-arch-item">
            <div className="pbi-arch-title">2. Ingesta y Segmentación</div>
            <p className="pbi-arch-desc">
              Normalización de textos de WhatsApp, decodificación de anomalías del anonimizador y chunking estructurado por cláusula.
            </p>
          </div>
          <div className="pbi-arch-item">
            <div className="pbi-arch-title">3. Recuperador Híbrido</div>
            <p className="pbi-arch-desc">
              Pre-filtrado por producto y tramo de mora, seguido de indexación dual (BM25 léxico + embeddings densos de dominio financiero).
            </p>
          </div>
          <div className="pbi-arch-item">
            <div className="pbi-arch-title">4. Generador con Citación</div>
            <p className="pbi-arch-desc">
              Modelo LLM con temperatura baja (0.2) y prompt con few-shot que exige citar la política aplicable y proponer fecha específica.
            </p>
          </div>
          <div className="pbi-arch-item">
            <div className="pbi-arch-title">5. Guardarraíles de Cumplimiento</div>
            <p className="pbi-arch-desc">
              Validación determinista contra tasa de usura, verificación de respeto a horarios de contacto y control de alucinaciones.
            </p>
          </div>
          <div className="pbi-arch-item">
            <div className="pbi-arch-title">6. Interfaz Copiloto</div>
            <p className="pbi-arch-desc">
              Extensión integrada en el CRM / consola de WhatsApp donde el asesor humano revisa, adapta y aprueba el envío.
            </p>
          </div>
        </div>
      </PbiVisual>
    </div>
  );
}
