"""
esquema.py - Contrato de salida de la capa de generacion de variables con IA.

Prueba tecnica Cientifico(a) de AI - Voice of Customer, operacion de cobranza.
Reto tecnico 3.a: "Genere variables a partir de AI para responder todas las preguntas."

Este modulo es el CONTRATO: define exactamente que debe devolver el LLM por cada
conversacion. Cumple tres funciones que no son intercambiables:

  1. Taxonomia cerrada. Todas las categorias son Enum, no texto libre. Sin esto
     el modelo inventa una etiqueta distinta por conversacion y las preguntas (a),
     (b) y (c) del enunciado -que son conteos y rankings- se vuelven imposibles
     de agregar.

  2. Validacion ejecutable de la regla de negocio. La definicion de acuerdo de
     pago del enunciado se hace cumplir en un validador de Pydantic, no solo en
     el prompt. Un prompt se puede ignorar; un ValidationError no. El notebook
     usa ese error para reintentar devolviendole al modelo su propia falla.

  3. Trazabilidad. Toda variable interpretativa viaja con su cita literal. Una
     categoria sin evidencia no es un dato, es una conjetura.

Las taxonomias no son inventadas: cada categoria se anclo en frecuencias reales
medidas sobre el corpus en el EDA (notebooks/00_EDA.ipynb). Ver
TRAZABILIDAD_TAXONOMIAS mas abajo.

Requiere: pydantic >= 2
"""

import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# TRAZABILIDAD DE LAS TAXONOMIAS
# Soporte empirico de cada familia de categorias, medido sobre
# outputs/mensajes_limpios.csv (42.005 mensajes, 1.197 conversaciones). Se
# documenta para que el evaluador pueda verificar que la taxonomia salio de los
# datos y no de una lluvia de ideas.

TRAZABILIDAD_TAXONOMIAS = {
    "motivo_no_pago": (
        "Sondeo por expresiones regulares sobre mensajes de rol USUARIO: "
        "ya pago / pago no aplicado 149, descuento de nomina o libranza 112, "
        "desempleo 88, desacuerdo con monto o cobro 83, ingreso variable o "
        "negocio 59, enfermedad o calamidad 58, liquidez insuficiente 24, "
        "siniestro de seguro 18."
    ),
    "tipo_oferta": (
        "Sondeo sobre mensajes de rol AGENTE: plan de pago o cuotas 719, "
        "normalizacion / ponerse al dia 646, canales de pago 376, "
        "pago minimo o abono 295, reestructuracion 241, descuento o "
        "condonacion 171."
    ),
    "argumento_persuasion": (
        "Sondeo sobre mensajes de rol AGENTE: mencion de centrales de riesgo o "
        "reporte 500. El resto se derivo del guion de cobranza observado en la "
        "lectura cualitativa de conversaciones del EDA."
    ),
    "factor_insatisfaccion": (
        "Derivado del EDA: 1 conversacion sin ningun mensaje del AGENTE, "
        "repeticion del mismo texto 3+ veces dentro de una conversacion "
        "(bucle de bot) y plantillas que cubren una fraccion alta del corpus."
    ),
}


# TAXONOMIAS CERRADAS

class MotivoNoPago(str, Enum):
    """Razon por la cual el cliente no ha pagado, segun lo que EL CLIENTE declara.

    Cerrada a proposito. La pregunta (a) del enunciado pide "los principales
    motivos de no pago", que es un ranking de frecuencias: exige categorias
    estables entre conversaciones.
    """

    YA_PAGO_O_PAGO_NO_APLICADO = "YA_PAGO_O_PAGO_NO_APLICADO"
    DESCUENTO_NOMINA_NO_APLICADO = "DESCUENTO_NOMINA_NO_APLICADO"
    DESEMPLEO = "DESEMPLEO"
    INGRESOS_INSUFICIENTES = "INGRESOS_INSUFICIENTES"
    SOBREENDEUDAMIENTO = "SOBREENDEUDAMIENTO"
    ENFERMEDAD_O_CALAMIDAD = "ENFERMEDAD_O_CALAMIDAD"
    NEGOCIO_O_INGRESO_VARIABLE = "NEGOCIO_O_INGRESO_VARIABLE"
    DESACUERDO_MONTO_O_COBRO = "DESACUERDO_MONTO_O_COBRO"
    SINIESTRO_SEGURO_EN_TRAMITE = "SINIESTRO_SEGURO_EN_TRAMITE"
    NO_RECONOCE_LA_OBLIGACION = "NO_RECONOCE_LA_OBLIGACION"
    OLVIDO_O_DESCONOCIMIENTO = "OLVIDO_O_DESCONOCIMIENTO"
    OTRO = "OTRO"
    NINGUNO = "NINGUNO"


