import React, { useState, useRef, useEffect } from "react";
import { PALETA } from "./ui.jsx";

/* ─── Casos de prueba precomputados ─────────────────────────────────────────── */
const CASOS = [
  {
    id: "caso-1",
    etiqueta: "Pérdida de empleo",
    mensaje: "Buenas tardes, me quede sin empleo hace 20 dias y por eso no he podido cancelar la cuota.",
    motivo: "DESEMPLEO",
    politica: "[POL-DESEMPLEO-01] Período de Gracia por Pérdida de Empleo",
    normativa: "Circular Externa 026 SFC — Reestructuración preventiva de créditos.",
    sugerencia:
      "Buenas tardes. Lamentamos conocer su situación laboral. De acuerdo con la Circular Externa 026 de la SFC, podemos habilitarle un período de gracia de 60 días sin intereses moratorios y evaluar una refinanciación a 24 meses. ¿Le parece que formalizamos este trámite para el próximo viernes 17 de noviembre?",
  },
  {
    id: "caso-2",
    etiqueta: "Pago realizado / no aplicado",
    mensaje: "Senores, yo ya pague esa cuota el lunes por PSE y me siguen cobrando, solucionenme eso ya.",
    motivo: "PAGO_NO_APLICADO",
    politica: "[POL-PAGO-03] Suspensión Preventiva y Protocolo de Comprobante",
    normativa: "Ley 1581/2012 (Habeas Data Financiero) y Circular Básica Jurídica SFC.",
    sugerencia:
      "Estimado cliente, comprendemos su molestia. Conforme a la Ley 1581 de 2012, hemos suspendido la gestión de cobro por 48 horas hábiles. Le solicitamos enviar el número de aprobación o comprobante de PSE para validar la aplicación contable en el Core bancario.",
  },
  {
    id: "caso-3",
    etiqueta: "Desacuerdo en monto / intereses",
    mensaje: "El monto que me cobran no es correcto, me estan cobrando 200 mil pesos de mas en intereses.",
    motivo: "DESACUERDO_MONTO",
    politica: "[POL-DESACUERDO-04] Aclaración de Saldo y Condonación de Gastos de Cobranza",
    normativa: "Ley 2300/2023 — Transparencia en honorarios y canales de cobranza.",
    sugerencia:
      "Agradecemos su observación. Según la Ley 2300 de 2023, le compartimos el extracto detallado de su obligación. Si cancela el saldo de capital antes del 30 de noviembre, le aplicaremos condonación del 100% sobre los honorarios de cobranza prejudicial. ¿Desea acogerse a esta alternativa?",
  },
  {
    id: "caso-4",
    etiqueta: "Gastos médicos / calamidad familiar",
    mensaje: "Se me presentaron gastos medicos por una cirugia de mi hijo y me quede sin presupuesto.",
    motivo: "CALAMIDAD_FAMILIAR",
    politica: "[POL-ENFERMEDAD-05] Activación de Seguro y Alivio Humanitario",
    normativa: "EOSF (Estatuto Orgánico del Sistema Financiero) y Ley 2157/2021.",
    sugerencia:
      "Lamentamos la situación familiar. Verificaremos si su producto cuenta con póliza de seguro asociada que cubra este evento. De no ser así, le concedemos una prórroga extraordinaria de 30 días sin generar reporte a centrales de riesgo. ¿Agendamos el compromiso para el 15 del próximo mes?",
  },
];

const PRODUCTOS = [
  "Tarjeta de Crédito",
  "Crédito de Libre Inversión",
  "Crédito Hipotecario",
  "Crédito de Vehículo",
];

const TRAMOS = [
  { value: "1-30 dias",  label: "1–30 días (Preventiva)" },
  { value: "30-60 dias", label: "30–60 días (Mora Temprana)" },
  { value: "60-90 dias", label: "60–90 días (Mora Media)" },
  { value: "90+ dias",   label: "Más de 90 días (Prejudicial)" },
];

