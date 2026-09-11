import React from "react";
import { PbiVisual, PbiCard, PbiBarChart, PbiTable, PbiCallout, PALETA_PBI } from "./ui.jsx";
import d from "../datos/agregados.json";

export function EdaView() {
  const e = d.eda;
  const cr = d.cruces;
  const roles = Object.entries(e.roles).map(([clave, n]) => ({ clave, n }));

  const ANOMALIAS_ANONIMIZADOR = [
    {
      marcador: "PERSONA_00000008",
      sustitucion: "ANA",
      impacto: "326 casos de 'MAÑANA' alterados ('MAÑPERSONA_00000008'), 'SEMANA' (123), nombres propios.",
      severidad: "Alta (afecta expresiones de tiempo de pago)",
    },
    {
      marcador: "PERSONA_00000031",
      sustitucion: "CESAR",
      impacto: "147 casos de 'NECESARIO' convertidos a 'NEPERSONA_00000031IO'.",
      severidad: "Media",
    },
    {
      marcador: "PERSONA_00000108",
      sustitucion: "JULIO",
      impacto: "Mes de Julio ausente de literales en todo el corpus (Junio 583, Agosto 613, Julio 0).",
      severidad: "Alta (afecta fechas de compromiso)",
    },
  ];

  return (
    <div className="pbi-canvas-page">
      <div className="pbi-section-title-bar">
        <span className="pbi-section-tag">Análisis Exploratorio de Datos (EDA)</span>
        <h2 className="pbi-section-heading">Estructura del Corpus y Hechos Determinantes</h2>
      </div>

      <div className="pbi-cards-grid cols-4" style={{ marginBottom: 14 }}>
        <PbiCard
          titulo="Mensajes Depurados"
          valor={e.filas_dedup.toLocaleString("es")}
          subtitulo="42.607 filas crudas originales"
          indicadorColor={PALETA_PBI.azul1}
        />
        <PbiCard
          titulo="Conversaciones Únicas"
          valor={e.conversaciones.toLocaleString("es")}
          subtitulo="Mínimo 20 mensajes por chat"
          indicadorColor={PALETA_PBI.azul2}
        />
        <PbiCard
          titulo="Mensajes de Clientes"
          valor="44,3%"
          subtitulo="18.619 mensajes del rol [USUARIO]"
          indicadorColor={PALETA_PBI.verde}
        />
        <PbiCard
          titulo="Intervención Humana"
          valor="32,8%"
          subtitulo="13.770 mensajes del rol [AGENTE]"
          indicadorColor={PALETA_PBI.morado}
        />
      </div>

      <div className="pbi-visuals-grid cols-2">
        <PbiVisual titulo="Distribución de Mensajes por Rol Emisor">
          <PbiBarChart datos={roles} campo="n" sufijo=" msjs" color={PALETA_PBI.azul1} />
        </PbiVisual>

        <PbiVisual titulo="Hechos Estructurales que Condicionan el Análisis">
          <ul className="pbi-clean-list">
            {e.hechos.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </PbiVisual>
      </div>

      <div style={{ marginTop: 14 }}>
        <PbiVisual
          titulo="Hallazgo Crítico: Anonimización por Subcadena (71,5% de Conversaciones Afectadas)"
          subtitulo="El anonimizador sustituyó nombres propios sin exigir palabra completa, rompiendo términos de tiempo"
        >
          <PbiCallout tipo="alerta" titulo="Mitigación Aplicada en el Prompt y Validación">
            La sustitución de 'ANA' por 'PERSONA_00000008' transformó palabras como 'MAÑANA' en 'MAÑPERSONA_00000008'.
            Se diseñó una regla de normalización léxica en prompts.py para decodificar estos marcadores antes de
            clasificar la fecha de compromiso del cliente.
          </PbiCallout>

          <PbiTable
            columnas={[
              { clave: "marcador", titulo: "Marcador en el Texto" },
              { clave: "sustitucion", titulo: "Subcadena Real" },
              { clave: "impacto", titulo: "Impacto en las Variables de Negocio" },
              { clave: "severidad", titulo: "Severidad Técnica", ancho: "150px" },
            ]}
            filas={ANOMALIAS_ANONIMIZADOR}
            filasPorPagina={5}
          />
        </PbiVisual>
      </div>

      <div className="pbi-visuals-grid cols-2" style={{ marginTop: 14 }}>
        <PbiVisual titulo="Evolución del Sentimiento del Cliente (Inicial vs. Final)">
          <PbiTable
            columnas={[
              { clave: "clave", titulo: "Sentimiento" },
              { clave: "ini", titulo: "Inicial (Conv)", num: true },
              { clave: "fin", titulo: "Final (Conv)", num: true },
              {
                clave: "dif",
                titulo: "Variación",
                num: true,
                render: (f) => {
                  const dif = f.fin - f.ini;
                  return <span style={{ fontWeight: 600 }}>{dif > 0 ? `+${dif}` : dif}</span>;
                },
              },
            ]}
            filas={cr.sentimiento_inicial.map((s) => ({
              clave: s.clave,
              ini: s.n,
              fin: cr.sentimiento_final.find((x) => x.clave === s.clave)?.n ?? 0,
            }))}
            filasPorPagina={5}
          />
        </PbiVisual>

        <PbiVisual titulo="Impacto de la Fricción del Bot en el Score de Satisfacción">
          <PbiTable
            columnas={[
              { clave: "k", titulo: "Segmento de Conversación" },
              { clave: "v", titulo: "Score Medio (0-100)", num: true },
            ]}
            filas={[
              { k: "Sin fricción de bot (interacción fluida)", v: cr.score_x_friccion_bot.sin_friccion },
              { k: "Con fricción de bot (bucles de repetición)", v: cr.score_x_friccion_bot.con_friccion },
              { k: "Con acuerdo de pago formalizado", v: cr.score_x_acuerdo.con_acuerdo },
              { k: "Sin acuerdo de pago", v: cr.score_x_acuerdo.sin_acuerdo },
            ]}
            filasPorPagina={5}
          />
        </PbiVisual>
      </div>
    </div>
  );
}