class TipoOferta(str, Enum):
    """Alternativa concreta que el ASESOR pone sobre la mesa para lograr el pago.

    Responde la pregunta (b). Solo aplica al rol AGENTE: el BOT emite plantillas,
    no negocia (ver la regla de roles en prompts.py).
    """

    PLAN_PAGO_DIFERIDO = "PLAN_PAGO_DIFERIDO"
    REESTRUCTURACION_CREDITO = "REESTRUCTURACION_CREDITO"
    DESCUENTO_O_CONDONACION = "DESCUENTO_O_CONDONACION"
    PAGO_MINIMO_O_ABONO_PARCIAL = "PAGO_MINIMO_O_ABONO_PARCIAL"
    NORMALIZACION_AL_DIA = "NORMALIZACION_AL_DIA"
    PRORROGA_O_APLAZAMIENTO = "PRORROGA_O_APLAZAMIENTO"
    CANAL_PAGO_FACILITADO = "CANAL_PAGO_FACILITADO"
    ACTIVACION_SEGURO = "ACTIVACION_SEGURO"
    REVISION_O_AJUSTE_DE_SALDO = "REVISION_O_AJUSTE_DE_SALDO"
    OTRA = "OTRA"
    NINGUNA = "NINGUNA"


class ArgumentoPersuasion(str, Enum):
    """Palanca de persuasion con la que el ASESOR sustenta su oferta.

    Distinta de TipoOferta a proposito, y esa distincion es el corazon de la
    pregunta (c). La oferta es QUE se ofrece ("le difiero a 12 cuotas"); el
    argumento es POR QUE deberia aceptarlo ("asi evita el reporte en centrales").
    Mezclarlas haria imposible medir que palanca convierte mejor.
    """

    EVITAR_REPORTE_CENTRALES = "EVITAR_REPORTE_CENTRALES"
    PRESERVAR_HISTORIAL_CREDITICIO = "PRESERVAR_HISTORIAL_CREDITICIO"
    AHORRO_INTERESES_MORA = "AHORRO_INTERESES_MORA"
    BENEFICIO_TEMPORAL_URGENCIA = "BENEFICIO_TEMPORAL_URGENCIA"
    EVITAR_ESCALAMIENTO_JURIDICO = "EVITAR_ESCALAMIENTO_JURIDICO"
    RECUPERAR_CUPO_O_ACCESO_CREDITO = "RECUPERAR_CUPO_O_ACCESO_CREDITO"
    FACILIDAD_Y_RAPIDEZ_DEL_TRAMITE = "FACILIDAD_Y_RAPIDEZ_DEL_TRAMITE"
    APELACION_EMPATICA = "APELACION_EMPATICA"
    OTRO = "OTRO"
    NINGUNO = "NINGUNO"


class FactorInsatisfaccion(str, Enum):
    """Elemento observable que deterioro la experiencia del cliente.

    Responde la segunda mitad de la pregunta (e): "identificar los factores que
    impactaron negativamente la experiencia del cliente".
    """

    BUCLE_BOT = "BUCLE_BOT"
    SIN_RESPUESTA_HUMANA = "SIN_RESPUESTA_HUMANA"
    SOLICITUD_REPETIDA_DE_DATOS = "SOLICITUD_REPETIDA_DE_DATOS"
    INFORMACION_CONTRADICTORIA = "INFORMACION_CONTRADICTORIA"
    NO_RESOLVIO_SOLICITUD = "NO_RESOLVIO_SOLICITUD"
    FALTA_DE_FLEXIBILIDAD_EN_LA_OFERTA = "FALTA_DE_FLEXIBILIDAD_EN_LA_OFERTA"
    DEMORA_EXCESIVA = "DEMORA_EXCESIVA"
    PRESION_EXCESIVA = "PRESION_EXCESIVA"
    TRATO_INADECUADO = "TRATO_INADECUADO"
    PROBLEMA_TECNICO_CANAL = "PROBLEMA_TECNICO_CANAL"
    OTRO = "OTRO"
    NINGUNO = "NINGUNO"