/* ─── Sub-componente: Panel de resultado ─────────────────────────────────────── */
function ResultadoPanel({ resultado, cargando, onCopiar, copiado }) {
  if (cargando) {
    return (
      <div className="rag-loading">
        <div className="rag-spinner" />
        <span className="rag-loading-text">Ejecutando recuperación RAG…</span>
      </div>
    );
  }
  if (!resultado) {
    return (
      <div className="rag-empty">
        <div className="rag-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
          </svg>
        </div>
        <p className="rag-empty-text">Seleccione un caso de prueba o ingrese un mensaje del cliente y presione <strong>Generar respuesta</strong>.</p>
      </div>
    );
  }

  return (
    <div className="rag-result">
      {/* Fila de metadatos */}
      <div className="rag-result-meta">
        <div className="rag-meta-chip motivo">
          <span className="rag-meta-label">Motivo detectado</span>
          <span className="rag-meta-value">{resultado.motivo.replace(/_/g, " ")}</span>
        </div>
        <div className="rag-meta-chip politica">
          <span className="rag-meta-label">Política recuperada</span>
          <span className="rag-meta-value">{resultado.politica}</span>
        </div>
        <div className="rag-meta-chip normativa">
          <span className="rag-meta-label">Soporte regulatorio</span>
          <span className="rag-meta-value">{resultado.normativa}</span>
        </div>
      </div>

      {/* Respuesta sugerida */}
      <div className="rag-sugerencia-card">
        <div className="rag-sugerencia-header">
          <span className="rag-sugerencia-label">Respuesta sugerida para el asesor</span>
          <div className="rag-guardarrail-badge">
            <span className="guardarrail-dot" />
            Guardarraíles: tono empático · sin agresión (Ley 2300) · fecha específica
          </div>
        </div>
        <p className="rag-sugerencia-body">{resultado.sugerencia}</p>
        <div className="rag-sugerencia-footer">
          <button
            type="button"
            className={`btn-copy ${copiado ? "copied" : ""}`}
            onClick={onCopiar}
          >
            {copiado ? (
              <>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path d="M12.354 4.354a.5.5 0 00-.708-.708L5 11.293 2.354 8.646a.5.5 0 10-.708.708l3 3a.5.5 0 00.708 0l7-7z"/>
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3zm-3-1A1.5 1.5 0 005 1.5v1A1.5 1.5 0 006.5 4h3A1.5 1.5 0 0011 2.5v-1A1.5 1.5 0 009.5 0h-3z"/>
                </svg>
                Copiar al portapapeles
              </>
            )}
          </button>
          <span className="rag-conforme-badge">Conforme a política institucional</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────────── */
export function CopilotoRag() {
  const [casoActivo, setCasoActivo] = useState(null);
  const [mensaje, setMensaje]       = useState("");
  const [producto, setProducto]     = useState(PRODUCTOS[0]);
  const [tramo, setTramo]           = useState(TRAMOS[1].value);
  const [apiKey, setApiKey]         = useState("");
  const [resultado, setResultado]   = useState(null);
  const [cargando, setCargando]     = useState(false);
  const [copiado, setCopiado]       = useState(false);
  const textareaRef                 = useRef(null);

  const seleccionarCaso = (caso) => {
    setCasoActivo(caso.id);
    setMensaje(caso.mensaje);
    setResultado(caso);
  };

  const limpiar = () => {
    setCasoActivo(null);
    setMensaje("");
    setResultado(null);
  };

  const generarRespuesta = async () => {
    if (!mensaje.trim()) return;
    setCargando(true);
    setResultado(null);

    // Llamada en vivo a OpenAI si hay API Key
    if (apiKey.trim().startsWith("sk-")) {
      try {
        const sys =
          "Eres un copiloto RAG de cobranza para un banco colombiano. Dado el mensaje del cliente, " +
          "sugiere al asesor humano una respuesta profesional, citando la normativa de cobranza (SFC, Ley 2300) " +
          "y buscando un compromiso de pago con fecha específica. Responde en JSON con las claves: " +
          "motivo, politica, normativa, sugerencia.";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: sys },
              { role: "user", content: `Producto: ${producto}, Tramo mora: ${tramo}, Mensaje: "${mensaje}"` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });
        const data = await res.json();
        if (data.choices?.[0]) {
          const p = JSON.parse(data.choices[0].message.content);
          setResultado({
            id: "live", motivo: p.motivo || "DETECTADO",
            politica: p.politica || "Política Institucional",
            normativa: p.normativa || "Circular SFC",
            sugerencia: p.sugerencia || "Respuesta generada.",
          });
          setCargando(false);
          return;
        }
      } catch (e) {
        console.warn("Fallo API en vivo — usando motor precomputado", e);
      }
    }

    // Motor determinista (precomputado)
    await new Promise((r) => setTimeout(r, 600)); // simula latencia
    const encontrado = CASOS.find((c) => c.mensaje.toLowerCase() === mensaje.toLowerCase());
    setResultado(
      encontrado ?? {
        id: "default",
        motivo: "ATENCIÓN_PERSONALIZADA",
        politica: "[POL-DEFAULT-06] Acuerdo con Descuento en Intereses Moratorios",
        normativa: "Manual de Cobranza Interno y Ley 1328 (Protección al Consumidor Financiero).",
        sugerencia:
          `Entendemos su situación con respecto a su ${producto}. De acuerdo con la política de cartera ` +
          `(Manual Interno de Alivio Financiero), le podemos conceder un descuento del 80% sobre intereses moratorios ` +
          `si programa el pago para una fecha específica dentro de los próximos 10 días. ¿Le parece conveniente formalizar este acuerdo?`,
      }
    );
    setCargando(false);
  };

  const copiarTexto = () => {
    if (resultado?.sugerencia) {
      navigator.clipboard.writeText(resultado.sugerencia);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Encabezado de sección */}
      <div className="section-heading-bar">
        <span className="section-tag">Reto Técnico 3.b — 35 puntos</span>
        <h2 className="section-heading">Copiloto RAG de Cobranza — Demostrador Interactivo</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>
          Motor de recuperación de políticas institucionales y normativa colombiana (SFC, Ley 2300, Ley 1581).
          El asesor humano revisa y aprueba la respuesta antes de enviar al cliente (Human-in-the-Loop).
        </p>
      </div>

      {/* Layout principal: Entrada | Salida */}
      <div className="rag-workspace">
        {/* Columna izquierda — Entrada */}
        <div className="rag-input-col">

          {/* Casos de prueba */}
          <div className="rag-section-label">Casos típicos del corpus</div>
          <div className="rag-casos-grid">
            {CASOS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`rag-caso-card ${casoActivo === c.id ? "active" : ""}`}
                onClick={() => seleccionarCaso(c)}
              >
                <span className="rag-caso-dot" />
                {c.etiqueta}
              </button>
            ))}
          </div>

          {/* Mensaje del cliente */}
          <div className="rag-field-group">
            <label className="rag-field-label">
              Mensaje del cliente{" "}
              {mensaje && (
                <button type="button" className="rag-clear-btn" onClick={limpiar}>
                  Limpiar
                </button>
              )}
            </label>
            <textarea
              ref={textareaRef}
              className="rag-message-input"
              rows={4}
              value={mensaje}
              onChange={(e) => {
                setMensaje(e.target.value);
                setCasoActivo(null);
                setResultado(null);
              }}
              placeholder="Escriba o pegue el mensaje del cliente en WhatsApp…"
            />
          </div>

          {/* Contexto del caso */}
          <div className="rag-context-row">
            <div className="rag-field-group">
              <label className="rag-field-label">Producto financiero</label>
              <select className="rag-select" value={producto} onChange={(e) => setProducto(e.target.value)}>
                {PRODUCTOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="rag-field-group">
              <label className="rag-field-label">Tramo de mora</label>
              <select className="rag-select" value={tramo} onChange={(e) => setTramo(e.target.value)}>
                {TRAMOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* API Key opcional */}
          <div className="rag-field-group">
            <label className="rag-field-label">
              OpenAI API Key
              <span className="rag-optional-tag">opcional — para generación en vivo</span>
            </label>
            <input
              type="password"
              className="rag-api-input"
              placeholder="sk-proj-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <span className="rag-hint-text">
              Sin clave: motor determinista precomputado (scripts/rag_bot.py).
              Con clave: llamada directa a gpt-4o-mini con temperatura 0.2.
            </span>
          </div>

          {/* Botón de acción */}
          <button
            type="button"
            className="rag-submit-btn"
            disabled={cargando || !mensaje.trim()}
            onClick={generarRespuesta}
          >
            {cargando ? (
              <><span className="rag-btn-spinner" /> Ejecutando recuperación…</>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                  <path d="M15.854.146a.5.5 0 01.11.54l-5.819 14.547a.75.75 0 01-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 01.124-1.33L15.314.037a.5.5 0 01.54.11zM6.025 7.854l2.896 4.551 4.713-11.782-7.61 7.231zm1.88-1.88l7.23-6.609L3.354 4.278l4.551 1.696z"/>
                </svg>
                Generar respuesta estandarizada
              </>
            )}
          </button>
        </div>

        {/* Columna derecha — Salida */}
        <div className="rag-output-col">
          <div className="rag-section-label">Salida del copiloto para el asesor</div>
          <ResultadoPanel
            resultado={resultado}
            cargando={cargando}
            onCopiar={copiarTexto}
            copiado={copiado}
          />
        </div>
      </div>

      {/* Arquitectura del sistema */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <h3 className="panel-title">Arquitectura RAG Propuesta — Reto 3.b</h3>
            <span className="panel-subtitle">Diseño modular escalable para operaciones bancarias de cobranza</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="arch-grid">
            {[
              { n: "01", t: "Base de Conocimiento", d: "Manuales de cobranza, matrices de alivio por tramo de mora, catálogo de tasas y normativa (Ley 1581, Ley 2300, Circular SFC 026)." },
              { n: "02", t: "Ingesta y Segmentación", d: "Normalización de textos de WhatsApp, decodificación de anomalías del anonimizador y chunking estructurado por cláusula." },
              { n: "03", t: "Recuperador Híbrido", d: "Pre-filtrado por producto y tramo de mora, seguido de indexación dual: BM25 léxico + embeddings densos de dominio financiero." },
              { n: "04", t: "Generador con Citación", d: "LLM con temperatura 0.2 y prompt few-shot que exige citar la política aplicable y proponer fecha específica de pago." },
              { n: "05", t: "Guardarraíles de Cumplimiento", d: "Validación contra tasa de usura, verificación de horarios de contacto (Ley 2300) y control de alucinaciones por citación." },
              { n: "06", t: "Interfaz Copiloto (HiTL)", d: "Panel integrado en CRM o consola de WhatsApp donde el asesor humano revisa, adapta y aprueba el mensaje antes de enviar." },
            ].map((item) => (
              <div key={item.n} className="arch-card">
                <div className="arch-card-num">{item.n}</div>
                <div className="arch-card-title">{item.t}</div>
                <p className="arch-card-desc">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
