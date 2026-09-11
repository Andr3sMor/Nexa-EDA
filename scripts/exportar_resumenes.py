"""
Exporta un JSON compacto con las 1.197 conversaciones analizadas
para alimentar el buscador interactivo de resúmenes (Pregunta d)
y el visor de casos de satisfacción (Pregunta e) en el dashboard web.
"""

import json
from pathlib import Path
import pandas as pd

RUTA_CSV = Path(__file__).resolve().parent.parent / "outputs" / "conversaciones_ia.csv"
RUTA_SALIDA = Path(__file__).resolve().parent.parent / "web" / "src" / "datos" / "conversaciones_resumen.json"


def exportar():
    if not RUTA_CSV.exists():
        raise FileNotFoundError(f"No existe {RUTA_CSV}")

    df = pd.read_csv(RUTA_CSV)

    registros = []
    for _, fila in df.iterrows():
        factores = str(fila.get("factores_insatisfaccion", "") or "")
        if factores == "nan":
            factores = ""
        lista_factores = [f.strip() for f in factores.split("|") if f.strip() and f.strip() != "NINGUNO"]

        registros.append({
            "id": str(fila.get("uk_id_conversacion", "")),
            "resumen": str(fila.get("resumen", "") or ""),
            "motivo": str(fila.get("motivo_no_pago", "NINGUNO") or "NINGUNO"),
            "motivo_llm": str(fila.get("motivo_no_pago_llm", "NINGUNO") or "NINGUNO"),
            "acuerdo": bool(fila.get("acuerdo_pago", False)),
            "acuerdo_llm": bool(fila.get("acuerdo_pago_llm", False)),
            "tipo_fecha": str(fila.get("tipo_fecha", "SIN_FECHA") or "SIN_FECHA"),
            "score": round(float(fila.get("score_satisfaccion", 0.0) or 0.0), 1),
            "satisfaccion_llm": int(fila.get("satisfaccion_llm", 3) or 3),
            "factores": lista_factores,
            "recomendacion": str(fila.get("recomendacion_mejora", "") or "") if pd.notna(fila.get("recomendacion_mejora")) else "",
            "friccion_bot": bool(fila.get("hubo_friccion_bot", False)),
            "abandonada": bool(fila.get("conversacion_abandonada", False)),
            "mensajes": int(fila.get("n_mensajes", 0) or 0),
        })

    RUTA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(RUTA_SALIDA, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False)

    print(f"Exportadas {len(registros)} conversaciones a {RUTA_SALIDA} ({RUTA_SALIDA.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    exportar()