class TipoFecha(str, Enum):
    """Precision de la fecha de pago comprometida por el cliente.

    Es la variable que discrimina acuerdo de no-acuerdo, porque el enunciado
    condiciona el acuerdo a que el cliente indique "una fecha especifica".
    """

    FECHA_ESPECIFICA = "FECHA_ESPECIFICA"
    FECHA_VAGA = "FECHA_VAGA"
    SIN_FECHA = "SIN_FECHA"


class Sentimiento(str, Enum):
    """Tono del CLIENTE. Escala ordinal de 5 puntos, simetrica alrededor de NEUTRO."""

    MUY_NEGATIVO = "MUY_NEGATIVO"
    NEGATIVO = "NEGATIVO"
    NEUTRO = "NEUTRO"
    POSITIVO = "POSITIVO"
    MUY_POSITIVO = "MUY_POSITIVO"


# Categorias "vacias": marcan ausencia y por eso no pueden convivir con otras
# dentro de la misma lista.
_VACIAS = {
    MotivoNoPago.NINGUNO,
    TipoOferta.NINGUNA,
    ArgumentoPersuasion.NINGUNO,
    FactorInsatisfaccion.NINGUNO,
}


# SUB-MODELOS: categoria + evidencia
# ------------------------------------------------------------
# Se emparejan categoria y cita en un mismo objeto en lugar de usar dos listas
# paralelas. Dos listas paralelas se desalinean en cuanto el modelo devuelve
# distinto numero de elementos en cada una, y la desalineacion es silenciosa:
# produce tablas largas donde la evidencia corresponde a otra categoria.

class OfertaDetectada(BaseModel):
    """Una oferta del asesor con la cita literal que la respalda."""

    model_config = ConfigDict(extra="forbid")

    tipo: TipoOferta = Field(
        description="Categoria de la oferta, tomada de la taxonomia cerrada."
    )
    evidencia: str = Field(
        min_length=3,
        max_length=400,
        description=(
            "Cita LITERAL del mensaje del AGENTE donde se hace la oferta, "
            "copiada tal cual aparece en la transcripcion. Prohibido parafrasear."
        ),
    )


class ArgumentoDetectado(BaseModel):
    """Un argumento de persuasion del asesor con su cita literal."""

    model_config = ConfigDict(extra="forbid")

    tipo: ArgumentoPersuasion = Field(
        description="Categoria del argumento, tomada de la taxonomia cerrada."
    )
    evidencia: str = Field(
        min_length=3,
        max_length=400,
        description=(
            "Cita LITERAL del mensaje del AGENTE donde se usa el argumento. "
            "Prohibido parafrasear."
        ),
    )


