"""
Módulo de Demostración del Copiloto RAG de Cobranza (Reto 3.b).
Estandariza respuestas para asesores basadas en el motivo de no pago detectado,
la normativa financiera colombiana (SFC, Ley 1581, Ley 2300) y el catálogo de políticas de alivio.

Uso:
  python scripts/rag_bot.py "Me quede sin trabajo el mes pasado y no tengo como pagar"
  python scripts/rag_bot.py --test
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# -----------------------------------------------------------------------------
# BASE DE CONOCIMIENTO NORMATIVA Y DE POLÍTICAS DE COBRANZA
# -----------------------------------------------------------------------------
BASE_CONOCIMIENTO = [
    {
        "id": "POL-DESEMPLEO-01",
        "motivo": "DESEMPLEO",
        "tramo_mora": "30-90",
        "titulo": "Periodo de Gracia y Congelamiento por Pérdida de Empleo",
        "politica": (
            "Para clientes con cesantía laboral demostrable: se autoriza periodo de gracia de 60 días "
            "sin causación de intereses moratorios. Posibilidad de refinanciación a 24 meses conservando "
            "tasa preferencial. El cliente debe comprometerse a presentar soporte de terminación contractual."
        ),
        "normativa": "Circular Externa 026 de la SFC sobre reestructuración preventiva de créditos.",
    },
    {
        "id": "POL-INGRESOS-02",
        "motivo": "INGRESOS_INSUFICIENTES",
        "tramo_mora": "TODOS",
        "titulo": "Readecuación de Cuota y Plan de Pagos Escalonado",
        "politica": (
            "Si la cuota supera el 40% de la capacidad de pago declarada: ofrecer reestructuración con "
            "ampliación de plazo hasta 36 meses para reducir el valor de la cuota mensual hasta en un 50%. "
            "Requisito: pago inicial del 10% del saldo vencido como señal de compromiso."
        ),
        "normativa": "Ley 1328 de 2009 (Régimen de Protección al Consumidor Financiero).",
    },
    {
        "id": "POL-PAGO-03",
        "motivo": "YA_PAGO_O_PAGO_NO_APLICADO",
        "tramo_mora": "TODOS",
        "titulo": "Protocolo de Recepción de Comprobante y Suspensión Preventiva",
        "politica": (
            "Cuando el cliente manifieste haber realizado el pago: el asesor debe suspender de inmediato "
            "la gestión de cobro y solicitar el número de aprobación o soporte digital. Se otorga un plazo "
            "de 48 horas hábiles para confirmación contable en el Core bancario sin afectar score crediticio."
        ),
        "normativa": "Ley 1581 de 2012 (Habeas Data Financiero) y Circular Básica Jurídica SFC.",
    },
    {
        "id": "POL-DESACUERDO-04",
        "motivo": "DESACUERDO_MONTO_O_COBRO",
        "tramo_mora": "TODOS",
        "titulo": "Aclaración Detallada de Saldo y Condonación de Gastos de Cobranza",
        "politica": (
            "Desglosar el saldo en: Capital, Intereses Corrientes, Intereses de Mora y Gastos de Cobranza. "
            "Si el cliente acepta pagar el capital e intereses dentro de los próximos 5 días hábiles, se "
            "autoriza condonación del 100% de los honorarios y gastos de cobranza prejudicial."
        ),
        "normativa": "Ley 2300 de 2023 sobre transparencia en honorarios y canales de cobranza.",
    },
    {
        "id": "POL-ENFERMEDAD-05",
        "motivo": "ENFERMEDAD_O_CALAMIDAD",
        "tramo_mora": "TODOS",
        "titulo": "Activación de Cobertura de Seguros y Alivio Humanitario",
        "politica": (
            "Indagar si la obligación cuenta con seguro de desempleo/incapacidad temporal asociado. "
            "De ser aplicable, iniciar trámite de siniestro ante la aseguradora aliada. De lo contrario, "
            "conceder prórroga de pago de 30 días sin reporte negativo a centrales de información."
        ),
        "normativa": "Estatuto Orgánico del Sistema Financiero (EOSF) y Ley 2157 de 2021.",
    },
    {
        "id": "POL-DEFAULT-06",
        "motivo": "GENERAL",
        "tramo_mora": "TODOS",
        "titulo": "Acuerdo de Pago Inmediato con Descuento en Intereses",
        "politica": (
            "Ofrecer descuento del 80% sobre intereses de mora si el cliente cancela la totalidad del saldo "
            "vencido antes de la fecha de corte más próxima, indicando fecha específica y canal de pago."
        ),
        "normativa": "Manual de Cobranza Interno y Política de Negociación Vigente.",
    },
]


def recuperar_politica(mensaje_cliente: str, motivo_detectado: str = None) -> dict:
    """Recupera la política más relevante según el motivo o palabras clave."""
    msg = mensaje_cliente.lower()

    if motivo_detectado:
        for p in BASE_CONOCIMIENTO:
            if p["motivo"].lower() == motivo_detectado.lower():
                return p

    # Heurística de recuperación si no viene motivo
    if any(k in msg for k in ["desempleo", "despedido", "sin trabajo", "echaron", "liquidaron"]):
        return BASE_CONOCIMIENTO[0]
    elif any(k in msg for k in ["ya pague", "ya pague", "pago aplicado", "consigne", "transferi"]):
        return BASE_CONOCIMIENTO[2]
    elif any(k in msg for k in ["cobro de mas", "intereses altos", "no estoy de acuerdo", "cobrando mal", "desacuerdo"]):
        return BASE_CONOCIMIENTO[3]
    elif any(k in msg for k in ["enfermo", "hospital", "calamidad", "accidente", "cirugia", "mama enferma"]):
        return BASE_CONOCIMIENTO[4]
    elif any(k in msg for k in ["no me alcanza", "no tengo plata", "bajos ingresos", "poco sueldo", "medio sueldo"]):
        return BASE_CONOCIMIENTO[1]

    return BASE_CONOCIMIENTO[5]  # Política por defecto


def generar_respuesta_rag(mensaje_cliente: str, tramo_mora: str = "30-60 dias", producto: str = "Tarjeta de Credito") -> dict:
    """
    Ejecuta el pipeline RAG:
    1. Recupera la política aplicable.
    2. Si hay API key de OpenAI, genera la sugerencia con el LLM.
    3. Si no, aplica el motor determinista de plantillas corporativas.
    """
    politica = recuperar_politica(mensaje_cliente)

    prompt_sistema = (
        "Eres un copiloto de IA de cobranza para un banco colombiano. Tu objetivo es sugerir al asesor "
        "humano una respuesta profesional, empática, clara y conforme a la normativa para responder al cliente de WhatsApp.\n"
        "Reglas obligatorias:\n"
        "1. Aplica estrictamente la política institucional recuperada.\n"
        "2. Cita explícitamente el soporte normativo o de política aplicable.\n"
        "3. Busca guiar al cliente a un acuerdo con FECHA ESPECÍFICA de compromiso.\n"
        "4. Tono respetuoso, sin agresión, conforme a la Ley 2300 de 2023.\n"
        "5. Devuelve un JSON con: {'motivo_identificado', 'politica_aplicada', 'respuesta_sugerida', 'condicion_acuerdo', 'normativa_soporte'}."
    )

    prompt_usuario = (
        f"Contexto del cliente:\n"
        f"- Producto: {producto}\n"
        f"- Tramo de Mora: {tramo_mora}\n"
        f"- Mensaje del cliente: \"{mensaje_cliente}\"\n\n"
        f"Política recuperada de la Base de Conocimiento:\n"
        f"[{politica['id']}] {politica['titulo']}\n"
        f"Detalle: {politica['politica']}\n"
        f"Normativa: {politica['normativa']}\n\n"
        f"Genera la sugerencia para el asesor:"
    )

    if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-tu"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt_sistema},
                    {"role": "user", "content": prompt_usuario},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            resultado = json.loads(resp.choices[0].message.content)
            resultado["fuente"] = f"gpt-4o-mini + {politica['id']}"
            return resultado
        except Exception as e:
            # Fallback en caso de error de red o cuota
            pass

    # Generación estructurada de respaldo (Offline / Zero-Token Fallback)
    return {
        "motivo_identificado": politica["motivo"],
        "politica_aplicada": f"[{politica['id']}] {politica['titulo']}",
        "respuesta_sugerida": (
            f"Entendemos plenamente su situación. De acuerdo con nuestra política de apoyo al cliente "
            f"({politica['normativa']}), le podemos habilitar la siguiente alternativa: {politica['politica']} "
            f"¿Le parece bien si formalizamos este compromiso con fecha para el próximo viernes?"
        ),
        "condicion_acuerdo": "Requiere definición de fecha exacta por parte del cliente",
        "normativa_soporte": politica["normativa"],
        "fuente": f"Motor RAG Local + {politica['id']}",
    }


def demo_casos():
    casos = [
        "Buenas tardes, me quede sin empleo hace 20 dias y por eso no he podido cancelar la cuota.",
        "Senores, yo ya pague esa cuota el lunes por PSE y me siguen cobrando, solucionenme eso ya.",
        "El monto que me cobran no es correcto, me estan cobrando 200 mil pesos de mas en intereses.",
        "Se me presentaron gastos medicos por una cirugia de mi hijo y me quede sin presupuesto este mes.",
    ]

    print("=" * 80)
    print("DEMOSTRACIÓN DEL COPILOTO RAG DE COBRANZA - BANCO (PROYECTO VOICE OF CUSTOMER)")
    print("=" * 80)

    for i, caso in enumerate(casos, 1):
        print(f"\n[CASO {i}] Mensaje entrante del cliente:")
        print(f"  \"{caso}\"")
        resultado = generar_respuesta_rag(caso)
        print("  -> Motivo Identificado:", resultado.get("motivo_identificado"))
        print("  -> Política Recuperada:", resultado.get("politica_aplicada"))
        print("  -> Normativa Soporte  :", resultado.get("normativa_soporte"))
        print("  -> Sugerencia Asesor  :\n    ", resultado.get("respuesta_sugerida"))
        print("-" * 80)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--test":
            demo_casos()
        else:
            mensaje = " ".join(sys.argv[1:])
            res = generar_respuesta_rag(mensaje)
            print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        demo_casos()
