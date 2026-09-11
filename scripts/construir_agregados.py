"""Construye web/src/datos/agregados.json a partir de los CSV de outputs/.

Este script es el unico puente entre la capa de extraccion (notebook 01) y el
dashboard web. NO llama al LLM: solo lee CSV ya generados y produce agregados.

Uso:
    PYTHONIOENCODING=utf-8 python scripts/construir_agregados.py

Entradas (outputs/, en .gitignore):
    conversaciones_ia.csv   1 fila por conversacion, 44 columnas
    ofertas_largo.csv       1 fila por oferta
    argumentos_largo.csv    1 fila por argumento
    factores_largo.csv      1 fila por factor de insatisfaccion

Salida (versionada, la consume el build de Vite):
    web/src/datos/agregados.json

Si cambian los CSV (reproceso de conversaciones fallidas, revision de
motivo_no_pago, autoconsistencia), se vuelve a correr este script y se commitea
el JSON. El GitHub Action solo construye y publica; no ejecuta esto.
"""
from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
OUT = RAIZ / "outputs"
DESTINO = RAIZ / "web" / "src" / "datos" / "agregados.json"

# Corpus total (EDA): 1.197 conversaciones tras deduplicar. La extraccion cubre
# las que superaron la validacion Pydantic; el resto se reporta como cobertura.
N_CORPUS = 1197
MODELO = "gpt-4o-mini"
PROVEEDOR = "OpenAI"