# MODELO PRINCIPAL
class ConversacionIA(BaseModel):
    """Variables generadas por IA para una conversacion de cobranza.

    Una instancia = una fila de outputs/conversaciones_ia.csv.

    El identificador de conversacion NO forma parte de este modelo a proposito:
    el LLM nunca deberia devolverlo. Lo adjunta el notebook desde la llave de
    control, lo que elimina de raiz el riesgo de que el modelo altere o alucine
    un uk_id_conversacion y desalinee toda la tabla.
    """

    model_config = ConfigDict(extra="forbid")

    # ---- Razonamiento previo (se escribe ANTES de decidir) -------------
    # Va primero a proposito. Obliga al modelo a fijar la evidencia observable
    # -roles presentes, frases del cliente, analisis de la fecha- antes de
    # comprometerse con una categoria. Es chain-of-thought dentro del JSON, no
    # una variable de negocio: el notebook puede descartarlo del CSV final.
    analisis_previo: str = Field(
        min_length=20,
        # 1500 y no 600: es CoT descartable, no una variable de negocio, y el cap
        # de 600 era la causa dominante de fallos de validacion en la corrida del
        # corpus completo (2026-09-10). Subirlo no afecta a ningun CSV de salida.
        max_length=1500,
        description=(
            "Analisis de trabajo en 2 a 4 frases, escrito ANTES que el resto de "
            "campos. Anota: que roles aparecen y si hay algun [AGENTE]; las "
            "frases textuales del [USUARIO] que fijan motivo, compromiso y "
            "fecha; y si la fecha es un dia concreto o una referencia vaga. No "
            "es un resumen para negocio, es tu razonamiento para no adivinar."
        ),
    )

    # ---- (d) Resumen de la conversacion -------------------------------
    resumen: str = Field(
        min_length=40,
        max_length=700,
        description=(
            "Resumen factual de 2 a 4 frases: quien contacta, que pide o plantea "
            "el cliente, que ofrece el asesor y como termina la conversacion. "
            "Sin juicios de valor y sin datos que no esten en la transcripcion."
        ),
    )

    # ---- (a) Motivo de no pago (primero la cita, luego la categoria) --
    evidencia_motivo: Optional[str] = Field(
        default=None,
        max_length=400,
        description=(
            "PRIMERO: localiza y copia la cita LITERAL del mensaje del USUARIO "
            "que probaria un motivo de no pago. Si no existe esa frase, deja "
            "null; entonces motivo_no_pago sera NINGUNO."
        ),
    )
    motivo_no_pago: MotivoNoPago = Field(
        description=(
            "Motivo PRINCIPAL de no pago que se desprende de evidencia_motivo. "
            "NINGUNO si evidencia_motivo quedo en null."
        )
    )
    motivos_secundarios: list[MotivoNoPago] = Field(
        default_factory=list,
        max_length=3,
        description=(
            "Otros motivos de no pago mencionados por el cliente, sin repetir el "
            "principal. Lista vacia si no hay."
        ),
    )
    cliente_reconoce_deuda: Optional[bool] = Field(
        default=None,
        description=(
            "true si el cliente admite deber; false si la desconoce o disputa; "
            "null si nunca se pronuncia al respecto."
        ),
    )
    asesor_pregunta_por_motivo: bool = Field(
        description=(
            "true si el AGENTE pregunta explicitamente por que no ha pagado o "
            "indaga por la situacion del cliente. Mide calidad de diagnostico de "
            "la gestion, no del cliente."
        )
    )

    # ---- (b) y (c) Ofertas y argumentos del asesor ----------------------
    ofertas_asesor: list[OfertaDetectada] = Field(
        default_factory=list,
        max_length=6,
        description=(
            "Ofertas realizadas por el rol AGENTE, cada una con su cita literal. "
            "NO incluir plantillas del BOT ni mensajes HSM."
        ),
    )
    argumentos_asesor: list[ArgumentoDetectado] = Field(
        default_factory=list,
        max_length=5,
        description=(
            "Argumentos de persuasion usados por el rol AGENTE, cada uno con su "
            "cita literal. NO incluir plantillas del BOT ni mensajes HSM."
        ),
    )

    # ---- Acuerdo de pago (primero fecha y cita, luego el booleano) --
    fecha_compromiso_texto: Optional[str] = Field(
        default=None,
        max_length=120,
        description=(
            "PRIMERO: fecha comprometida TAL COMO la escribio el cliente, sin "
            "normalizar ni convertir a formato de fecha. null si no menciona "
            "ninguna."
        ),
    )
    tipo_fecha: TipoFecha = Field(
        description=(
            "FECHA_ESPECIFICA: dia concreto identificable. FECHA_VAGA: referencia "
            "temporal sin dia ('la proxima semana', 'apenas me paguen'). "
            "SIN_FECHA: el cliente no menciona momento alguno."
        )
    )
    monto_comprometido_texto: Optional[str] = Field(
        default=None,
        max_length=120,
        description=(
            "Monto que el cliente se compromete a pagar, tal como aparece en el "
            "texto. null si no lo menciona."
        ),
    )
    acuerdo_evidencia: Optional[str] = Field(
        default=None,
        max_length=400,
        description=(
            "PRIMERO: cita LITERAL del mensaje del USUARIO donde se compromete a "
            "pagar. Si no puedes copiarla, deja null; entonces acuerdo_pago sera "
            "false."
        ),
    )
    acuerdo_pago: bool = Field(
        description=(
            "DESPUES de fecha_compromiso_texto, tipo_fecha y acuerdo_evidencia: "
            "true UNICAMENTE si tipo_fecha es FECHA_ESPECIFICA y acuerdo_evidencia "
            "no es null, es decir, si el CLIENTE manifiesta explicitamente su "
            "compromiso de pago con una fecha especifica. Ver prompts.REGLA_ACUERDO."
        )
    )

    # ---- (e) Satisfaccion (primero justificacion y factores, luego la nota) --
    justificacion_satisfaccion: str = Field(
        min_length=15,
        max_length=400,
        description=(
            "ANTES de asignar satisfaccion_llm: razona que nivel de la rubrica "
            "de prompts.RUBRICA_SATISFACCION corresponde y por que no el nivel "
            "contiguo, apoyado en hechos observables de la transcripcion."
        ),
    )
    factores_insatisfaccion: list[FactorInsatisfaccion] = Field(
        default_factory=list,
        max_length=4,
        description=(
            "Factores que deterioraron la experiencia, ordenados del mas al menos "
            "determinante. [NINGUNO] o lista vacia si la experiencia fue "
            "satisfactoria."
        ),
    )
    satisfaccion_llm: int = Field(
        ge=1,
        le=5,
        description=(
            "DESPUES: calificacion de la EXPERIENCIA DEL CLIENTE, coherente con "
            "justificacion_satisfaccion y factores_insatisfaccion. No se califica "
            "el resultado comercial: una conversacion sin acuerdo puede ser 4 o 5."
        ),
    )
    sentimiento_inicial: Sentimiento = Field(
        description="Tono del CLIENTE en sus primeros mensajes."
    )
    sentimiento_final: Sentimiento = Field(
        description="Tono del CLIENTE en sus ultimos mensajes."
    )
    hubo_friccion_bot: bool = Field(
        description=(
            "true si el BOT repitio plantillas, no entendio al cliente o demoro "
            "el paso a un asesor humano."
        )
    )
    conversacion_abandonada: bool = Field(
        description=(
            "true si la conversacion termina sin cierre: el cliente deja de "
            "responder, o queda una pregunta del cliente sin contestar."
        )
    )
    recomendacion_mejora: str = Field(
        min_length=15,
        max_length=400,
        description=(
            "Una accion concreta y ejecutable por la operacion de cobranza que "
            "habria mejorado esta conversacion. Especifica, no generica."
        ),
    )

    # ------------------------------------------------------------------
    # Normalizaciones deterministas
    # ------------------------------------------------------------------
    # Estas correcciones NO lanzan error: son mecanicas, sin ambiguedad, y
    # gastar una llamada extra a la API para que el modelo las arregle seria
    # desperdiciar cuota.

    @field_validator(
        "evidencia_motivo",
        "fecha_compromiso_texto",
        "monto_comprometido_texto",
        "acuerdo_evidencia",
        mode="before",
    )
    @classmethod
    def _vacio_a_none(cls, v):
        """Homologa "", "   ", "null", "N/A" y "NINGUNO" a None.

        Los LLM alternan entre null y cadena vacia para el mismo concepto. Sin
        esto, df.evidencia_motivo.isna() daria conteos falsos.
        """
        if v is None:
            return None
        if isinstance(v, str):
            limpio = v.strip()
            if limpio.lower() in {
                "", "null", "none", "n/a", "na", "ninguno", "ninguna", "-",
            }:
                return None
            return limpio
        return v

    @field_validator("motivos_secundarios", "factores_insatisfaccion")
    @classmethod
    def _limpiar_lista_enums(cls, v: list) -> list:
        """Quita duplicados conservando el orden y elimina la categoria vacia
        cuando viene acompanada de categorias reales."""
        vistos, salida = set(), []
        for item in v:
            if item not in vistos:
                vistos.add(item)
                salida.append(item)
        if len(salida) > 1:
            salida = [x for x in salida if x not in _VACIAS]
        return salida

    @field_validator("ofertas_asesor", "argumentos_asesor")
    @classmethod
    def _limpiar_lista_detecciones(cls, v: list) -> list:
        """Deduplica por (tipo, evidencia) y descarta la entrada NINGUNA/NINGUNO
        cuando ya hay detecciones reales."""
        vistos, salida = set(), []
        for item in v:
            clave = (item.tipo, item.evidencia.strip().lower())
            if clave not in vistos:
                vistos.add(clave)
                salida.append(item)
        if len(salida) > 1:
            reales = [x for x in salida if x.tipo not in _VACIAS]
            if reales:
                salida = reales
        return salida

    # ------------------------------------------------------------------
    # Reglas de negocio que SI deben fallar
    # ------------------------------------------------------------------
    # Aqui no se corrige: se lanza ValidationError. El notebook captura el
    # mensaje y se lo devuelve al modelo como turno de usuario para que
    # reintente. Se prefiere una llamada extra sobre un dato incoherente,
    # porque estas reglas son las que sostienen las conclusiones del analisis.
    # Por eso los mensajes de error estan redactados como instruccion dirigida
    # al modelo, no como diagnostico para un humano.

    @model_validator(mode="after")
    def _regla_acuerdo_de_pago(self) -> "ConversacionIA":
        """La definicion de acuerdo del enunciado, hecha codigo.

        "se considerara como acuerdo de pago aquellos casos en los que el cliente
        manifieste explicitamente su compromiso de pago indicando una fecha
        especifica."

        Es la variable de la que dependen las preguntas (b) y (c) completas: si
        el denominador de acuerdos esta inflado, todo el ranking de efectividad
        de ofertas y argumentos queda mal.
        """
        if self.acuerdo_pago:
            if self.tipo_fecha != TipoFecha.FECHA_ESPECIFICA:
                raise ValueError(
                    "acuerdo_pago=true exige tipo_fecha=FECHA_ESPECIFICA, pero se "
                    f"recibio '{self.tipo_fecha.value}'. Segun el enunciado solo hay "
                    "acuerdo si el cliente indica una fecha especifica. Si el cliente "
                    "solo dijo algo como 'cuando pueda' o 'la proxima semana', "
                    "corrija acuerdo_pago a false."
                )
            if not self.acuerdo_evidencia:
                raise ValueError(
                    "acuerdo_pago=true exige acuerdo_evidencia con la cita literal "
                    "del mensaje del USUARIO donde se compromete. Si no puede citar "
                    "esa frase textualmente, no hay acuerdo: corrija a false."
                )
            if not self.fecha_compromiso_texto:
                raise ValueError(
                    "acuerdo_pago=true exige fecha_compromiso_texto con la fecha tal "
                    "como la escribio el cliente."
                )
        return self

    @model_validator(mode="after")
    def _regla_evidencia_del_motivo(self) -> "ConversacionIA":
        """Un motivo sin cita es una atribucion del modelo, no un dato del cliente."""
        if self.motivo_no_pago != MotivoNoPago.NINGUNO and not self.evidencia_motivo:
            raise ValueError(
                f"motivo_no_pago='{self.motivo_no_pago.value}' exige evidencia_motivo "
                "con la cita literal del mensaje del USUARIO. Si ningun mensaje del "
                "cliente sustenta ese motivo, use motivo_no_pago='NINGUNO'."
            )
        return self

    @model_validator(mode="after")
    def _regla_coherencia_satisfaccion(self) -> "ConversacionIA":
        """Una calificacion baja obliga a nombrar el factor que la causo.

        Sin esta regla la pregunta (e) se queda sin respuesta: se tendrian
        conversaciones mal calificadas sin poder decir por que.
        """
        reales = [
            f for f in self.factores_insatisfaccion
            if f != FactorInsatisfaccion.NINGUNO
        ]
        if self.satisfaccion_llm <= 2 and not reales:
            raise ValueError(
                f"satisfaccion_llm={self.satisfaccion_llm} exige al menos un factor "
                "en factores_insatisfaccion distinto de NINGUNO. Si no identifica "
                "ningun factor concreto, la calificacion no puede ser 1 ni 2."
            )
        if self.satisfaccion_llm >= 4 and len(reales) >= 3:
            raise ValueError(
                f"satisfaccion_llm={self.satisfaccion_llm} es incoherente con "
                f"{len(reales)} factores de insatisfaccion. Reduzca la calificacion "
                "o deje solo los factores realmente presentes."
            )
        return self


