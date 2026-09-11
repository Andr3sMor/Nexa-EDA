import React from "react";
import { Card, BarrasH, Tabla, Kpi, Aviso } from "./ui.jsx";
import d from "../datos/agregados.json";

export function EdaView() {
  const e = d.eda;
  const cr = d.cruces;
  const roles = Object.entries(e.roles).map(([clave, n]) => ({ clave, n }));

  const ANOMALIAS_ANONIMIZADOR = [
    {
      marcador: "PERSONA_00000008",
      sustitucion: "ANA",
      impacto: "326 casos de 'MAÑANA' alterados ('MAÑPERSONA_00000008'), 'SEMANA' (123), DIANA, JULIANA.",
      severidad: "Crítica (afecta expresiones de tiempo de pago)",
    },
    {
      marcador: "PERSONA_00000031",
      sustitucion: "CESAR",
      impacto: "147 casos de 'NECESARIO' convertidos a 'NEPERSONA_00000031IO'.",
      severidad: "Media (dificulta parsing léxico)",
    },
    {
      marcador: "PERSONA_00000108",
      sustitucion: "JULIO",
      impacto: "Mes de Julio ausente de literales en todo el corpus (Junio 583, Agosto 613, Julio 0).",
      severidad: "Alta (afecta fechas de compromiso)",
    },
  ];

  return (
    <div className="pbi-page-container">
      <div className="pbi-page-header">
        <div>
          <span className="pbi-section-pill">Entregable Obligatorio · Reto 3.c</span>
          <h2 className="pbi-page-title">Análisis Exploratorio de Datos (EDA)</h2>
          <p className="pbi-page-desc">
            Caracterización del corpus de WhatsApp de cobranza: {e.filas_crudas.toLocaleString("es")} filas crudas
            depuradas a <strong>{e.filas_dedup.toLocaleString("es")} mensajes</strong> en{" "}
            <strong>{e.conversaciones.toLocaleString("es")} conversaciones</strong>.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ margin: "20px 0" }}>
        <Kpi
          etiqueta="Mensajes Totales Depurados"
          valor={e.filas_dedup.toLocaleString("es")}
          subtitulo="42.607 filas crudas originales"
          estado="primario"
        />
        <Kpi
          etiqueta="Conversaciones Únicas"
          valor={e.conversaciones.toLocaleString("es")}
          subtitulo="Mínimo 20 mensajes por chat"
          estado="primario"
        />
        <Kpi
          etiqueta="Mensajes del Cliente (Usuario)"
          valor="44,3%"
          subtitulo="18.619 mensajes recibidos"
          estado="exito"
        />
        <Kpi
          etiqueta="Intervención Asesor Humano"
          valor="32,8%"
          subtitulo="13.770 mensajes de negociación"
          estado="normal"
        />
      </div>

      <div className="grid cols-2">
        <Card titulo="Distribución de Mensajes por Rol Emisor">
          <BarrasH datos={roles} campo="n" altura={180} etiquetaValor=" msjs" />
        </Card>

        <Card titulo="Hechos Estructurales que Condicionan el Análisis">
          <ul className="pbi-check-list">
            {e.hechos.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Hallazgo Crítico del Anonimizador */}
      <div style={{ marginTop: 20 }}>
        <Card
          titulo="Hallazgo Crítico: El Anonimizador Rompió Palabras del Corpus (71,5% de Llamadas Afectadas)"
          subtitulo="Reemplazó nombres propios por subcadena sin verificar límites de palabra, afectando expresiones clave"
          badge="856 conversaciones afectadas"
        >
          <Aviso tipo="peligro">
            El anonimizador sustituyó subcadenas como 'ANA' por 'PERSONA_00000008', deformando palabras como 'MAÑANA'
            en 'MAÑPERSONA_00000008'. Si el modelo no cuenta con un decodificador contextual, las fechas de compromiso
            de pago no se reconocen y los acuerdos se pierden. Se incorporó una regla de preprocesamiento en el prompt
            para mitigar este sesgo.
          </Aviso>

          <Tabla
            columnas={[
              { clave: "marcador", titulo: "Marcador Anonimizado" },
              { clave: "sustitucion", titulo: "Subcadena Real" },
              { clave: "impacto", titulo: "Evidencia e Impacto en el Negocio" },
              { clave: "severidad", titulo: "Severidad Técnica" },
            ]}
            filas={ANOMALIAS_ANONIMIZADOR}
          />
        </Card>
      </div>

      {/* Análisis Transversal de Sentimiento y Fricción */}
      <div className="grid cols-2" style={{ marginTop: 20 }}>
        <Card titulo="Evolución del Sentimiento del Cliente (Inicial → Final)">
          <Tabla
            columnas={[
              { clave: "clave", titulo: "Sentimiento" },
              { clave: "ini", titulo: "Al Iniciar (Conv)", num: true },
              { clave: "fin", titulo: "Al Finalizar (Conv)", num: true },
              {
                clave: "dif",
                titulo: "Variación Neta",
                num: true,
                render: (f) => {
                  const dif = f.fin - f.ini;
                  const color = dif > 0 ? (f.clave === "POSITIVO" ? "#059669" : "#dc2626") : "#64748b";
                  return <span style={{ color, fontWeight: 600 }}>{dif > 0 ? `+${dif}` : dif}</span>;
                },
              },
            ]}
            filas={cr.sentimiento_inicial.map((s) => ({
              clave: s.clave,
              ini: s.n,
              fin: cr.sentimiento_final.find((x) => x.clave === s.clave)?.n ?? 0,
            }))}
          />
        </Card>

        <Card titulo="Impacto de la Fricción del Bot en el Score">
          <Tabla
            columnas={[
              { clave: "k", titulo: "Segmento de Conversación" },
              { clave: "v", titulo: "Score Medio (0-100)", num: true },
            ]}
            filas={[
              { k: "Sin fricción de bot (interacción fluida)", v: cr.score_x_friccion_bot.sin_friccion },
              { k: "Con fricción de bot (bucles, demoras)", v: cr.score_x_friccion_bot.con_friccion },
              { k: "Con acuerdo de pago formalizado", v: cr.score_x_acuerdo.con_acuerdo },
              { k: "Sin acuerdo de pago", v: cr.score_x_acuerdo.sin_acuerdo },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