# --- Controles de calidad ---------------------------------------------------
# Hechos NO recalculables desde los CSV: auditoria de citas por rol y validacion
# externa contra el NPS declarado. Fuente: docs/BRIEFING_RAG.md secciones 5.5 y
# 5.6 (corrida original con gpt-4.1-nano) + reportes de la sesion que ejecuto el
# re-run final con gpt-4o-mini + validador v13. Se citan con su origen; no se inventan.
CONTROLES = {
    "fuente": "docs/BRIEFING_RAG.md secciones 5.1-5.6 (corrida nano 2026-09-10) "
    "+ re-run final con gpt-4o-mini + validador v13",
    "corrida": {
        "conversaciones": 1197,
        "validas": 1197,
        "fallidas": 0,
        "duracion_min": 204.4,
        "costo_usd_reportado": 2.72,
        "nota": "Corrida final con gpt-4o-mini + validador v13 (roles de cita para acuerdo_pago y "
        "motivo_no_pago): 1.197/1.197 conversaciones, 0 fallos. Reemplaza la corrida original con "
        "gpt-4.1-nano (1.134/1.197 validas, 63 fallos, 173,1 min, ~USD 2,2; ver "
        "docs/BRIEFING_RAG.md), que se mantiene documentada como parte de la bitacora de proveedores "
        "pero ya no describe los datos de este tablero.",
    },
    "auditoria_citas": [
        {
            "campo": "acuerdo_evidencia (debe citar al USUARIO)",
            "total": 308,
            "rol_correcto": 62,
            "rol_equivocado": 216,
            "no_localizable": 30,
            "detalle_equivocado": "214 citan al AGENTE, 2 al BOT",
        },
        {
            "campo": "evidencia_motivo (debe citar al USUARIO)",
            "total": 75,
            "rol_correcto": 57,
            "rol_equivocado": 8,
            "no_localizable": 10,
            "detalle_equivocado": "8 citan al AGENTE",
        },
        {
            "campo": "evidencia de oferta (debe citar al AGENTE)",
            "total": 1016,
            "rol_correcto": 786,
            "rol_equivocado": 39,
            "no_localizable": 156,
            "detalle_equivocado": "27 citan al USUARIO, 12 al BOT/HSM",
        },
    ],
    "sondeo_lexico_motivos": {
        "descripcion": "Sondeo propio por expresiones regulares sobre mensajes [USUARIO], "
        "comparado con lo que el modelo asigno en esas mismas conversaciones.",
        "filas": [
            {"clave": "YA_PAGO_O_PAGO_NO_APLICADO", "regex_marca": 79, "modelo_asigna": 0, "modelo_pone_ninguno": 77},
            {"clave": "DESCUENTO_NOMINA_NO_APLICADO", "regex_marca": 63, "modelo_asigna": 5, "modelo_pone_ninguno": 54},
            {"clave": "DESEMPLEO", "regex_marca": 42, "modelo_asigna": 3, "modelo_pone_ninguno": 32},
        ],
        "evidencia_sin_clasificar": 312,
        "nota": "312 conversaciones traen evidencia_motivo no nula y aun asi motivo_no_pago=NINGUNO: "
        "el modelo localiza y copia la frase del cliente y luego se abstiene de clasificarla.",
    },
    "acuerdo_verificado": {
        "llm_pct": 27.1,
        "llm_n": 321,
        "verificado_pct": 5.4,
        "verificado_n": 64,
        "reclasificadas_n": 257,
        "nota": "placeholder",  # se recalcula en main() con las cifras reales de la corrida actual
    },
    "validacion_nps": {
        "descripcion": "rho de Spearman del score contra el NPS 0-10 que el propio cliente declara "
        "al cierre. Recalculado sobre la corrida final con gpt-4o-mini (236 conversaciones con ambas "
        "medidas; la corrida con nano daba 217, con otros valores de rho, ver docs/BRIEFING_RAG.md).",
        "solo_llm": 0.766,
        "hibrido_70_30": 0.625,
        "solo_objetivo": 0.347,
        "media_score_detractores": 33.1,
        "media_score_pasivos": 69.9,
        "media_score_promotores": 88.3,
        "lectura": "Confirma, con mas margen que en la corrida con nano, que la hipotesis de diseno "
        "del 70/30 no se sostiene: mezclar el 30% de senales objetivas empeora la concordancia con la "
        "unica verdad de campo disponible (0,625 frente a 0,766 solo con el LLM); la brecha crece de "
        "5 a 14 puntos respecto a nano. Se conserva el hibrido documentado por su menor dispersion, "
        "pero para leer el score como proxy de satisfaccion real conviene el componente LLM solo.",
    },
    "fiabilidad_por_pregunta": [
        {"pregunta": "a", "titulo": "Motivos de no pago", "estado": "no_utilizable",
         "detalle": "93% NINGUNO, contradicho por el sondeo lexico sobre las mismas conversaciones."},
        {"pregunta": "b", "titulo": "Ofertas del asesor", "estado": "con_reservas",
         "detalle": "Auditoria de citas (77% en rol correcto) hecha sobre una corrida anterior con otro modelo, "
         "no repetida con la extraccion actual; probable sub-extraccion frente al conteo lexico del EDA."},
        {"pregunta": "c", "titulo": "Que argumentos convierten mas", "estado": "no_utilizable",
         "detalle": "No hay ranking medible: 64 acuerdos verificados repartidos en 8 tipos de oferta "
         "(1-19 cada uno); las diferencias de cabeza no sobreviven a ningun intervalo de confianza y "
         "el orden cambia respecto al ranking inflado. Ademas confusion asesor-elige-oferta y corpus truncado."},
        {"pregunta": "d", "titulo": "Resumen de cada llamada", "estado": "sin_auditar",
         "detalle": "1.134 resumenes generados; calidad no auditada sistematicamente."},
        {"pregunta": "e", "titulo": "Conversaciones peor calificadas", "estado": "utilizable",
         "detalle": "Distribucion sin compresion al centro; rho = 0,77 del componente LLM con el NPS declarado (recalculado con la extraccion actual, n=236)."},
    ],
}

# --- Taxonomias cerradas: fuente de verdad = esquema.py -----------------------
import sys

sys.path.insert(0, str(RAIZ))
import enum
import inspect

import esquema  # noqa: E402