# ------------------------------------------------------------------
# VERIFICACION DE ROL DEL ACUERDO  (post-proceso, no usa el LLM)
# ------------------------------------------------------------------
# El enunciado exige que sea EL CLIENTE quien manifiesta el compromiso. El
# modelo a veces cita como acuerdo_evidencia una frase del ASESOR ("te confirmo
# el compromiso de pago para el ...") y marca acuerdo_pago=true. Un validador de
# Pydantic no lo detecta porque no ve la transcripcion. Esta funcion recibe los
# mensajes del rol USUARIO y comprueba que la cita salga de uno de ellos.

def _norm_cita(s) -> str:
    """Mayusculas, sin signos, espacios colapsados: para comparar citas literales."""
    s = re.sub(r"[^\w ]+", " ", str(s).upper(), flags=re.UNICODE)
    return " ".join(s.split())


def cita_literal_de_usuario(cita, mensajes_usuario, min_chars: int = 12) -> bool:
    """True solo si `cita` aparece textualmente en algun mensaje del rol USUARIO.

    - cita: la cita literal extraida por el modelo (o None / "").
    - mensajes_usuario: iterable con el texto de los mensajes de rol USUARIO de
      esa conversacion.
    - Si la cita es demasiado corta para verificarla (< min_chars ya normalizados)
      se considera NO confirmada: se prefiere un falso negativo a dar por buena
      una atribucion que el cliente nunca hizo.
    """
    if not cita:
        return False
    c = _norm_cita(cita)
    if len(c) < min_chars:
        return False
    for m in mensajes_usuario:
        mn = _norm_cita(m)
        if not mn:
            continue
        # coincidencia por subcadena; el modelo a veces recorta o alarga la cita,
        # asi que tambien vale que el primer tramo de la cita este en el mensaje.
        if c in mn or (len(c) >= 30 and c[:30] in mn):
            return True
    return False


