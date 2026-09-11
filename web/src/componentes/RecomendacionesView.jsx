import React, { useState } from "react";
import { PbiVisual, PbiCard, PALETA_PBI } from "./ui.jsx";

export function RecomendacionesView() {
  const [iniciativaSeleccionada, setIniciativaSeleccionada] = useState(0);

  const INICIATIVAS = [
    {
      id: 0,
      titulo: "Rediseño Operativo del Bot Automatizado",
      prioridad: "Prioridad 1 (Corto Plazo)",
      color: PALETA_PBI.azul1,
      evidencia: "El 60,1% de las conversaciones presentan fricción de bot. En el 19,4% de los casos insatisfechos es la causa principal de queja. El score de satisfacción cae de 72,1 a 58,4 puntos cuando hay bucles.",
      accion: "Eliminar la re-solicitud redundante de datos personales si el cliente ya los digitó. Configurar regla de escalamiento inmediato a humano al segundo turno sin clasificación o si el cliente escribe palabras clave de atención humana.",
      kpiImpacto: "Disminución estimada del 40% en tiempo de ciclo de llamada y aumento de +12 puntos en el score de satisfacción.",
    },
    {
      id: 1,
      titulo: "Protocolo de Recepción de Soporte para Pagos Ya Realizados",
      prioridad: "Prioridad 2 (Medio Plazo)",
      color: PALETA_PBI.verde,
      evidencia: "84 clientes expresan desacuerdo con el monto cobrado y 15 indican haber pagado previamente. Los asesores suelen insistir en cobrar sin contrastar el desfase de aplicación contable.",
      accion: "Implementar módulo de carga digital de comprobantes en WhatsApp (PSE, corresponsal) con validación automática y congelamiento preventivo de gestiones de cobro durante 48 horas hábiles.",
      kpiImpacto: "Reducción de quejas formales ante la SFC y recuperación de la relación con clientes en mora técnica.",
    },
    {
      id: 2,
      titulo: "Flexibilización de Políticas para Ingresos Insuficientes",
      prioridad: "Prioridad 3 (Estratégico)",
      color: PALETA_PBI.naranja,
      evidencia: "El 44,7% de los motivos declarados corresponden a Ingresos Insuficientes (139) o Desempleo (57). La falta de flexibilidad en la oferta es el segundo factor crítico de fricción.",
      accion: "Habilitar planes de pago diferido con periodo de gracia de 30 a 60 días para deudores con cesantía laboral demostrada, superando la exigencia exclusiva de pago total inmediato.",
      kpiImpacto: "Incremento estimado del +20% en tasa de cumplimiento de compromisos a 90 días.",
    },
    {
      id: 3,
      titulo: "Monitoreo Automatizado de Satisfacción y Alertas",
      prioridad: "Prioridad 4 (Tecnológico)",
      color: PALETA_PBI.morado,
      evidencia: "El score híbrido validado contra el NPS declarado (+0,759 de Spearman) permite evaluar la calidad de cada conversación sin esperar a que el usuario complete una encuesta externa.",
      accion: "Procesar las transcripciones al finalizar cada llamada e incorporar reglas de alerta para supervisores cuando el score sea inferior a 40 puntos para recontacto prioritario.",
      kpiImpacto: "Mitigación temprana de deserción de clientes y auditoría de calidad al 100% de los agentes.",
    },
  ];

  const ini = INICIATIVAS[iniciativaSeleccionada];

  return (
    <div className="pbi-canvas-page">
      <div className="pbi-section-title-bar">
        <span className="pbi-section-tag">Reto Técnico 3.d · Recomendaciones de Negocio</span>
        <h2 className="pbi-section-heading">Plan Estratégico para la Operación de Cobranza</h2>
      </div>

      {/* Matriz de Iniciativas */}
      <PbiVisual
        titulo="Matriz de Iniciativas Estratégicas (Priorización de Cartera)"
        subtitulo="Seleccione una iniciativa para ver el diagnóstico, acción operativa y meta de impacto"
      >
        <div className="pbi-cards-grid cols-4">
          {INICIATIVAS.map((item) => {
            const activo = item.id === iniciativaSeleccionada;
            return (
              <div
                key={item.id}
                className={`pbi-ini-card ${activo ? "active" : ""}`}
                style={{ borderTopColor: item.color }}
                onClick={() => setIniciativaSeleccionada(item.id)}
              >
                <span className="ini-priority">{item.prioridad}</span>
                <h4 className="ini-title">{item.titulo}</h4>
                <p className="ini-desc">{item.accion.slice(0, 110)}...</p>
                <span className="ini-link">Consultar plan detallado</span>
              </div>
            );
          })}
        </div>
      </PbiVisual>

      {/* Detalle de la Iniciativa */}
      <div style={{ marginTop: 14 }}>
        <PbiVisual
          titulo={`Detalle Operativo: ${ini.titulo}`}
          subtitulo={ini.prioridad}
        >
          <div className="pbi-cards-grid cols-3">
            <div className="pbi-detail-box">
              <span className="box-label">1. Evidencia en los Datos del Corpus</span>
              <p className="box-content">{ini.evidencia}</p>
            </div>

            <div className="pbi-detail-box">
              <span className="box-label">2. Acción Operativa Recomendada</span>
              <p className="box-content">{ini.accion}</p>
            </div>

            <div className="pbi-detail-box">
              <span className="box-label">3. KPI de Impacto Proyectado</span>
              <p className="box-content" style={{ fontWeight: 600, color: PALETA_PBI.verde }}>
                {ini.kpiImpacto}
              </p>
            </div>
          </div>
        </PbiVisual>
      </div>

      <div className="pbi-visuals-grid cols-2" style={{ marginTop: 14 }}>
        <PbiVisual titulo="Principales Hallazgos de Cartera">
          <ul className="pbi-clean-list">
            <li>
              <strong>Tasa real de acuerdos del 6,5%:</strong> Exigir fecha explícita demuestra que la mayoría de
              conversaciones son consultas o promesas sin compromiso formal.
            </li>
            <li>
              <strong>Baja indagación del motivo de no pago (28,4%):</strong> Los asesores tienden a ofrecer
              descuentos sin indagar primero si la causa es desempleo o inconformidad de saldo.
            </li>
            <li>
              <strong>Fricción inicial con el bot:</strong> Presentar al bot como asesor humano genera desconfianza
              cuando el sistema entra en bucle de preguntas pregrabadas.
            </li>
          </ul>
        </PbiVisual>

        <PbiVisual titulo="Alineación Regulatoria y Buenas Prácticas">
          <ul className="pbi-clean-list">
            <li>
              <strong>Cumplimiento de la Ley 2300 de 2023:</strong> Garantizar la debida diligencia en canales y
              horarios autorizados para mitigar riesgos sancionatorios ante la SIC y SFC.
            </li>
            <li>
              <strong>Reducción de abandonos del 46,2%:</strong> Establecer un tiempo máximo de espera de 90 segundos
              en cola de WhatsApp para evitar pérdida de contacto con deudores receptivos.
            </li>
            <li>
              <strong>Clasificación temprana de cartera:</strong> Separar clientes con voluntad de pago pero sin liquidez
              inmediata de aquellos con discrepancias contables en el extracto.
            </li>
          </ul>
        </PbiVisual>
      </div>
    </div>
  );
}