def _taxonomias() -> dict:
    tax = {}
    for nombre, obj in inspect.getmembers(esquema):
        if inspect.isclass(obj) and issubclass(obj, enum.Enum) and obj is not enum.Enum:
            tax[nombre] = [m.value for m in obj]
    return tax


# --- Utilidades --------------------------------------------------------------
def _num(x):
    """float JSON-safe (nan/inf -> None)."""
    if x is None:
        return None
    try:
        f = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return round(f, 2)


def _conteo(serie, universo=None, total=None):
    """Lista [{clave, n, pct}] ordenada desc por n. pct sobre `total` o len(serie)."""
    vc = serie.value_counts(dropna=False)
    if universo is not None:
        for u in universo:
            if u not in vc.index:
                vc[u] = 0
    base = total if total is not None else int(vc.sum())
    filas = []
    for clave, n in vc.sort_values(ascending=False).items():
        clave = "NINGUNO" if (clave is None or (isinstance(clave, float) and math.isnan(clave))) else str(clave)
        filas.append({"clave": clave, "n": int(n), "pct": _num(100 * n / base) if base else 0.0})
    return filas


def _split_pipe(serie):
    """Explota una columna 'A|B|C' en filas individuales, ignora vacios."""
    out = []
    for v in serie.dropna():
        for parte in str(v).split("|"):
            parte = parte.strip()
            if parte and parte.upper() not in {"NINGUNO", "NINGUNA", "NAN"}:
                out.append(parte)
    return pd.Series(out, dtype="object")


def _tasa_acuerdo_por(largo: pd.DataFrame, col_tipo: str, conv: pd.DataFrame) -> list:
    """Para cada categoria: conversaciones distintas donde aparece y % con acuerdo.

    OBSERVACIONAL, no causal: el asesor elige que ofrecer/argumentar segun el caso.
    """
    acuerdo = conv.set_index("uk_id_conversacion")["acuerdo_pago"].to_dict()
    filas = []
    for tipo, grupo in largo.groupby(col_tipo):
        ids = grupo["uk_id_conversacion"].unique()
        n = len(ids)
        n_ac = sum(1 for i in ids if acuerdo.get(i) is True or acuerdo.get(i) == "True")
        filas.append(
            {
                "clave": str(tipo),
                "n_conversaciones": int(n),
                "n_acuerdo": int(n_ac),
                "tasa_acuerdo_pct": _num(100 * n_ac / n) if n else 0.0,
            }
        )
    return sorted(filas, key=lambda r: r["n_conversaciones"], reverse=True)


def _es_true(v) -> bool:
    return v is True or str(v).strip().lower() == "true"


def _texto(v, limite=600) -> str:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return ""
    s = str(v).strip()
    return s if len(s) <= limite else s[: limite - 1] + "…"