def acuerdo_confirmado_por_cliente(acuerdo_evidencia, mensajes_usuario, min_chars: int = 12) -> bool:
    """El acuerdo solo cuenta si la cita la dijo el CLIENTE (no el asesor)."""
    return cita_literal_de_usuario(acuerdo_evidencia, mensajes_usuario, min_chars)


def motivo_respaldado_por_cliente(evidencia_motivo, mensajes_usuario, min_chars: int = 12) -> bool:
    """v13: un motivo solo es valido si su evidencia es una frase textual del CLIENTE.

    gpt-4o-mini a veces rellena evidencia_motivo con un comentario propio
    ("no hay una frase clara del cliente...") y aun asi clasifica el motivo.
    Esto detecta ese caso: si la evidencia no aparece en ningun mensaje del
    USUARIO, el motivo se degrada a NINGUNO en la consolidacion.
    """
    return cita_literal_de_usuario(evidencia_motivo, mensajes_usuario, min_chars)


# ESQUEMA COMPACTO PARA EL PROMPT

def esquema_compacto() -> str:
    """Firma del JSON de salida en forma legible y breve.

    Existe por una razon de costo, no de estilo. Groq no ofrece prompt caching:
    el prompt fijo se cobra integro en cada una de las ~1.197 llamadas. El JSON
    Schema completo que genera ConversacionIA.model_json_schema() ocupa varios
    miles de tokens; esta version transmite la misma informacion accionable en
    una fraccion. Ver prompts.SYSTEM_PROMPT_COMPACTO.
    """

    def opciones(enum_cls) -> str:
        return " | ".join(m.value for m in enum_cls)

    return f"""{{
  "analisis_previo": str,   // PRIMERO, 2-4 frases: roles presentes y si hay [AGENTE]; frases textuales del USUARIO; la fecha es dia concreto o referencia vaga
  "resumen": str (2-4 frases, factual),
  "evidencia_motivo": str | null,   // PRIMERO la cita literal del USUARIO; si no hay, null
  "motivo_no_pago": {opciones(MotivoNoPago)},   // se desprende de evidencia_motivo; NINGUNO si quedo null
  "motivos_secundarios": [motivo, ...],   // max 3, sin repetir el principal
  "cliente_reconoce_deuda": true | false | null,
  "asesor_pregunta_por_motivo": true | false,
  "ofertas_asesor": [{{"tipo": {opciones(TipoOferta)}, "evidencia": str}}],   // max 6, SOLO rol AGENTE
  "argumentos_asesor": [{{"tipo": {opciones(ArgumentoPersuasion)}, "evidencia": str}}],   // max 5, SOLO rol AGENTE
  "fecha_compromiso_texto": str | null,   // PRIMERO, literal, sin normalizar
  "tipo_fecha": {opciones(TipoFecha)},
  "monto_comprometido_texto": str | null,
  "acuerdo_evidencia": str | null,   // PRIMERO la cita literal del USUARIO que se compromete; si no hay, null
  "acuerdo_pago": true | false,   // DESPUES: true SOLO si tipo_fecha=FECHA_ESPECIFICA y acuerdo_evidencia no es null
  "justificacion_satisfaccion": str,   // ANTES de la nota: que nivel de la rubrica y por que no el contiguo
  "factores_insatisfaccion": [{opciones(FactorInsatisfaccion)}],   // max 4, del mas al menos determinante
  "satisfaccion_llm": 1 | 2 | 3 | 4 | 5,   // DESPUES: coherente con la justificacion y los factores
  "sentimiento_inicial": {opciones(Sentimiento)},
  "sentimiento_final": {opciones(Sentimiento)},
  "hubo_friccion_bot": true | false,
  "conversacion_abandonada": true | false,
  "recomendacion_mejora": str   // accion concreta
}}"""


