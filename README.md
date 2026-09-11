# Voice of Customer — cobranza

Prueba técnica de Científico(a) de AI. El punto de partida son 1.197 conversaciones de
WhatsApp entre un banco colombiano y clientes en mora; el trabajo consiste en extraer
variables con un LLM para responder cinco preguntas de negocio, proponer un sistema RAG
que estandarice las respuestas de los asesores, visualizar los resultados y entregar
hallazgos y recomendaciones.

## Cómo está organizado

```
Prueba 2/                          enunciado original y base de datos (xlsx)
notebooks/00_EDA.ipynb             exploración de los datos, ya cerrada
notebooks/01_extraccion_llm.ipynb  extracción de variables con IA — metodología completa,
                                    diseño de prompts, cálculo de la satisfacción, resultados
notebooks/_runner_*.py             ver notebooks/README.md — corren la extracción del
                                    notebook en segundo plano cuando el volumen no lo permite
                                    a mano
esquema.py                         contrato Pydantic de las 22 variables que extrae el LLM
prompts.py                         diseño de los prompts y bitácora de las iteraciones —
                                    esto es un entregable, no un detalle de implementación
docs/BRIEFING_RAG.md               hallazgos y material reunido para diseñar la propuesta RAG
scripts/construir_agregados.py     convierte los CSV de outputs/ en el JSON que usa el tablero
web/                                tablero interactivo (Vite + React), ver web/README.md
outputs/                           CSV y cachés de la extracción — no se versiona, son
                                    resultado de correr los notebooks
```

## Para reproducirlo

Python 3.14 con `pydantic`, `openai`, `pandas`, `scikit-learn`, `python-dotenv` y
`nbformat`. Un `.env` en la raíz con la API key del proveedor que se vaya a usar
(la corrida final usó `OPENAI_API_KEY`). En consola de Windows conviene fijar
`PYTHONIOENCODING=utf-8` antes de correr nada.

`notebooks/01_extraccion_llm.ipynb` se puede correr de punta a punta: todo lo que no
toca la red se ejecuta sin más, y las celdas que sí llaman al LLM están comentadas a
propósito porque consumen cuota real. Los resultados de la corrida ya hecha están en
`outputs/`, así que no hace falta reprocesar nada para explorar los datos o revisar el
tablero.

## Dónde está cada reto del enunciado

| Reto | Peso | Estado |
|---|---|---|
| 3.a — Generar variables con IA y diseñar los prompts | 25 | Corpus completo procesado, 1.197/1.197 sin fallos. Ver "Los números" abajo. |
| 3.b — Propuesta RAG | 35 | El material y los hallazgos que la sostienen están reunidos en `docs/BRIEFING_RAG.md`; la propuesta en sí todavía no está redactada. Es el reto que más pesa y el que más falta. |
| 3.c — Visualizaciones | 25 | Tablero construido en `web/`, pendiente de revisión final y de que se autorice publicarlo. |
| 3.d — Hallazgos y recomendaciones | 15 | Los hallazgos ya están documentados (en el notebook, en el briefing y más abajo); falta consolidarlos en recomendaciones de negocio explícitas para la presentación. |

## Los números, para quien no vaya a leer todo el notebook

La extracción corrió dos veces. La primera, con `gpt-4.1-nano`, terminó sin errores
pero una auditoría encontró que el modelo casi no extraía el motivo de no pago —tres
de cada cuatro conversaciones quedaban sin motivo, aun cuando el cliente lo decía con
todas las letras— y que un hueco en la validación del acuerdo de pago dejaba pasar como
compromiso del cliente frases que en realidad decía el asesor. El segundo problema se
corrigió sin gastar una llamada más, con un validador que exige que la cita venga
literalmente de un mensaje del cliente. El primero exigía un modelo más capaz, así que
se repitió la corrida completa con `gpt-4o-mini`.

| | `gpt-4.1-nano` | `gpt-4o-mini` (corrida final) |
|---|---|---|
| Cobertura | 1.186/1.197 (99,1%) | **1.197/1.197 (100%), 0 fallos** |
| `motivo_no_pago` = NINGUNO | 94% | **63%** |
| `acuerdo_pago` confirmado por el cliente | 5,4% | 6,5% |

Con `gpt-4o-mini`, `motivo_no_pago` por fin tiene una distribución que se puede
discutir: ingresos insuficientes, desacuerdo con el monto, descuento de nómina no
aplicado, desempleo, entre otros. El acuerdo de pago, en cambio, sigue siendo un
fenómeno raro incluso corrigiendo el sesgo del modelo (6,5%), y eso implica algo
importante para la pregunta (c) —qué ofertas y argumentos logran más acuerdos—: con tan
pocos casos, ninguna diferencia entre tipos de oferta sobrevive a un intervalo de
confianza razonable. No es que falte pulir el análisis; es que el dato no alcanza para
sostener un ranking, y la sección de metodología del notebook explica por qué.

Nada de esto está todavía medido contra un criterio humano — el notebook tiene lista la
sección de anotación y los umbrales de kappa, pero anotar la muestra de 60 conversaciones
sigue pendiente.

## Limitaciones que valen para cualquier conclusión que se saque de aquí

1. El corpus solo incluye conversaciones con 20 mensajes o más; en una operación real la
   mayoría son más cortas, y nada de esto se extrapola a ellas.
2. Las tasas de conversión por tipo de oferta son observacionales, no causales: el
   asesor elige qué ofrecer según el caso, así que la oferta está confundida con la
   disposición previa del cliente. Separarlo exigiría un experimento.
3. Los pesos del score de satisfacción son una hipótesis fundamentada, no una
   calibración, y contra el NPS declarado por los clientes el juicio del LLM solo
   correlaciona mejor que el score híbrido — vale la pena reportar los dos números por
   separado.
4. No hay eje temporal: `anio` y `mes` son constantes en toda la base.