# --- Carga -----------------------------------------------------------------
def main() -> None:
    conv = pd.read_csv(OUT / "conversaciones_ia.csv", encoding="utf-8-sig")
    ofertas = pd.read_csv(OUT / "ofertas_largo.csv", encoding="utf-8-sig")
    argumentos = pd.read_csv(OUT / "argumentos_largo.csv", encoding="utf-8-sig")
    factores = pd.read_csv(OUT / "factores_largo.csv", encoding="utf-8-sig")

    for df in (conv, ofertas, argumentos, factores):
        df.columns = [c.lstrip("﻿") for c in df.columns]

    n = len(conv)
    tax = _taxonomias()

    # Normaliza columnas booleanas que pandas pudo leer como texto
    for c in [
        "acuerdo_pago",  # desde el validador de rol: solo True si la cita es de un mensaje [USUARIO]
        "acuerdo_pago_llm",  # lo que dijo el LLM sin verificar (trazabilidad)
        "acuerdo_reclasificado",  # True donde el LLM marco acuerdo y el validador de rol lo tumbo
        "cliente_reconoce_deuda",
        "asesor_pregunta_por_motivo",
        "hubo_friccion_bot",
        "conversacion_abandonada",
    ]:
        if c in conv.columns:
            conv[c] = conv[c].map(_es_true)

    # --- meta / KPIs -----------------------------------------------------
    n_acuerdo = int(conv["acuerdo_pago"].sum())  # verificado por rol de la cita
    n_acuerdo_llm = int(conv["acuerdo_pago_llm"].sum()) if "acuerdo_pago_llm" in conv else n_acuerdo
    n_reclasificadas = int(conv["acuerdo_reclasificado"].sum()) if "acuerdo_reclasificado" in conv else 0

    # Copia editable de los controles curados: el acuerdo verificado/LLM/reclasificado se
    # sincroniza con los CSV actuales en vez de quedar fijo en la corrida en que se escribio.
    controles = json.loads(json.dumps(CONTROLES))
    controles["acuerdo_verificado"]["llm_n"] = n_acuerdo_llm
    controles["acuerdo_verificado"]["llm_pct"] = _num(100 * n_acuerdo_llm / n) if n_acuerdo_llm else 0.0
    controles["acuerdo_verificado"]["verificado_n"] = n_acuerdo
    controles["acuerdo_verificado"]["verificado_pct"] = _num(100 * n_acuerdo / n)
    controles["acuerdo_verificado"]["reclasificadas_n"] = n_reclasificadas
    controles["acuerdo_verificado"]["nota"] = (
        "El campo acuerdo_pago que se usa en todo el tablero es el VERIFICADO: True solo si la cita "
        "de compromiso aparece textualmente en un mensaje [USUARIO]. Un validador de rol tumbo "
        f"{n_reclasificadas} de los {n_acuerdo_llm} acuerdos que el LLM habia marcado (en esos casos "
        "la fecha o el compromiso lo enuncia el asesor, contraejemplo 4 de REGLA_ACUERDO). "
        "acuerdo_pago_llm se conserva en el CSV solo para trazabilidad."
    )

    meta = {
        "generado": date.today().isoformat(),
        "proveedor": PROVEEDOR,
        "modelo": MODELO,
        "n_conversaciones_corpus": N_CORPUS,
        "n_conversaciones_analizadas": n,
        "cobertura_pct": _num(100 * n / N_CORPUS),
        "nota_cobertura": (
            f"{N_CORPUS - n} conversaciones ({_num(100 * (N_CORPUS - n) / N_CORPUS)}%) "
            "no superaron la validacion Pydantic tras 3 reintentos y quedan fuera de los agregados."
        ),
    }

    kpis = {
        "acuerdo_pago_pct": _num(100 * n_acuerdo / n),
        "acuerdo_pago_n": n_acuerdo,
        "acuerdo_pago_llm_pct": _num(100 * n_acuerdo_llm / n),
        "acuerdo_pago_llm_n": n_acuerdo_llm,
        "acuerdo_reclasificadas_n": n_reclasificadas,
        "score_satisfaccion_media": _num(conv["score_satisfaccion"].mean()),
        "score_satisfaccion_sd": _num(conv["score_satisfaccion"].std()),
        "satisfaccion_llm_media": _num(conv["satisfaccion_llm"].mean()),
        "abandono_pct": _num(100 * conv["conversacion_abandonada"].mean()),
        "friccion_bot_pct": _num(100 * conv["hubo_friccion_bot"].mean()),
        "reconoce_deuda_pct": _num(100 * conv["cliente_reconoce_deuda"].mean()),
        "asesor_pregunta_motivo_pct": _num(100 * conv["asesor_pregunta_por_motivo"].mean()),
    }

    # --- a) Motivos de no pago ----------------------------------------
    # motivo_no_pago = degradado por el validador de rol (NINGUNO si la evidencia
    # no aparece textual en un mensaje [USUARIO]). motivo_no_pago_llm = sin degradar.
    motivos = _conteo(conv["motivo_no_pago"], universo=tax["MotivoNoPago"], total=n)
    secundarios = _conteo(_split_pipe(conv["motivos_secundarios"]))
    ejemplos_motivo = []
    for mot in [m["clave"] for m in motivos if m["clave"] not in {"NINGUNO", "OTRO"}][:6]:
        sub = conv[(conv["motivo_no_pago"] == mot) & conv["evidencia_motivo"].notna()]
        for _, r in sub.head(2).iterrows():
            ev = _texto(r["evidencia_motivo"], 320)
            if ev:
                ejemplos_motivo.append({"motivo": mot, "evidencia": ev})
    pregunta_a = {
        "motivo_no_pago": motivos,
        "motivos_secundarios": secundarios,
        "ejemplos_evidencia": ejemplos_motivo,
        "reconoce_deuda_pct": kpis["reconoce_deuda_pct"],
        "asesor_pregunta_motivo_pct": kpis["asesor_pregunta_motivo_pct"],
    }
    if "motivo_no_pago_llm" in conv.columns:
        pregunta_a["motivo_no_pago_llm"] = _conteo(
            conv["motivo_no_pago_llm"], universo=tax["MotivoNoPago"], total=n
        )
    if "motivo_reclasificado" in conv.columns:
        pregunta_a["motivo_reclasificadas_n"] = int(conv["motivo_reclasificado"].map(_es_true).sum())

    _ninguno = next((m["pct"] for m in motivos if m["clave"] == "NINGUNO"), 0.0)
    pregunta_a["ninguno_pct"] = _ninguno
    # Umbral calibrado a mano (nexa-4d) sobre las corridas reales: nano dio 94,3% NINGUNO
    # (resultado debil), 4o-mini con v13 dio 63,3% (distribucion ya informativa). 80% separa
    # ambos casos con margen.
    UMBRAL_NINGUNO_DEBIL = 80
    _debil = _ninguno >= UMBRAL_NINGUNO_DEBIL
    pregunta_a["nivel"] = "debil" if _debil else "reservas"

    # La fila de fiabilidad de (a) se sincroniza con el % real de NINGUNO.
    for _row in controles["fiabilidad_por_pregunta"]:
        if _row["pregunta"] == "d":
            _row["detalle"] = f"{n} resumenes generados; calidad no auditada sistematicamente."
        if _row["pregunta"] == "a":
            if _debil:
                _row["estado"] = "no_utilizable"
                _row["detalle"] = (
                    f"{_ninguno}% NINGUNO, por encima de lo que sugiere el sondeo lexico sobre las mismas conversaciones."
                )
            else:
                _row["estado"] = "con_reservas"
                _row["detalle"] = (
                    f"NINGUNO en {_ninguno}% tras degradar por rol de la cita: distribucion "
                    "informativa, pero aun sin validacion humana (piloto + kappa pendiente)."
                )
    if _debil:
        pregunta_a["aviso"] = (
            f"El modelo asigna NINGUNO al {_ninguno}% de las conversaciones, por encima de lo que "
            "sugieren los datos. Un sondeo lexico sobre las mismas conversaciones encuentra motivos "
            "que el modelo no clasifica. Leer la distribucion como piso, no como reparto real."
        )
    else:
        pregunta_a["aviso"] = (
            f"NINGUNO en {_ninguno}% tras degradar por rol de la cita. La distribucion ya es "
            "informativa y no debe leerse como piso, pero sigue sin validacion humana (piloto + "
            "kappa pendiente) y las conversiones por motivo son observacionales."
        )

    # --- b) Ofertas de los asesores ---------------------------------
    of_tipos = _conteo(ofertas["tipo_oferta"])
    conv_con_oferta = ofertas["uk_id_conversacion"].nunique()
    dist_n_ofertas = _conteo(conv["n_ofertas"].astype("Int64").astype(str))
    pregunta_b = {
        "ofertas": [
            {**f, "pct_conversaciones": _num(100 * f["n"] / n)} for f in of_tipos
        ],
        "conversaciones_con_oferta": int(conv_con_oferta),
        "conversaciones_con_oferta_pct": _num(100 * conv_con_oferta / n),
        "ofertas_por_conversacion_media": _num(conv["n_ofertas"].mean()),
        "distribucion_n_ofertas": sorted(dist_n_ofertas, key=lambda r: int(r["clave"]) if r["clave"].isdigit() else 99),
    }

    # --- c) Argumentos que logran mas acuerdos ---------------------
    arg_tipos = _conteo(argumentos["tipo_argumento"])
    # Comparacion contra el sondeo lexico del EDA (500 menciones de centrales de riesgo
    # en mensajes de AGENTE): mide si el modelo actual sub-extrae frente a nano.
    centrales_extraidas = int(
        argumentos.loc[argumentos["tipo_argumento"] == "EVITAR_REPORTE_CENTRALES", "uk_id_conversacion"].nunique()
    )
    pregunta_b["centrales_extraidas_n"] = centrales_extraidas
    pregunta_b["eda_menciones_centrales"] = 500
    _oferta_x_acuerdo = _tasa_acuerdo_por(ofertas, "tipo_oferta", conv)
    _tipos_con_acuerdo = [r for r in _oferta_x_acuerdo if r["n_acuerdo"] > 0]
    _n_tipos_con_acuerdo = len(_tipos_con_acuerdo)
    _rango_acuerdo = (
        f"{min(r['n_acuerdo'] for r in _tipos_con_acuerdo)}-{max(r['n_acuerdo'] for r in _tipos_con_acuerdo)}"
        if _tipos_con_acuerdo
        else "0"
    )
    pregunta_c = {
        "argumentos": arg_tipos,
        "oferta_x_acuerdo": _oferta_x_acuerdo,
        "argumento_x_acuerdo": _tasa_acuerdo_por(argumentos, "tipo_argumento", conv),
        "linea_base_acuerdo_pct": kpis["acuerdo_pago_pct"],
        "acuerdos_base_n": n_acuerdo,
        "n_tipos_con_acuerdo": _n_tipos_con_acuerdo,
        "rango_acuerdo_por_tipo": _rango_acuerdo,
        "nota": (
            f"No medible de forma fiable: solo {n_acuerdo} acuerdos verificados repartidos en "
            f"{_n_tipos_con_acuerdo} tipos de oferta ({_rango_acuerdo} cada uno), el asesor elige que "
            "ofrecer segun el caso (confusion), y el corpus esta truncado. Las tasas se muestran solo "
            "para transparencia; no deben rankearse."
        ),
    }
    for _row in controles["fiabilidad_por_pregunta"]:
        if _row["pregunta"] == "c":
            _row["detalle"] = (
                f"No hay ranking medible: {n_acuerdo} acuerdos verificados repartidos en "
                f"{_n_tipos_con_acuerdo} tipos de oferta ({_rango_acuerdo} cada uno); las diferencias "
                "de cabeza no sobreviven a ningun intervalo de confianza. Ademas confusion "
                "asesor-elige-oferta y corpus truncado."
            )

    # --- d) Resumen de cada llamada -------------------------------
    muestra_d = []
    orden = conv.sort_values("score_satisfaccion")
    idx = list(range(0, n, max(1, n // 12)))[:12]
    for i in idx:
        r = orden.iloc[i]
        muestra_d.append(
            {
                "id": str(r["uk_id_conversacion"]),
                "resumen": _texto(r["resumen"], 500),
                "acuerdo_pago": bool(r["acuerdo_pago"]),
                "tipo_fecha": str(r["tipo_fecha"]),
                "score_satisfaccion": _num(r["score_satisfaccion"]),
                "n_mensajes": int(r["n_mensajes"]),
            }
        )
    pregunta_d = {"muestra_resumenes": muestra_d, "n_total": n}

    # --- e) Conversaciones peor calificadas ---------------------
    buckets = list(range(0, 101, 10))
    etiquetas = [f"{b}-{b + 10}" for b in buckets[:-1]]
    hist = pd.cut(conv["score_satisfaccion"], bins=buckets, labels=etiquetas, include_lowest=True)
    distribucion_score = [
        {"clave": et, "n": int((hist == et).sum())} for et in etiquetas
    ]
    factores_conteo = _conteo(_split_pipe(factores["factor"]))
    factores_conteo2 = _conteo(_split_pipe(conv["factores_insatisfaccion"]))
    peores = []
    for _, r in conv.nsmallest(15, "score_satisfaccion").iterrows():
        peores.append(
            {
                "id": str(r["uk_id_conversacion"]),
                "score_satisfaccion": _num(r["score_satisfaccion"]),
                "satisfaccion_llm": int(r["satisfaccion_llm"]),
                "factores": _texto(r["factores_insatisfaccion"], 200),
                "recomendacion_mejora": _texto(r["recomendacion_mejora"], 300),
                "resumen": _texto(r["resumen"], 320),
                "hubo_friccion_bot": bool(r["hubo_friccion_bot"]),
                "conversacion_abandonada": bool(r["conversacion_abandonada"]),
            }
        )
    pregunta_e = {
        "distribucion_score": distribucion_score,
        "factores": factores_conteo if factores_conteo else factores_conteo2,
        "peores": peores,
        "score_medio": kpis["score_satisfaccion_media"],
    }

    # --- Cruces analiticos -----------------------------------------
    def _tabla_acuerdo(col):
        out = []
        for val, g in conv.groupby(col):
            out.append(
                {
                    "clave": str(val),
                    "n": int(len(g)),
                    "n_acuerdo": int(g["acuerdo_pago"].sum()),
                    "tasa_acuerdo_pct": _num(100 * g["acuerdo_pago"].mean()),
                }
            )
        return sorted(out, key=lambda r: r["n"], reverse=True)

    cruces = {
        "acuerdo_x_tipo_fecha": _tabla_acuerdo("tipo_fecha"),
        "acuerdo_x_reconoce_deuda": _tabla_acuerdo("cliente_reconoce_deuda"),
        "acuerdo_x_friccion_bot": _tabla_acuerdo("hubo_friccion_bot"),
        "score_x_acuerdo": {
            "con_acuerdo": _num(conv.loc[conv["acuerdo_pago"], "score_satisfaccion"].mean()),
            "sin_acuerdo": _num(conv.loc[~conv["acuerdo_pago"], "score_satisfaccion"].mean()),
        },
        "score_x_friccion_bot": {
            "con_friccion": _num(conv.loc[conv["hubo_friccion_bot"], "score_satisfaccion"].mean()),
            "sin_friccion": _num(conv.loc[~conv["hubo_friccion_bot"], "score_satisfaccion"].mean()),
        },
        "sentimiento_inicial": _conteo(conv["sentimiento_inicial"], universo=tax["Sentimiento"], total=n),
        "sentimiento_final": _conteo(conv["sentimiento_final"], universo=tax["Sentimiento"], total=n),
        "componentes_score": {
            "componente_llm_medio": _num(conv["componente_llm"].mean()),
            "componente_objetivo_medio": _num(conv["componente_objetivo"].mean()),
            "penalizacion_media": _num(conv["penalizacion_total"].mean()),
        },
    }

    # --- EDA: hechos documentados (CLAUDE.md), no recalculados aqui ----
    eda = {
        "filas_crudas": 42607,
        "filas_dedup": 42005,
        "conversaciones": N_CORPUS,
        "roles": {"USUARIO": 18619, "AGENTE": 13770, "BOT": 8408, "HSM": 1208},
        "hechos": [
            "No hay timestamp: el orden lo da el consecutivo de uk_id_mensaje, monotono dentro de cada conversacion.",
            "anio y mes son constantes: no hay eje temporal ni tendencias.",
            "Corpus truncado por diseno: minimo 20 mensajes por conversacion; las interacciones cortas no estan representadas.",
            "El BOT se presenta como asesor humano; solo el rol AGENTE genera ofertas y argumentos.",
            "Texto en MAYUSCULAS por la exportacion, no es enfasis ni agresividad.",
            "El anonimizador reemplazo nombres por subcadena y rompio palabras en 1.625 mensajes de 856 conversaciones (71,5%); "
            "PERSONA_00000008=ANA, PERSONA_00000031=CESAR, PERSONA_00000108=JULIO decodificados con certeza.",
        ],
    }

    metodologia = {
        "extraccion": {
            "esquema": "22 campos Pydantic, 4 taxonomias cerradas ancladas en frecuencias reales del corpus, orden evidencia -> conclusion.",
            "prompt_fijo_tokens": 8149,
            "llamadas_por_conversacion": "hasta 3 (1 + 2 reintentos de validacion dirigidos)",
            "temperatura": 0,
            "formato": "json_object + validacion Pydantic + reintento que devuelve el error al modelo",
        },
        "acuerdo_pago": (
            "Definicion vinculante del enunciado: solo es acuerdo si el cliente manifiesta explicitamente "
            "su compromiso de pago indicando una fecha especifica. Codificada en el prompt, en validadores "
            "duros de esquema.py que rechazan la respuesta incoherente, y en el reintento dirigido."
        ),
        "score_satisfaccion": (
            "Hibrido 70% juicio del LLM (rubrica 1-5, sin compresion al centro) + 30% senales objetivas "
            "(bucle de bot, sin agente humano, cliente repite, conversacion larga sin acuerdo, cierre negativo). "
            "Los pesos son una hipotesis fundamentada, no una calibracion."
        ),
    }

    limitaciones = [
        "Corpus truncado (minimo 20 mensajes): no extrapolable a interacciones cortas, mayoria en una operacion real.",
        f"La tasa de acuerdo de pago es la verificada por rol de la cita ({kpis['acuerdo_pago_pct']}%, {n_acuerdo} conv.); "
        f"el LLM sobre-marca acuerdos ~5x ({kpis['acuerdo_pago_llm_pct']}%). Las tasas por oferta se calculan sobre esos {n_acuerdo}.",
        "Las tasas de conversion por oferta son observacionales, no causales: el asesor elige que ofrecer segun el caso.",
        "Los pesos del score hibrido son una hipotesis fundamentada, no una calibracion.",
        "Sin eje temporal: anio y mes son constantes.",
        f"Cobertura {meta['cobertura_pct']}%: {N_CORPUS - n} conversaciones sin extraccion valida.",
        "No existe medicion de la calidad de la extraccion contra anotacion humana (kappa pendiente).",
    ]

    datos = {
        "meta": meta,
        "kpis": kpis,
        "pregunta_a": pregunta_a,
        "pregunta_b": pregunta_b,
        "pregunta_c": pregunta_c,
        "pregunta_d": pregunta_d,
        "pregunta_e": pregunta_e,
        "cruces": cruces,
        "controles": controles,
        "taxonomias": tax,
        "eda": eda,
        "metodologia": metodologia,
        "limitaciones": limitaciones,
    }

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    DESTINO.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK -> {DESTINO.relative_to(RAIZ)}")
    print(f"   conversaciones analizadas: {n} / {N_CORPUS} ({meta['cobertura_pct']}%)")
    print(f"   acuerdo_pago: {n_acuerdo} ({kpis['acuerdo_pago_pct']}%)")
    print(f"   score medio: {kpis['score_satisfaccion_media']} (sd {kpis['score_satisfaccion_sd']})")
    print(f"   tamano JSON: {DESTINO.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
