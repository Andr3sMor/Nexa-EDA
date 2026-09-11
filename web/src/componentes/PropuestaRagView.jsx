import React, { useState } from "react";
import { Card, Aviso, Pill } from "./ui.jsx";

export function PropuestaRagView() {
  const [faseActiva, setFaseActiva] = useState(1);

  const FASES = [
    {
      num: 1,
      titulo: "Construcción y Versionado de la Base de Conocimiento",
      desc: "Estructurar y versionar los manuales de cobranza, matrices de alternativas por tramo de mora, catálogo de tasas, políticas de condonación y normatividad vigente (Ley 1581 de protección de datos, Ley 2157 de borrón y cuenta nueva, circulares SFC).",
    },
    {
      num: 2,
      titulo: "Curaduría del Corpus de Referencia",
      desc: "Seleccionar y anotar a mano ~300 pares reales de 'motivo de no pago → respuesta de negociación exitosa' que concluyeron en acuerdo de pago verificado con fecha, para servir como ground truth y few-shot contextual.",
    },
    {
      num: 3,
      titulo: "Prototipo de Recuperación Híbrida & Filtrado de Metadatos",
      desc: "Implementar índice dual denso (embeddings de dominio financiero) + léxico (BM25) con reranking cross-encoder. Aplicar pre-filtrado obligatorio por producto financiero y tramo de mora del cliente antes del ranking semántico.",
    },
    {
      num: 4,
      titulo: "Generador con Citación Obligatoria & Guardarraíles",
      desc: "LLM con prompt estricto que obliga a citar la sección exacta de la política. Si el caso no encaja en las alternativas autorizadas, el sistema marca REQUIERE_ESCALAMIENTO_HUMANO. Validación contra Pydantic.",
    },
    {
      num: 5,
      titulo: "Piloto Asistido (Copiloto Human-in-the-Loop)",
      desc: "Despliegue del asistente en la consola del asesor de WhatsApp. El asesor humano revisa, aprueba o ajusta la propuesta antes de enviarla al cliente. Se registran las modificaciones para calibración continua.",
    },
    {
      num: 6,
      titulo: "Monitoreo en Producción & Métricas de Negocio",
      desc: "Supervisión continua de deriva de recuperación, fidelidad (faithfulness), tasa de adopción del asesor y efecto sobre la consecución de acuerdos de pago verificados.",
    },
  ];

  return (
    <div className="pbi-page-container">
      <div className="pbi-page-header">
        <div>
          <span className="pbi-section-pill">Reto Técnico 3.b · 35 Puntos de Evaluación</span>
          <h2 className="pbi-page-title">Propuesta de Solución RAG para Estandarización de Respuestas</h2>
          <p className="pbi-page-desc">
            Diseño metodológico, arquitectónico y evaluativo de un sistema de Generación Aumentada por Recuperación
            (RAG) para asistir a los asesores de cobranza con respuestas estandarizadas, trazables y conformes a política
            según el motivo de no pago detectado.
          </p>
        </div>
      </div>

      {/* Decisión de Diseño Arquitectónico */}
      <Aviso tipo="exito">
        <strong>Enfoque Seleccionado: Copiloto Asistido (Human-in-the-Loop):</strong> En lugar de un bot totalmente
        autónomo que responde al cliente final (alto riesgo legal de promesas no autorizadas o vulneración de
        habeas data), se plantea un <strong>copiloto en tiempo real para el asesor humano</strong>. El sistema sugiere
        la alternativa óptima con su sustento de política y el asesor valida y envía.
      </Aviso>

      {/* Justificación de RAG */}
      <div className="grid cols-3" style={{ margin: "20px 0" }}>
        <Card titulo="¿Por qué RAG en este contexto?" badge="39,8% Repetitivo">
          <p style={{ margin: 0, fontSize: 13.5 }}>
            El análisis del corpus reveló que el <strong>39,8% de los mensajes</strong> ya corresponden a plantillas
            estandarizadas (155 plantillas en ≥20 conv.), pero la gestión de objeciones por motivo de no pago está
            dispersa y carece de alineación con las políticas vigentes de condonación.
          </p>
        </Card>
        <Card titulo="Cero Alucinación de Tasas y Plazos" badge="Cumplimiento SFC">
          <p style={{ margin: 0, fontSize: 13.5 }}>
            En cobranza bancaria regulada por la Superintendencia Financiera de Colombia (SFC), inventar un plazo,
            descuento o tasa acarrea sanciones legales. RAG restringe la generación a fragmentos verificados de la
            política institucional.
          </p>
        </Card>
        <Card titulo="Catálogo de Políticas Dinámico" badge="Mantenimiento Cero Fine-Tuning">
          <p style={{ margin: 0, fontSize: 13.5 }}>
            Cuando el banco actualiza sus tramos de alivio financiero o campañas estacionales de descuento, basta con
            actualizar los documentos en la base de conocimiento vectorial sin necesidad de reentrenar modelos.
          </p>
        </Card>
      </div>

      {/* DIAGRAMA INTERACTIVO DE ARQUITECTURA */}
      <Card
        titulo="Arquitectura Técnica del Sistema RAG (Flujo de Datos y Componentes)"
        subtitulo="Integración end-to-end desde el mensaje de WhatsApp hasta la sugerencia al asesor"
      >
        <div className="pbi-rag-flow">
          <div className="pbi-rag-node">
            <div className="pbi-rag-node-icon">💬</div>
            <div className="pbi-rag-node-title">1. Mensaje Cliente</div>
            <div className="pbi-rag-node-desc">WhatsApp entrante en mora + historial de conversación</div>
          </div>

          <div className="pbi-rag-arrow">→</div>

          <div className="pbi-rag-node">
            <div className="pbi-rag-node-icon">🔍</div>
            <div className="pbi-rag-node-title">2. Extracción de Motivo</div>
            <div className="pbi-rag-node-desc">Clasificación con contrato Pydantic + tramo de mora</div>
          </div>

          <div className="pbi-rag-arrow">→</div>

          <div className="pbi-rag-node">
            <div className="pbi-rag-node-icon">📚</div>
            <div className="pbi-rag-node-title">3. Recuperación Híbrida</div>
            <div className="pbi-rag-node-desc">Filtro por producto + BM25 + Embeddings + Reranker</div>
          </div>

          <div className="pbi-rag-arrow">→</div>

          <div className="pbi-rag-node">
            <div className="pbi-rag-node-icon">⚡</div>
            <div className="pbi-rag-node-title">4. Generador con Cita</div>
            <div className="pbi-rag-node-desc">LLM genera propuesta citando cláusula de política</div>
          </div>

          <div className="pbi-rag-arrow">→</div>

          <div className="pbi-rag-node">
            <div className="pbi-rag-node-icon">🛡️</div>
            <div className="pbi-rag-node-title">5. Guardarraíles</div>
            <div className="pbi-rag-node-desc">Validación de límites de descuento y tono de voz</div>
          </div>

          <div className="pbi-rag-arrow">→</div>

          <div className="pbi-rag-node" style={{ borderColor: "#059669", background: "#f0fdf4" }}>
            <div className="pbi-rag-node-icon">👨‍💼</div>
            <div className="pbi-rag-node-title" style={{ color: "#059669" }}>6. Copiloto Asesor</div>
            <div className="pbi-rag-node-desc">Asesor revisa, personaliza y aprueba envío</div>
          </div>
        </div>
      </Card>

      {/* Fases Metodológicas */}
      <div className="grid cols-2" style={{ margin: "20px 0" }}>
        <Card titulo="Metodología de Implementación en 6 Fases">
          <div className="pbi-timeline">
            {FASES.map((f) => (
              <div
                key={f.num}
                className={`pbi-timeline-step ${faseActiva === f.num ? "paso-activo" : ""}`}
                onClick={() => setFaseActiva(f.num)}
              >
                <div className="pbi-step-num">{f.num}</div>
                <div className="pbi-step-body">
                  <div className="pbi-step-title">{f.titulo}</div>
                  <div className="pbi-step-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card titulo="Criterios y Métricas de Evaluación del Sistema RAG">
          <div className="pbi-eval-list">
            <div className="pbi-eval-item">
              <div className="pbi-eval-top">
                <span className="pbi-eval-name">Fidelidad y No Alucinación (Faithfulness)</span>
                <span className="pbi-eval-target">Meta: ≥ 98%</span>
              </div>
              <p className="pbi-eval-desc">
                Proporción de afirmaciones generadas respaldadas 100% por una cláusula del manual de cobranza.
              </p>
            </div>

            <div className="pbi-eval-item">
              <div className="pbi-eval-top">
                <span className="pbi-eval-name">Recall@k y Relevancia de Contexto</span>
                <span className="pbi-eval-target">Meta: ≥ 92%</span>
              </div>
              <p className="pbi-eval-desc">
                Capacidad del recuperador para traer la alternativa de pago exacta según el motivo y tramo de mora.
              </p>
            </div>

            <div className="pbi-eval-item">
              <div className="pbi-eval-top">
                <span className="pbi-eval-name">Conformidad Regulatoria (Zero-Breach)</span>
                <span className="pbi-eval-target">Meta: 100%</span>
              </div>
              <p className="pbi-eval-desc">
                0 propuestas con tasas por fuera de la tasa de usura o violatorias del régimen de cobranza respetuosa.
              </p>
            </div>

            <div className="pbi-eval-item">
              <div className="pbi-eval-top">
                <span className="pbi-eval-name">Tasa de Aceptación del Asesor (Usabilidad)</span>
                <span className="pbi-eval-target">Meta: ≥ 75%</span>
              </div>
              <p className="pbi-eval-desc">
                Porcentaje de respuestas sugeridas que el asesor utiliza directamente o con mínimas modificaciones (&lt;10 caracteres).
              </p>
            </div>

            <div className="pbi-eval-item">
              <div className="pbi-eval-top">
                <span className="pbi-eval-name">Impacto de Negocio (Acuerdos con Fecha)</span>
                <span className="pbi-eval-target">Meta: +25% vs Base</span>
              </div>
              <p className="pbi-eval-desc">
                Incremento medido mediante prueba A/B en la consecución de acuerdos de pago verificados.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Otras Metodologías Analíticas Propuestas */}
      <Card
        titulo="Otras Metodologías Analíticas Propuestas para Esta Problemática"
        subtitulo="Técnicas complementarias de NLP, Machine Learning y Diseño Experimental"
      >
        <div className="grid cols-3">
          <div className="pbi-mini-box">
            <h4>1. Modelo Predictivo de Propensión al Acuerdo</h4>
            <p>
              Entrenar un modelo de gradient boosting (LightGBM) que, tras los primeros 3 turnos del cliente, prediga la
              probabilidad de alcanzar un acuerdo vinculante según el motivo detectado y el sentimiento inicial,
              enrutando los casos de alta dificultad a asesores senior.
            </p>
          </div>
          <div className="pbi-mini-box">
            <h4>2. Detección Temprana de Fricción de Bot</h4>
            <p>
              Algoritmo de reglas heurísticas en tiempo real que corte el bucle automatizado cuando el cliente repita
              su intención más de 2 veces o exprese molestia, transfiriendo de inmediato con el resumen ya pre-cargado.
            </p>
          </div>
          <div className="pbi-mini-box">
            <h4>3. Experimentación A/B de Discursos de Negociación</h4>
            <p>
              Diseñar pruebas aleatorizadas controladas para evaluar la efectividad causal de ofrecer primero
              condonación de intereses vs. plan diferido, superando la limitación observacional del dataset actual.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