# ESQUEMA ESTRICTO PARA STRUCTURED OUTPUTS DE GROQ
# Groq puede forzar la forma de la respuesta con response_format cuando el
# modelo lo soporta (kimi-k2, gpt-oss, llama-4). Se parte del JSON Schema de
# Pydantic y se ajusta a lo que acepta el decodificador restringido (xgrammar):
# se podan las palabras clave de longitud/patron y se marcan TODOS los campos
# como required (los opcionales ya admiten null en su tipo). Las restricciones
# podadas se siguen validando despues en ConversacionIA. Ver
# prompts.formato_respuesta().

_CLAVES_SCHEMA_NO_SOPORTADAS = (
    "minLength", "maxLength", "minItems", "maxItems", "pattern", "format",
)


def _podar_schema(nodo) -> None:
    """Elimina in place las palabras clave de validacion que xgrammar rechaza."""
    if isinstance(nodo, dict):
        for clave in _CLAVES_SCHEMA_NO_SOPORTADAS:
            nodo.pop(clave, None)
        for valor in nodo.values():
            _podar_schema(valor)
    elif isinstance(nodo, list):
        for item in nodo:
            _podar_schema(item)


def _forzar_required_total(nodo) -> None:
    """En modo strict toda propiedad de un objeto debe ir en 'required'."""
    if isinstance(nodo, dict):
        if nodo.get("type") == "object" and "properties" in nodo:
            nodo["required"] = list(nodo["properties"].keys())
        for valor in nodo.values():
            _forzar_required_total(valor)
    elif isinstance(nodo, list):
        for item in nodo:
            _forzar_required_total(item)


