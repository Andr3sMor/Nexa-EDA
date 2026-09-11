import React, { useState } from "react";
import { Card, Pill, Aviso } from "./ui.jsx";

export function RecomendacionesView() {
  const [iniciativaSeleccionada, setIniciativaSeleccionada] = useState(0);

  const INICIATIVAS = [
    {
      id: 0,
      titulo: "Rediseño Urgente del Flujo del Bot Automatizado (Quick Win)",
      tipo: "Alto Impacto / Bajo Esfuerzo",
      color: "#059669",
      evidencia: "El 60,1% de las llamadas presentan fricción de bot. En el 19,4% es causa directa de insatisfacción crítica. El score cae de 72,1 a 58,4 puntos cuando hay bucle de bot.",
      accion: "Eliminar la re-solicitud cíclica de datos personales una vez que el cliente ya los digitó. Si el bot no clasifica la intención en 2 turnos o el cliente escribe 'asesor' / 'humano', transferir inmediatamente inyectando el historial al agente.",
      kpiImpacto: "-40% en tiempo de ciclo de llamada y +12 puntos en el score de satisfacción general.",
    },
    {
      id: 1,
      titulo: "Protocolo Ágil para 'Ya Pagué' y 'Desacuerdo con el Monto'",
      tipo: "Alto Impacto / Medio Esfuerzo",
      color: "#0284c7",
      evidencia: "84 clientes expresan desacuerdo con el saldo cobrado y 15 indican haber pagado previamente. Hoy los asesores insisten en el pago sin verificar el desfase de aplicación contable, generando reclamos y calificaciones de 7.5/100.",
      accion: "Habilitar la recepción y validación óptica de comprobantes de pago por WhatsApp mediante OCR y consulta en línea al Core bancario. Suspender la gestión de cobro por 48 horas hábiles mientras se valida el soporte.",
      kpiImpacto: "Reducción de quejas regulatorias ante la SFC y rescate del 85% de clientes inconformes por pagos no aplicados.",
    },
    {
      id: 2,
      titulo: "Catálogo Dinámico de Alternativas por Capacidad de Pago",
      tipo: "Estratégico / Medio Esfuerzo",
      color: "#6366f1",
      evidencia: "El 44,7% de los motivos declarados corresponden a 'Ingresos Insuficientes' (139) o 'Desempleo' (57). 'Falta de flexibilidad en la oferta' aparece en 51 conversaciones (4,3% del corpus): es uno de los factores de insatisfacción menos frecuentes, pero consistente con un catálogo de alternativas rígido frente a esos motivos.",
      accion: "Implementar planes de pago diferido con periodo de gracia de 30 a 60 días para clientes en transición laboral o calamidad demostrada, en lugar de presionar exclusivamente por el 'Pago Total Inmediato'.",
      kpiImpacto: "Aumento estimado del +20% en compromisos de pago cumplidos a 90 días.",
    },
    {
      id: 3,
      titulo: "Monitoreo en Tiempo Real del Score de Calidad y Alertas",
      tipo: "Estratégico / Alto Impacto",
      color: "#d97706",
      evidencia: "El score híbrido demostró una correlación de Spearman de +0,759 con el NPS declarado por el usuario. Permite saber la satisfacción sin esperar a que el cliente responda una encuesta.",
      accion: "Procesar las conversaciones en streaming al finalizar la llamada con el pipeline de extracción. Disparar alertas automáticas al supervisor cuando el score sea inferior a 40 para recontacto de retención en menos de 2 horas.",
      kpiImpacto: "Prevención de cancelaciones de producto y recuperación de relaciones comerciales en riesgo.",
    },
  ];

  return (
    <div className="pbi-page-container">
      <div className="pbi-page-header">
        <div>
          <span className="pbi-section-pill">Reto Técnico 3.d · 15 Puntos de Evaluación</span>
          <h2 className="pbi-page-title">Hallazgos Principales y Recomendaciones de Negocio</h2>
          <p className="pbi-page-desc">
            Plan de acción estratégico derivado de los hallazgos empíricos sobre las 1.197 conversaciones del banco,
            orientado a maximizar la tasa de recuperación de cartera y elevar la satisfacción de los clientes.
          </p>
        </div>
      </div>

      {/* Matriz de Impacto vs Esfuerzo */}
      <Card
        titulo="Matriz Estratégica de Iniciativas (Impacto vs. Complejidad de Adopción)"
        subtitulo="Priorización sugerida para la gerencia de operaciones y cobranza"
      >
        <div className="pbi-matrix-grid">
          {INICIATIVAS.map((ini) => {
            const activa = iniciativaSeleccionada === ini.id;
            return (
              <div
                key={ini.id}
                className={`pbi-matrix-card ${activa ? "pbi-matrix-card-active" : ""}`}
                style={{ borderLeftColor: ini.color }}
                onClick={() => setIniciativaSeleccionada(ini.id)}
              >
                <div className="pbi-matrix-top">
                  <span className="pbi-matrix-badge" style={{ color: ini.color, background: `${ini.color}15` }}>
                    {ini.tipo}
                  </span>
                </div>
                <h4 className="pbi-matrix-title">{ini.titulo}</h4>
                <p className="pbi-matrix-desc">{ini.accion.slice(0, 120)}...</p>
                <span className="pbi-matrix-btn">Ver plan de acción completo →</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detalle de la iniciativa seleccionada */}
      <div style={{ marginTop: 20 }}>
        {(() => {
          const ini = INICIATIVAS[iniciativaSeleccionada];
          return (
            <Card
              titulo={`Plan Detallado: ${ini.titulo}`}
              badge={ini.tipo}
              nota="Iniciativa sustentada en la evidencia empírica de las 1.197 conversaciones analizadas con IA."
            >
              <div className="grid cols-3" style={{ gap: 20 }}>
                <div className="pbi-rec-col">
                  <div className="pbi-rec-label">1. EVIDENCIA EN LOS DATOS</div>
                  <div className="pbi-rec-box-info">{ini.evidencia}</div>
                </div>
                <div className="pbi-rec-col">
                  <div className="pbi-rec-label">2. ACCIÓN OPERATIVA RECOMENDADA</div>
                  <div className="pbi-rec-box-action">{ini.accion}</div>
                </div>
                <div className="pbi-rec-col">
                  <div className="pbi-rec-label">3. KPI DE IMPACTO ESPERADO</div>
                  <div className="pbi-rec-box-kpi">🎯 {ini.kpiImpacto}</div>
                </div>
              </div>
            </Card>
          );
        })()}
      </div>

      {/* Resumen de Hallazgos Clave */}
      <div className="grid cols-2" style={{ marginTop: 20 }}>
        <Card titulo="Síntesis de Hallazgos de Cobranza">
          <ul className="pbi-check-list">
            <li>
              <strong>El acuerdo de pago real es del 6,5%:</strong> Exigir compromiso con fecha específica revela que
              la mayoría de interacciones son meras consultas o promesas difusas ("cuando me paguen le cancelo").
            </li>
            <li>
              <strong>El asesor domina la oferta pero no indaga el motivo:</strong> Solo en el 28,4% de las llamadas el
              asesor pregunta formalmente por qué no se ha podido pagar. Preguntar el motivo aumenta la receptividad del cliente.
            </li>
            <li>
              <strong>El bot genera más rechazo que ayuda:</strong> Al simular ser humano ("Hola, mi nombre es..."), el
              cliente siente engaño cuando el bot repite respuestas automáticas.
            </li>
          </ul>
        </Card>

        <Card titulo="Oportunidades de Eficiencia Operativa">
          <ul className="pbi-check-list">
            <li>
              <strong>Alineación con la Ley 2300 de 2023 ("Dejen de fregar"):</strong> Respetar canales y horarios
              evita sanciones y reduce el rechazo inicial evidenciado en el sentimiento negativo de entrada.
            </li>
            <li>
              <strong>Reducción de abandonos del 46,2%:</strong> Transferencias en menos de 90 segundos retienen a clientes
              que actualmente cierran el chat por falta de respuesta humana.
            </li>
            <li>
              <strong>Segmentación de cartera por motivo:</strong> Separar clientes con voluntad de pago pero sin liquidez
              inmediata de aquellos que desconocen la deuda o reclaman cobros indebidos.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
