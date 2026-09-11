# Notebooks

- **`00_EDA.ipynb`** — exploración de los datos crudos: limpieza, duplicados, la
  ausencia de timestamp, el hallazgo del anonimizador que rompe palabras. Ya
  está cerrado y aprobado; `01_extraccion_llm.ipynb` parte de sus mismas
  decisiones de limpieza.
- **`01_extraccion_llm.ipynb`** — la capa de extracción con IA. Tiene la
  metodología completa (por qué un contrato validable en vez de texto libre,
  cómo se calcula la satisfacción, cómo se valida contra anotación humana y
  contra el NPS declarado), el motor de extracción y los resultados de la
  corrida final.

## Los scripts `_runner_*.py`

Procesar 1.197 conversaciones contra un LLM de pago toma horas, así que esas
corridas no se lanzaron descomentando una celda a mano: se dispararon en
segundo plano con estos scripts. Cada uno ejecuta el *source* real de las
celdas del notebook (nada de lógica duplicada) y después llama a `procesar()`
sobre la lista de conversaciones que corresponda.

| Script | Qué hizo |
|---|---|
| `_runner_extraccion.py` | La corrida de producción sobre el corpus completo (1.197 conversaciones) → `outputs/cache_extraccion.jsonl`. Tiene un lockfile para no correr dos veces a la vez y sella cada registro con el modelo usado — una corrida anterior se corrompió por procesos solapados, y esto lo impide. |
| `_runner_reintento.py` | Reintenta solo las conversaciones que fallaron la validación en una corrida anterior, sin tocar las que ya salieron bien. |
| `_runner_test_4omini.py` / `_runner_test_gemini.py` | Pruebas dirigidas sobre una muestra chica (120 conversaciones) para decidir, antes de pagar la corrida completa, si valía la pena cambiar de modelo. Sus resultados quedaron en `outputs/pruebas_modelo/`. |

Si hace falta relanzar alguno: `cd notebooks` y correr el script con un
intérprete de Python explícito, no `python` a secas (en Windows, el alias de
la Microsoft Store puede terminar lanzando el proceso dos veces).