def esquema_json_estricto() -> dict:
    """Bloque json_schema para response_format={"type": "json_schema"} de Groq.

    Devuelve {"name", "schema", "strict"} listo para
    {"type": "json_schema", "json_schema": esquema_json_estricto()}. Si el
    modelo elegido no soporta salida estructurada, el notebook usa en su lugar
    prompts.formato_respuesta(estructurado=False) (modo json_object).
    """
    schema = ConversacionIA.model_json_schema()
    _podar_schema(schema)
    _forzar_required_total(schema)
    return {"name": "conversacion_ia", "schema": schema, "strict": True}


CAMPOS = list(ConversacionIA.model_fields.keys())

__all__ = [
    "ConversacionIA",
    "OfertaDetectada",
    "ArgumentoDetectado",
    "MotivoNoPago",
    "TipoOferta",
    "ArgumentoPersuasion",
    "FactorInsatisfaccion",
    "TipoFecha",
    "Sentimiento",
    "esquema_compacto",
    "esquema_json_estricto",
    "CAMPOS",
    "TRAZABILIDAD_TAXONOMIAS",
]


if __name__ == "__main__":
    import json

    print(f"Campos del contrato: {len(CAMPOS)}")
    print(", ".join(CAMPOS))
    print()
    completo = json.dumps(ConversacionIA.model_json_schema())
    compacto = esquema_compacto()
    estricto = json.dumps(esquema_json_estricto())
    print("Tamano del JSON Schema completo vs. compacto:")
    print(f"  completo: {len(completo):>7,} caracteres (~{len(completo)//4:,} tokens)")
    print(f"  compacto: {len(compacto):>7,} caracteres (~{len(compacto)//4:,} tokens)")
    print(f"  estricto: {len(estricto):>7,} caracteres (~{len(estricto)//4:,} tokens)  (response_format Groq)")
    print(f"  ahorro compacto por llamada: ~{(len(completo)-len(compacto))//4:,} tokens")
