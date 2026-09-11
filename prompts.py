"""
prompts.py - Diseno de prompts para la generacion de variables con IA.

Prueba tecnica Cientifico(a) de AI - Voice of Customer, operacion de cobranza.
Reto tecnico 3.a: "Genere variables a partir de AI para responder todas las
preguntas. DISENE LOS PROMPS para la generacion de las variables."

Este archivo es un ENTREGABLE, no un detalle de implementacion: el enunciado
exige explicitamente entregar "Explicacion de la metodologia (que incluya promps
y calculo de la satisfaccion)", y el componente "IA Generativa y Prompt
Engineering" pesa 25 de los 100 puntos de la evaluacion.

Estructura del modulo
---------------------
    BITACORA                    historial de versiones y que resolvio cada una
    CONTEXTO_DOMINIO            que es esta operacion y como leer la transcripcion
    REGLA_ROLES                 quien genera ofertas y quien emite plantillas
    REGLA_ANONIMIZACION         como tratar PERSONA_00000109, FECHA_00000213, etc.
    EXIGENCIA_EVIDENCIA         obligacion de citar literalmente
    REGLA_ACUERDO               definicion estricta de acuerdo de pago
    RUBRICA_SATISFACCION        escala 1-5 anclada en conductas observables
    SYSTEM_PROMPT               prompt completo (referencia y auditoria)
    SYSTEM_PROMPT_COMPACTO      prompt de produccion, optimizado en tokens
    FEW_SHOT                    tres ejemplos por contraste, validados con Pydantic
    construir_mensajes()        ensambla la lista de mensajes para la API
    formato_respuesta()         response_format para structured outputs (OpenAI/Mistral)
    consolidar_satisfaccion()   autoconsistencia de satisfaccion_llm (pregunta e)

Al importar este modulo se validan los ejemplos few-shot contra
esquema.ConversacionIA. Si un ejemplo dejara de cumplir el contrato, el import
falla de inmediato en vez de degradar silenciosamente la calidad de la
extraccion.
"""

import json

from esquema import ConversacionIA, esquema_compacto, esquema_json_estricto


# ==========================================================================
# BITACORA DE VERSIONES
# ==========================================================================

BITACORA = """
BITACORA DE ITERACIONES DEL PROMPT
==================================

Cada version se documenta con el PROBLEMA que la origino y el CAMBIO que lo
resolvio. Las versiones v1 a v5 corresponden al diseno del prompt; el problema
de cada una se identifico sobre evidencia verificable: hallazgos medidos en el
EDA (notebooks/00_EDA.ipynb), exigencias literales del enunciado, o fallos de
validacion de Pydantic detectados al construir los ejemplos few-shot. v6
optimiza el costo en Groq. v7 a v10 aplican patrones conocidos de prompt
engineering -razonamiento antes de la conclusion, salida estructurada nativa,
ejemplo few-shot de la franja media y autoconsistencia para el ranking- sin
tocar las reglas de negocio anteriores.

--------------------------------------------------------------------------
v1 - Linea base: prompt unico con taxonomias abiertas
--------------------------------------------------------------------------
PROBLEMA
  El primer diseno pedia el motivo de no pago y las ofertas como texto libre.
  Las preguntas (a), (b) y (c) del enunciado son rankings de frecuencia
  ("cuales son los principales motivos", "que ofertas realizan"). Con texto
  libre, un motivo equivalente se escribe de N formas distintas en N
  conversaciones ("esta sin empleo", "perdio el trabajo", "desempleado") y el
  conteo se fragmenta hasta volverse inservible. Es la falla clasica del
  etiquetado generativo sin vocabulario controlado.

CAMBIO
  Se cierran las cuatro taxonomias como Enum en esquema.py. Las categorias no
  se inventan: se derivan de frecuencias medidas sobre el corpus
  (ver esquema.TRAZABILIDAD_TAXONOMIAS). Cada familia recibe una categoria
  OTRO / OTRA para lo que no encaja y una categoria NINGUNO / NINGUNA para la
  ausencia, de modo que el modelo nunca se vea forzado a inventar.

--------------------------------------------------------------------------
v2 - Separacion de roles: el BOT no negocia
--------------------------------------------------------------------------
PROBLEMA
  La columna "de" tiene cuatro roles (USUARIO 18.619, AGENTE 13.770, BOT 8.408,
  HSM 1.208). El EDA mostro que una fraccion alta del corpus son plantillas
  automaticas repetidas en decenas de conversaciones. Peor aun, se verifico en
  los datos que el BOT se presenta literalmente como asesor humano:

      [BOT] HOLA, MI NOMBRE ES PERSONA_00000109, SOY ASESOR DEL BANCO_000001.

  Sin una regla explicita, el modelo atribuye al asesor ofertas y argumentos
  que en realidad son plantillas del bot. Eso contaminaria directamente las
  preguntas (b) y (c): se estaria midiendo la efectividad de un texto
  automatico como si fuera la habilidad negociadora de una persona.

CAMBIO
  Se anade REGLA_ROLES con una tabla explicita de los cuatro roles y la
  instruccion de que SOLO los mensajes marcados [AGENTE] pueden generar
  entradas en ofertas_asesor y argumentos_asesor, sin importar como se presente
  el emisor. Se refuerza en la descripcion de ambos campos del esquema.

--------------------------------------------------------------------------
v3 - Marcadores de anonimizacion: el anonimizador rompio palabras comunes
--------------------------------------------------------------------------
PROBLEMA
  Dos problemas distintos con los datos despersonalizados.

  (a) El modelo puede leer PERSONA_00000109 o EMAIL_00000005 como datos reales
      e incorporarlos al resumen, o intentar razonar sobre ellos.

  (b) Hallazgo verificado en el corpus, y bastante mas serio: el anonimizador
      reemplazo nombres propios por SUBCADENA, sin exigir que fueran palabras
      completas. El resultado es que destruyo palabras corrientes del espanol.
      El dano alcanza 1.625 mensajes en 856 conversaciones, el 71,5% del
      corpus. Tres marcadores quedaron decodificados con certeza:

        PERSONA_00000008 = "ANA"
            Se confirma por los fragmentos pegados: MAÑPERSONA_00000008 (326
            veces) es MAÑANA, SEMPERSONA_00000008 (123) es SEMANA,
            DIPERSONA_00000008 (163) es DIANA, y ademas JULIANA, CERCANA,
            LEJANA, HERMANA, TATIANA, VIVIANA.

        PERSONA_00000031 = "CESAR"
            Aparece INCRUSTADO EN MITAD de la palabra:
            "NEPERSONA_00000031IO" es NECESARIO y "NEPERSONA_00000031IA" es
            NECESARIA (147 apariciones).

        PERSONA_00000108 = "JULIO"
            Es un NOMBRE DE MES, no una persona. Prueba decisiva: al contar
            los meses que aparecen literales en el corpus estan todos menos
            uno -JUNIO 365, AGOSTO 361, MAYO 179, ABRIL 99, SEPTIEMBRE 81,
            MARZO 53, ENERO 48, OCTUBRE 48, NOVIEMBRE 47, DICIEMBRE 35,
            FEBRERO 30- y JULIO no aparece ni una sola vez, pese a estar
            rodeado de los dos meses mas frecuentes. Se confirma en contexto:
            "TRASLADO DE 2 CUOTAS, DE JUNIO Y PERSONA_00000108" y "PAGA CUOTA
            DE MAYO EL 3 DE PERSONA_00000108 PARA RETOMAR PAGO EN AGOSTO".

      La consecuencia es grave y silenciosa, y golpea justo la variable mas
      importante. "MAÑPERSONA_00000008 HAGO EL PAGO" es "MAÑANA HAGO EL PAGO",
      es decir FECHA_ESPECIFICA. "EN LA PROXIMA SEMPERSONA_00000008" es "LA
      PROXIMA SEMANA", es decir FECHA_VAGA. "PODRIA PAGARLO EL 25 DE
      PERSONA_00000108" es "EL 25 DE JULIO", un dia calendario concreto. Sin
      estas reglas el modelo ve cadenas sin sentido, no reconoce la fecha y el
      acuerdo se pierde. Como acuerdo_pago es el denominador de las preguntas
      (b) y (c), el error se propagaria a todo el analisis de efectividad.

CAMBIO
  Se anade REGLA_ANONIMIZACION con cuatro instrucciones: no interpretar los
  marcadores como datos reales, no reproducirlos en el resumen, reconstruir
  mentalmente la palabra cuando el marcador aparece pegado o incrustado en
  otra palabra -con el glosario de los tres marcadores decodificados- y no
  confundir un marcador FECHA_xxxxx suelto, que suele ser la fecha de
  expedicion del documento pedida en la validacion de identidad, con un
  compromiso de pago.

--------------------------------------------------------------------------
v4 - Regla estricta de acuerdo y exigencia de cita literal
--------------------------------------------------------------------------
PROBLEMA
  Dos sesgos conocidos de los LLM como anotadores se combinan aqui de la peor
  manera. El primero es la complacencia: tienden a leer cortesia como
  compromiso, y "voy a ver que puedo hacer" o "cuando pueda le pago" se
  codifican como acuerdo. El segundo es la atribucion sin fundamento: el modelo
  asigna una categoria plausible aunque ninguna frase del cliente la sustente.
  El enunciado es mucho mas restrictivo que la lectura intuitiva:

      "se considerara como acuerdo de pago aquellos casos en los que el cliente
      manifieste explicitamente su compromiso de pago indicando una fecha
      especifica"

CAMBIO
  Tres medidas simultaneas, en tres capas distintas:

  1. REGLA_ACUERDO en el prompt, con la cita literal del enunciado, las dos
     condiciones necesarias, 4 ejemplos positivos y 6 contraejemplos tomados de
     giros que aparecen en el corpus.
  2. EXIGENCIA_EVIDENCIA: toda variable interpretativa exige cita textual. La
     instruccion operativa es "si no puede copiar la frase, la categoria es
     NINGUNO", lo que convierte la ausencia de evidencia en una salida valida
     en vez de un incentivo a inventar.
  3. Validadores en esquema.py que RECHAZAN la respuesta si acuerdo_pago=true
     no viene con FECHA_ESPECIFICA + evidencia + fecha textual. El prompt se
     puede ignorar; el ValidationError no. El notebook devuelve ese error al
     modelo como turno de usuario para que se corrija a si mismo.

--------------------------------------------------------------------------
v5 - Rubrica anclada de satisfaccion
--------------------------------------------------------------------------
PROBLEMA
  Pedir "califique la satisfaccion del 1 al 5" sin anclaje produce dos fallas
  documentadas en la literatura de LLM-as-a-judge, y ambas rompen la pregunta
  (e), que pide precisamente "las 5 conversaciones peor calificadas":

  (a) Compresion hacia el centro: casi todo se califica 3 o 4 y la cola baja
      queda vacia, con lo que no hay peores conversaciones que mostrar.
  (b) Contaminacion por resultado: el modelo confunde experiencia del cliente
      con exito comercial y castiga a todo cliente que no pago, aunque haya
      sido bien atendido.

CAMBIO
  RUBRICA_SATISFACCION define los 5 niveles por CONDUCTAS OBSERVABLES en la
  transcripcion, no por adjetivos. Se anade la regla de independencia del
  resultado comercial con dos casos de calibracion cruzados (sin acuerdo pero
  bien atendido = 4-5; con acuerdo pero maltratado = 2-3) y una regla de
  desempate que solo permite bajar de nivel si se puede nombrar un factor
  concreto. Adicionalmente, el score final del notebook no es la calificacion
  del LLM sino un score hibrido 70/30 con senales objetivas medidas sobre los
  mensajes, precisamente como contrapeso a la compresion al centro.

--------------------------------------------------------------------------
v6 - Version compacta para produccion
--------------------------------------------------------------------------
PROBLEMA
  Groq NO ofrece prompt caching. El prompt fijo se cobra integro en cada una de
  las ~1.197 llamadas de la corrida completa. Volcar el JSON Schema generado
  por Pydantic cuesta ~2.530 tokens por llamada frente a ~578 de la firma
  compacta (medicion reproducible con `python esquema.py`). La diferencia es de
  ~1.952 tokens por llamada, es decir del orden de 2,3 millones de tokens de
  entrada en la corrida completa, sin ninguna ganancia de calidad: el JSON
  Schema repite en forma verbosa lo que la firma compacta ya dice.

CAMBIO
  SYSTEM_PROMPT_COMPACTO conserva integras las reglas que cambian el resultado
  (roles, anonimizacion, acuerdo, evidencia, rubrica) y sustituye el JSON
  Schema por esquema_compacto(). SYSTEM_PROMPT se conserva como version de
  referencia y auditoria. Ambas comparten literalmente las mismas constantes de
  reglas, de modo que no pueden divergir por descuido.

--------------------------------------------------------------------------
v7 - Orden de razonamiento: primero la evidencia, luego la etiqueta
--------------------------------------------------------------------------
PROBLEMA
  El esquema pedia la decision antes que su soporte: motivo_no_pago antes de
  evidencia_motivo, acuerdo_pago antes de la fecha y de acuerdo_evidencia,
  satisfaccion_llm antes de la justificacion. Un LLM que emite el JSON en ese
  orden fija la categoria y despues redacta una cita que la respalde: es la
  misma atribucion sin fundamento que v4 intento cerrar. Y como el formato de
  salida prohibe el razonamiento visible, el modelo no tiene donde ordenar el
  analisis antes de comprometerse.

CAMBIO
  Chain-of-thought dentro del propio JSON, en dos medidas:
  1. Campo nuevo analisis_previo, PRIMERO en el esquema: 2 a 4 frases donde el
     modelo fija roles presentes, frases textuales del cliente y analisis de la
     fecha antes de decidir nada. El notebook puede descartarlo del CSV.
  2. Reordenamiento de cada bloque a evidencia -> conclusion: evidencia_motivo
     antes de motivo_no_pago; fecha_compromiso_texto, tipo_fecha y
     acuerdo_evidencia antes de acuerdo_pago; justificacion_satisfaccion y
     factores_insatisfaccion antes de satisfaccion_llm. El orden de los campos
     en esquema_compacto() y en las salidas few-shot es el que guia la
     generacion; los validadores de Pydantic no dependen del orden.

--------------------------------------------------------------------------
v8 - Salida estructurada nativa de Groq (response_format)
--------------------------------------------------------------------------
PROBLEMA
  La validez del JSON se pedia solo por instruccion ("el primer caracter debe
  ser {"). Cada respuesta malformada gasta una llamada de reintento, y Groq no
  tiene caching que amortigue ese costo.

CAMBIO
  esquema.esquema_json_estricto() deriva del schema de Pydantic un JSON Schema
  apto para response_format={"type": "json_schema"}: poda las palabras clave que
  el decodificador restringido de Groq (xgrammar) no acepta -minLength,
  maxLength, minItems, maxItems, pattern, format- y marca todos los campos como
  required. Esas restricciones podadas se siguen aplicando en la validacion de
  Pydantic. En prompts.py, formato_respuesta(estructurado) devuelve el bloque
  json_schema para los modelos Groq que lo soportan (kimi-k2, gpt-oss, llama-4)
  o json_object para el resto. FORMATO_SALIDA queda como respaldo, no como unica
  garantia.

--------------------------------------------------------------------------
v9 - Tercer ejemplo few-shot: muchas ofertas, ningun acuerdo
--------------------------------------------------------------------------
PROBLEMA
  Los dos ejemplos previos son los extremos (acuerdo + experiencia 5; bucle de
  bot + experiencia 1). Ninguno muestra el caso mas frecuente y el que sostiene
  las preguntas (b) y (c): un [AGENTE] que hace varias ofertas y argumenta, y un
  cliente que NO se compromete. Sin ese ancla el modelo tiende a leer la
  cortesia de cierre ("listo", "lo voy a pensar") como acuerdo, y a calificar
  bajo el caso solo porque no hubo pago.

CAMBIO
  Ejemplo C: credito de libranza con descuento de nomina no aplicado, dos
  ofertas (diferir, descuento de intereses) y un argumento (centrales); el
  cliente responde "apenas me paguen la quincena miro si abono algo" ->
  FECHA_VAGA, acuerdo_pago false; friccion menor del bot -> satisfaccion 3.
  Cubre una taxonomia de motivo que los otros ejemplos no tocaban y ejercita la
  franja media de la rubrica. Se valida con Pydantic y con la verificacion de
  citas literales al importar, igual que los otros dos.

--------------------------------------------------------------------------
v10 - Autoconsistencia para la pregunta (e)
--------------------------------------------------------------------------
PROBLEMA
  "Las 5 conversaciones peor calificadas" es un ranking por satisfaccion_llm.
  Con una sola llamada, dos casos cercanos al fondo pueden intercambiar
  posiciones entre corridas por la varianza del modelo.

CAMBIO
  Solo para satisfaccion_llm, el notebook toma K_AUTOCONSISTENCIA=3 muestras a
  TEMP_AUTOCONSISTENCIA=0.4 y usa prompts.consolidar_satisfaccion() para
  quedarse con la mediana entera; devuelve tambien la dispersion (max - min)
  para marcar los casos inestables. El resto de la extraccion corre una vez con
  PARAMS_EXTRACCION (temperature 0) y hasta MAX_REINTENTOS=2 reintentos
  dirigidos. Esto se suma al score hibrido 70/30 y a la prueba de estabilidad
  ya descritos, no los reemplaza.

--------------------------------------------------------------------------
v11 - Cambio de proveedor: Groq -> Mistral -> Cerebras -> Gemini
--------------------------------------------------------------------------
PROBLEMA
  Los tres primeros niveles gratuitos resultaron inviables:
    - Groq (gpt-oss-120b): TPM 8.000 < prompt fijo 8.149 -> una sola llamada
      no cabe -> 429 de forma permanente.
    - Mistral: su nivel gratuito quedo descontinuado; la 1a llamada devuelve
      429 con x-ratelimit-limit-req-minute: 0.
    - Cerebras: la 1a llamada devuelve HTTP 402 payment_required.

CAMBIO
  Se migra a Gemini (Google AI Studio, free tier): gemini-2.5-flash-lite (alt
  mejor y con menos req/dia: gemini-2.5-flash), API compatible con la de OpenAI
  (base_url .../v1beta/openai/). La celda del cliente pasa a un switch PROVEEDOR
  de tres opciones ("gemini" | "cerebras" | "mistral") con un dict que fija por
  proveedor: variable de entorno, base_url, modelo, nombre del parametro de
  semilla (None en Gemini -no la acepta-, 'seed' en Cerebras, 'random_seed' via
  extra_body en Mistral) y si soporta json_schema. Gemini rechaza $defs/$ref en
  el schema, asi que con Gemini se usa response_format=json_object: JSON valido
  garantizado, y el contrato lo imponen la validacion de Pydantic y el reintento
  dirigido (que ya eran la red final). esquema.py, las reglas, los few-shot y
  los validadores no se tocan. _llamar_api ahora corta rapido ante 401/402/403
  (no reintenta: es key o plan) y trata 5xx como transitorio. El limite
  operativo de Gemini free son las peticiones/dia (~1.000 con flash-lite): no se
  procesa el corpus completo sino una MUESTRA estratificada (~300, ~1 dia) y los
  agregados se reportan con su margen de error. temperature 0 reduce la varianza
  pero Gemini no acepta semilla, asi que no hay control de determinismo.
  Cambiar de modelo obliga a repetir el piloto y a re-anclar los umbrales de
  kappa antes de dar por buena la calidad de la extraccion.

--------------------------------------------------------------------------
v12 - Proveedor definitivo: OpenAI de pago, corpus completo
--------------------------------------------------------------------------
PROBLEMA
  El free tier de Gemini limita a ~1.000 peticiones/dia, lo que obligaba a
  procesar solo una muestra estratificada (~300) y a arrastrar un margen de
  error en cada agregado de las preguntas (a)-(e). Ademas Gemini no acepta
  semilla, asi que la seccion de estabilidad no tenia control de determinismo.

CAMBIO
  Con una recarga minima (>= $5) se pasa a la API oficial de OpenAI. Se anade
  "openai" al dict _PROVEEDORES de la celda del cliente (env OPENAI_API_KEY,
  base_url https://api.openai.com/v1) y se fija PROVEEDOR = "openai". Modelo:
  gpt-4.1-nano, el mas rapido y barato del catalogo: la tarea es extraccion
  guiada por un contrato cerrado, no razonamiento abierto, y el guardarrail
  real ya son la validacion de Pydantic y el reintento dirigido. seed_param =
  "seed" (gpt-4.1-* lo aceptan; _llamar_api lo retira si el servidor lo
  rechaza), con lo que la seccion de estabilidad recupera control de varianza.
  json_schema = False a proposito: el schema estricto de esquema_json_estricto()
  lleva $defs/$ref/default y el structured outputs de OpenAI es quisquilloso con
  eso; se mantiene response_format=json_object + Pydantic + reintento, que es la
  ruta ya probada en el piloto (15/15 validas). Con proveedor de pago desaparece
  el RPD del free tier: se procesa el CORPUS COMPLETO (1.197 conversaciones,
  ~$3-4 con gpt-4.1-nano), asi que los agregados dejan de llevar margen de
  muestreo. La celda 27 pasa de "muestra estratificada" a "corpus completo"
  (define todos_ids -> CACHE_COMPLETA); el muestreo estratificado se conserva
  como documentacion del diseno. esquema.py, las reglas, los few-shot y los
  validadores no se tocan. Sigue pendiente medir la calidad contra anotacion
  humana (piloto + kappa) antes de dar por buenos los numeros.

--------------------------------------------------------------------------
v13 - gpt-4.1-nano -> gpt-4o-mini + verificacion de rol de las citas
--------------------------------------------------------------------------
PROBLEMA
  Auditoria de la corrida con gpt-4.1-nano (2026-09-10) sobre 1.186 salidas:
    1. acuerdo_pago inflado ~4x: de 321 marcados true, la cita de acuerdo_evidencia
       la dice el ASESOR en el 69% de los casos, no el cliente. El validador de
       esquema.py solo comprobaba que el campo tuviera texto, nunca el rol de
       origen. Independiente del modelo.
    2. Sub-extraccion sistematica de motivo_no_pago: NINGUNO en el 93%; en 327
       conversaciones el modelo cita una frase clara del cliente en
       evidencia_motivo y aun asi pone NINGUNO. gpt-4.1-nano es demasiado debil
       para ese juicio de clasificacion. Una prueba dirigida (120 conv) mostro
       que gpt-4o-mini rescata ~48% de esos casos, con mejor coherencia
       (ej. "fui despedido" -> DESEMPLEO, no NEGOCIO_O_INGRESO_VARIABLE), pero
       inventa un motivo cuando NO hay frase del cliente (~10% de las veces,
       rellenando evidencia_motivo con un comentario propio).

CAMBIO
  a) Modelo: se sube a gpt-4o-mini (dict _PROVEEDORES, entrada "openai"). Sigue
     sin ser reasoning: entra sin tocar temperature=0 ni seed. Coste del corpus
     completo ~$2,9.
  b) esquema.cita_literal_de_usuario(cita, mensajes_usuario): comprueba que una
     cita aparezca textualmente en un mensaje de rol USUARIO. Dos aplicaciones:
       - acuerdo_confirmado_por_cliente(): si acuerdo_evidencia no es del cliente,
         acuerdo_pago pasa a false en la consolidacion (celda 29).
       - motivo_respaldado_por_cliente(): si evidencia_motivo no es del cliente,
         motivo_no_pago se degrada a NINGUNO en la consolidacion.
     Son post-proceso determinista sobre la cache, no gastan llamadas y son
     independientes del modelo. La celda 29 anade columnas *_llm y *_reclasificado
     para trazabilidad. El contrato Pydantic (esquema_json_estricto, few-shot,
     validadores duros) no cambia.
  c) Sigue pendiente medir (a) contra anotacion humana; la pregunta (c) no es
     rescatable con estos datos (acuerdos verificados ~64, confundidos por la
     eleccion de oferta del asesor, corpus truncado).

--------------------------------------------------------------------------
PENDIENTE DE CONFIRMACION EMPIRICA
--------------------------------------------------------------------------
Las decisiones anteriores estan fundamentadas en evidencia del corpus, en el
enunciado y en el contrato de Pydantic, pero su efecto sobre la calidad de la
extraccion todavia NO esta medido contra anotacion humana. Esa medicion es la
seccion de validacion del notebook 01_extraccion_llm.ipynb:

    - muestra estratificada de 60 conversaciones anotadas manualmente
    - criterio de aceptacion: kappa de Cohen >= 0,75 en acuerdo_pago
      y >= 0,60 en motivo_no_pago
    - prueba de estabilidad: 10 conversaciones procesadas 3 veces

Mientras esos numeros no existan, ninguna afirmacion sobre la precision de esta
capa debe darse por establecida.
"""


# ==========================================================================
# BLOQUES DE REGLAS
# ==========================================================================
# Se definen como constantes independientes por dos razones: son citables uno a
# uno en la presentacion de la prueba, y garantizan que la version completa y la
# compacta del system prompt no puedan divergir.

CONTEXTO_DOMINIO = """\
Eres analista experto en Voice of Customer para una operacion de COBRANZA de un \
banco colombiano. Analizas conversaciones reales de WhatsApp entre el banco y \
clientes con obligaciones en mora (creditos de libranza, tarjetas de credito, \
creditos de consumo).

Tu tarea es convertir cada conversacion en un conjunto de variables \
estructuradas, para responder preguntas de negocio: cuales son los motivos de no \
pago, que ofertas hacen los asesores, que argumentos logran mas acuerdos, que \
esta pasando en las conversaciones y que caracteriza a las peor calificadas.

FORMATO DE ENTRADA
Recibiras una transcripcion completa, un mensaje por linea, con el formato:

    [ROL] texto del mensaje

Los mensajes van en su orden real de ocurrencia. El corpus esta en MAYUSCULAS y \
con acentuacion irregular por como fue exportado: eso es una caracteristica \
tecnica del archivo, NO es enfasis, NO es gritar y NO indica agresividad. Nunca \
uses las mayusculas como senal de sentimiento.

CRITERIO GENERAL
Extraes lo que esta en el texto. No completas, no supones y no infieres lo que \
"probablemente" quiso decir el cliente. Ante la duda entre una categoria \
especifica y la ausencia de categoria, elige la ausencia."""


REGLA_ROLES = """\
ROLES DE LA CONVERSACION - REGLA CRITICA
========================================

  [USUARIO]  El CLIENTE. Unica fuente valida para: motivo de no pago, \
reconocimiento de deuda, compromiso de pago, fecha, monto y sentimiento.
  [AGENTE]   ASESOR HUMANO. Unica fuente valida para: ofertas y argumentos.
  [BOT]      Automatizacion. Menus, validacion de identidad, avisos legales, \
encuestas de satisfaccion. NO negocia.
  [HSM]      Plantilla de notificacion enviada por el banco para iniciar el \
contacto. NO negocia.

ADVERTENCIA IMPORTANTE, verificada en estos datos: el BOT se presenta a si mismo \
como asesor humano. Aparecen mensajes como:

    [BOT] HOLA, MI NOMBRE ES PERSONA_00000109, SOY ASESOR DEL BANCO_000001.

Ignora por completo lo que el emisor dice ser. Lo unico que cuenta es la \
ETIQUETA DE ROL entre corchetes al inicio de la linea.

En consecuencia:
  - ofertas_asesor y argumentos_asesor SOLO pueden citar lineas que empiecen \
por [AGENTE].
  - Si una alternativa de pago aparece unicamente en una linea [BOT] o [HSM], \
NO es una oferta del asesor: es una plantilla automatica. No la registres.
  - Una conversacion puede terminar legitimamente con ofertas_asesor vacio, y \
eso es un hallazgo de negocio relevante, no un error tuyo."""


REGLA_ANONIMIZACION = """\
MARCADORES DE ANONIMIZACION
===========================

Los datos fueron despersonalizados antes de entregarse. Encontraras marcadores \
con la forma TIPO_00000000: PERSONA_, FECHA_, EMAIL_, DIRECCION_, DOCUMENTO_, \
BANCO_, PRODUCTO_, TELEFONO_, y tambien URL_ANONIMIZADA.

Reglas:

1. Un marcador es un SUSTITUTO, no un dato. No lo interpretes como informacion \
real, no razones sobre su valor numerico y no intentes deducir a quien reemplaza.

2. No reproduzcas marcadores en el campo resumen. Escribe "el cliente", "el \
asesor", "el banco", "el producto". Los marcadores SI se conservan intactos \
dentro de las citas de evidencia, porque la evidencia debe ser literal.

3. IMPORTANTE - EL ANONIMIZADOR ROMPIO PALABRAS CORRIENTES. Los nombres se \
reemplazaron por subcadena, sin exigir palabra completa, asi que hay marcadores \
PEGADOS a un fragmento de palabra o INCRUSTADOS en mitad de ella. Afecta al 71% \
de las conversaciones. Cuando veas un marcador unido a letras, reconstruye la \
palabra antes de interpretarla. Glosario verificado en estos datos:

       PERSONA_00000008  =  ANA
           MAÑPERSONA_00000008   ->  MAÑANA      (326 veces en el corpus)
           SEMPERSONA_00000008   ->  SEMANA      (123 veces)
           DIPERSONA_00000008    ->  DIANA
           CERCPERSONA_00000008  ->  CERCANA     (y JULIANA, LEJANA, HERMANA...)

       PERSONA_00000031  =  CESAR
           NEPERSONA_00000031IO  ->  NECESARIO
           NEPERSONA_00000031IA  ->  NECESARIA

       PERSONA_00000108  =  JULIO   (es un MES, no una persona)
           EL 25 DE PERSONA_00000108      ->  EL 25 DE JULIO
           LA CUOTA DEL MES DE PERSONA_00000108  ->  la cuota de julio

   Esto cambia directamente tipo_fecha, asi que preste atencion:

       "MAÑPERSONA_00000008 HAGO EL PAGO"        = "MAÑANA HAGO EL PAGO"
                                                 -> FECHA_ESPECIFICA
       "LA PROXIMA SEMPERSONA_00000008 MIRO"     = "LA PROXIMA SEMANA MIRO"
                                                 -> FECHA_VAGA
       "PODRIA PAGARLO EL 25 DE PERSONA_00000108" = "EL 25 DE JULIO"
                                                 -> FECHA_ESPECIFICA

   En las citas de evidencia y en fecha_compromiso_texto copia el texto TAL COMO \
APARECE, con el marcador intacto. La reconstruccion es solo para que entiendas el \
sentido, nunca para reescribir la cita.

4. Un marcador FECHA_00000000 SOLO, sin dia adjunto, suele ser la fecha de \
expedicion del documento que el bot pide para validar identidad al inicio de la \
conversacion. NO lo confundas con un compromiso de pago. Solo cuentalo como \
fecha de compromiso si el cliente lo usa explicitamente para prometer un pago."""


# Glosario decodificado, expuesto como dato para poder citarlo en el analisis y
# en la presentacion de la prueba. Ver BITACORA v3 para la evidencia de cada uno.
MARCADORES_DECODIFICADOS = {
    "PERSONA_00000008": "ANA",
    "PERSONA_00000031": "CESAR",
    "PERSONA_00000108": "JULIO",
}


EXIGENCIA_EVIDENCIA = """\
EVIDENCIA LITERAL OBLIGATORIA
=============================

Toda variable interpretativa debe ir acompanada de una cita textual de la \
transcripcion. Aplica a: evidencia_motivo, acuerdo_evidencia, y el campo \
evidencia de cada oferta y de cada argumento.

Que cuenta como cita valida:
  - Texto COPIADO caracter por caracter de una linea de la transcripcion.
  - Sin la etiqueta de rol y sin los corchetes.
  - Puede ser un fragmento de la linea, pero el fragmento debe aparecer tal cual.
  - Se conservan los marcadores de anonimizacion, las mayusculas y los errores \
de escritura del original.

Que NO cuenta:
  - Parafrasear, resumir, corregir la ortografia o traducir a otras palabras.
  - Unir fragmentos de dos mensajes distintos en una sola cita.
  - Citar una linea de rol distinto al exigido (el motivo se cita del USUARIO, \
la oferta se cita del AGENTE).

REGLA OPERATIVA, la mas importante de esta seccion:

    Si no puedes copiar una frase que sustente la categoria,
    entonces la categoria es NINGUNO / NINGUNA / null.

No hay penalizacion por devolver NINGUNO. Si la hay, y grave, por afirmar algo \
que el texto no dice: una categoria sin cita no es un dato, es una conjetura, y \
contamina el analisis agregado."""


REGLA_ACUERDO = """\
ACUERDO DE PAGO - DEFINICION ESTRICTA
=====================================

Definicion vinculante, tomada literalmente del enunciado del proyecto:

    "se considerara como acuerdo de pago aquellos casos en los que el cliente
     manifieste explicitamente su compromiso de pago indicando una fecha
     especifica"

acuerdo_pago = true EXIGE LAS DOS CONDICIONES A LA VEZ:

  C1. COMPROMISO EXPLICITO DEL CLIENTE. Lo dice el [USUARIO], en primera \
persona, como afirmacion, no como pregunta ni como posibilidad.
  C2. FECHA ESPECIFICA. Un dia calendario identificable.

Si falta cualquiera de las dos, acuerdo_pago = false. No existe el acuerdo \
parcial ni el acuerdo probable.

SI ES ACUERDO (ejemplos)
------------------------
  [USUARIO] EL 25 DE PERSONA_00000108 HAGO EL PAGO
      C1 afirma que pagara. C2 dia 25 + mes anonimizado. -> true, FECHA_ESPECIFICA

  [USUARIO] LISTO, ME COMPROMETO A PAGAR LA CUOTA EL 30 DE ESTE MES
      C1 y C2 explicitas. -> true, FECHA_ESPECIFICA

  [USUARIO] MAÑPERSONA_00000008 HAGO LA CONSIGNACION SIN FALTA
      El marcador roto es "ANA": la palabra es MAÑANA, un dia calendario
      determinable respecto de la conversacion. -> true, FECHA_ESPECIFICA

  [AGENTE] ENTONCES QUEDAMOS CON EL PAGO PARA EL 15?
  [USUARIO] SI SENOR, EL 15 PAGO
      La confirmacion del cliente cumple C1 y C2. -> true, FECHA_ESPECIFICA
      (La confirmacion debe ser del cliente. Vea el contraejemplo 4.)

NO ES ACUERDO (contraejemplos)
------------------------------
  1. [USUARIO] VOY A VER QUE PUEDO HACER
     Sin compromiso y sin fecha. -> false, SIN_FECHA

  2. [USUARIO] CUANDO PUEDA LE PAGO
     Compromiso condicionado, fecha inexistente. -> false, SIN_FECHA

  3. [USUARIO] APENAS ME PAGUEN EN LA QUINCENA ABONO ALGO
     Fecha vaga y sujeta a una condicion externa. -> false, FECHA_VAGA

  4. [AGENTE] LE AGENDO EL PAGO PARA EL 20 DE ESTE MES
     [USUARIO] OK
     La fecha la puso el ASESOR. Un "OK" del cliente no es manifestacion
     explicita de compromiso: puede estar acusando recibo de la informacion.
     -> false. Solo seria acuerdo si el cliente afirma que pagara.

  5. [USUARIO] LA PROXIMA SEMPERSONA_00000008 MIRO COMO HAGO
     El marcador roto es "ANA": la palabra es SEMANA. Referencia temporal sin
     dia y sin compromiso. -> false, FECHA_VAGA

  6. [USUARIO] YO YA PAGUE ESA CUOTA EL 26 DE JUNIO
     Hay fecha especifica, pero es un pago PASADO que el cliente reclama como
     ya realizado. No es un compromiso a futuro.
     -> false. Corresponde al motivo YA_PAGO_O_PAGO_NO_APLICADO.

DISTINCION ADICIONAL, no confundir:
  - Que el ASESOR ofrezca un plan de pago es una OFERTA -> ofertas_asesor.
  - Que el CLIENTE se comprometa con fecha es un ACUERDO -> acuerdo_pago.
  Una conversacion puede tener muchas ofertas y ningun acuerdo. Ese contraste es
  justamente lo que mide la efectividad de cada oferta.

COMO LLENAR LOS CAMPOS RELACIONADOS
-----------------------------------
  tipo_fecha              FECHA_ESPECIFICA solo si hay dia calendario
                          identificable. FECHA_VAGA si hay referencia temporal
                          sin dia. SIN_FECHA si no hay ninguna.
  fecha_compromiso_texto  la fecha COPIADA del mensaje del cliente, sin
                          normalizar a formato de fecha.
  acuerdo_evidencia       la cita literal del [USUARIO] donde se compromete.
                          Obligatoria si acuerdo_pago = true.
  monto_comprometido_texto  el monto tal como el cliente lo escribio, o null.

Nota: tipo_fecha describe la fecha de COMPROMISO DE PAGO. Si el cliente
menciona una fecha por otro motivo (su fecha de corte, la fecha de expedicion
de su documento, la fecha en que pago antes), eso no alimenta tipo_fecha."""


RUBRICA_SATISFACCION = """\
SATISFACCION DEL CLIENTE - RUBRICA ANCLADA 1 A 5
================================================

REGLA DE INDEPENDENCIA DEL RESULTADO COMERCIAL, leela antes de calificar:

    Calificas la EXPERIENCIA DEL CLIENTE, no el exito de la cobranza.

Que el cliente no haya pagado NO baja la nota. Que el cliente haya acordado NO
la sube. Un cliente sin capacidad de pago, atendido con claridad y respeto, tuvo
una BUENA experiencia. Casos de calibracion cruzada:

    Sin acuerdo, pero el asesor entendio su situacion, le explico las
    alternativas y cerro con cordialidad            -> 4 o 5
    Con acuerdo, pero el cliente tuvo que repetir sus datos tres veces y
    esperar entre plantillas del bot                -> 2 o 3

NIVELES, definidos por lo que se OBSERVA en la transcripcion
------------------------------------------------------------

5 - MUY SATISFACTORIA
    El cliente recibe respuesta directa y clara a lo que pregunto.
    El asesor personaliza: responde al caso concreto, no con plantillas.
    Sin repeticiones ni datos solicitados dos veces.
    El cliente cierra agradeciendo, aceptando o con tono claramente positivo.

4 - SATISFACTORIA
    La solicitud se resuelve o queda correctamente encaminada a un canal util.
    Puede haber una friccion menor (una plantilla de mas, una demora en pasar a
    un humano), pero el cliente no expresa molestia.
    El cierre es ordenado: alguien se despide.

3 - ACEPTABLE / NEUTRA
    Tramite correcto pero impersonal, todo por guion.
    El cliente ni agradece ni se queja.
    O la solicitud queda parcialmente resuelta y se le remite a otro canal sin
    acompanamiento.

2 - INSATISFACTORIA
    Al menos una de estas conductas observables:
      - el cliente repite la misma pregunta o el mismo dato porque no fue
        atendido a la primera;
      - recibe respuestas de plantilla que no responden lo que pregunto;
      - expresa inconformidad, reclamo o cansancio de forma explicita;
      - una pregunta concreta del cliente queda sin respuesta.

1 - MUY INSATISFACTORIA
    Al menos una de estas conductas observables:
      - el cliente pide hablar con un asesor y nunca lo atiende un [AGENTE];
      - el BOT repite el mismo texto una y otra vez sin avanzar (bucle);
      - el cliente expresa molestia fuerte, reclamo airado o se despide
        quejandose;
      - el cliente abandona la conversacion tras quedar sin respuesta.

REGLA DE DESEMPATE
------------------
Si dudas entre dos niveles contiguos, solo puedes elegir el MENOR si eres capaz
de nombrar el factor observable concreto que lo justifica y registrarlo en
factores_insatisfaccion. Si no puedes nombrarlo, elige el nivel mayor.

Coherencia obligatoria:
  satisfaccion_llm 1 o 2  ->  factores_insatisfaccion NO puede quedar vacio ni
                              contener solo NINGUNO.
  satisfaccion_llm 4 o 5  ->  no puede acumular 3 o mas factores reales.

justificacion_satisfaccion debe explicar por que ESE nivel y no el contiguo,
apoyandose en hechos de la transcripcion, no en impresiones generales."""


FORMATO_SALIDA = """\
FORMATO DE SALIDA
=================

Devuelve UNICAMENTE un objeto JSON valido. Sin texto antes, sin texto despues,
sin bloques de codigo con acentos graves, sin explicaciones fuera del JSON. El
primer caracter de tu respuesta debe ser "{" y el ultimo "}".

El PRIMER campo es analisis_previo: 2 a 4 frases de razonamiento (roles
presentes y si hay algun [AGENTE], frases textuales del cliente, analisis de la
fecha) que escribes ANTES de decidir el resto. Es el unico lugar para "pensar
en voz alta"; los demas campos ya son la respuesta. Dentro de cada bloque va
primero la CITA LITERAL y despues la categoria o el booleano que esa cita
sustenta: si no puedes copiar la frase, la categoria es NINGUNO / null y el
booleano es false.

Todos los campos son obligatorios. Los campos anulables aceptan null; las listas
aceptan [] cuando no hay nada que reportar. Los valores de las taxonomias deben
escribirse EXACTAMENTE como aparecen en el esquema, en mayusculas y con guiones
bajos. No inventes categorias nuevas: para eso existen OTRO / OTRA.

Cuando la API se invoca con response_format (json_schema o json_object) esta
forma queda garantizada por el decodificador; estas reglas siguen siendo el
respaldo para los modelos Groq que no soportan salida estructurada."""


# ==========================================================================
# SYSTEM PROMPT COMPLETO (referencia y auditoria)
# ==========================================================================
# Incluye el JSON Schema derivado de Pydantic. Sirve para dejar constancia
# exacta del contrato en la documentacion de la prueba y para depurar casos
# dificiles. NO es el que se usa en la corrida masiva: ver la version compacta
# y la entrada v6 de la BITACORA.

SYSTEM_PROMPT = f"""{CONTEXTO_DOMINIO}

{REGLA_ROLES}

{REGLA_ANONIMIZACION}

{EXIGENCIA_EVIDENCIA}

{REGLA_ACUERDO}

{RUBRICA_SATISFACCION}

ESQUEMA DE SALIDA (JSON Schema completo)
========================================
{json.dumps(ConversacionIA.model_json_schema(), ensure_ascii=False, indent=1)}

{FORMATO_SALIDA}"""


# ==========================================================================
# SYSTEM PROMPT COMPACTO (produccion)
# ==========================================================================
# Mismas reglas de decision, sin el JSON Schema verboso. Ver BITACORA v6 para
# la justificacion cuantificada del ahorro.

SYSTEM_PROMPT_COMPACTO = f"""{CONTEXTO_DOMINIO}

{REGLA_ROLES}

{REGLA_ANONIMIZACION}

{EXIGENCIA_EVIDENCIA}

{REGLA_ACUERDO}

{RUBRICA_SATISFACCION}

ESQUEMA DE SALIDA
=================
Devuelve exactamente esta estructura, con estos nombres de campo:

{esquema_compacto()}

{FORMATO_SALIDA}"""


# ==========================================================================
# EJEMPLOS FEW-SHOT
# ==========================================================================
# Tres ejemplos elegidos POR CONTRASTE, no por representatividad. Delimitan las
# tres fronteras que mas le cuestan al modelo:
#
#   A) acuerdo real + buena experiencia -> ensena a reconocer el compromiso
#      explicito con fecha, a separar oferta de argumento, y a calificar alto
#      una conversacion que fluye.
#
#   B) bucle de bot + abandono, sin ningun AGENTE -> ensena que ofertas y
#      argumentos van vacios cuando no hay asesor humano, que existe la cola
#      baja de la escala, y que un motivo sin evidencia se codifica NINGUNO.
#
#   C) varias ofertas y un argumento del AGENTE, pero el cliente cierra con una
#      referencia temporal vaga y sin compromiso -> ensena que muchas ofertas
#      pueden convivir con acuerdo_pago=false, y ejercita la franja media de la
#      rubrica (satisfaccion 3).
#
# Las transcripciones son SINTETICAS: reproducen los patrones observados en el
# corpus (mayusculas, marcadores, plantillas del bot, giros de los clientes)
# pero no son conversaciones reales del archivo. Se construyeron asi
# deliberadamente para no sesgar al modelo hacia casos concretos del dataset
# que despues se van a analizar.
#
# Las tres salidas se validan contra ConversacionIA al importar este modulo.

_TRANSCRIPCION_A = """\
[HSM] TU CREDITO SIEMPRE PROTEGIDO. TE RECORDAMOS QUE TU OBLIGACION CON BANCO_000001 PRESENTA UN SALDO PENDIENTE.
[USUARIO] HABLAR CON ASESOR
[BOT] AL CONTINUAR NOS AUTORIZAS A QUE TUS DATOS SEAN TRATADOS CONFORME A LA LEY 1581 DE PROTECCION DE DATOS.
[BOT] HOLA, MI NOMBRE ES PERSONA_00000109, SOY ASESOR DEL BANCO_000001. POR FAVOR INDICAME LA FECHA DE EXPEDICION DE TU DOCUMENTO.
[USUARIO] FECHA_00000172
[AGENTE] GRACIAS POR CONFIRMAR TUS DATOS. CUENTAME EN QUE TE PUEDO AYUDAR?
[USUARIO] BUENAS TARDES, ES QUE ME ATRASE CON DOS CUOTAS. ESTE MES ME BAJARON LAS VENTAS DEL NEGOCIO Y NO ME ALCANZO
[AGENTE] ENTIENDO TU SITUACION. HAY ALGUNA RAZON PUNTUAL POR LA QUE NO SE PUDO REALIZAR EL PAGO?
[USUARIO] SI, SOY INDEPENDIENTE Y ESTE MES ENTRO MUY POCO
[AGENTE] TRANQUILO. PODEMOS DIFERIR EL SALDO EN MORA HASTA A 12 CUOTAS PARA QUE LA MENSUALIDAD TE QUEDE MAS COMODA
[AGENTE] TAMBIEN PUEDES REALIZAR UN ABONO PARCIAL AHORA Y EL RESTO EN LA SIGUIENTE FACTURACION
[USUARIO] Y ESO QUE IMPLICA
[AGENTE] AL NORMALIZAR EVITAS QUE LA OBLIGACION SEA REPORTADA A LAS CENTRALES DE RIESGO Y DEJAS DE GENERAR INTERESES DE MORA
[USUARIO] BUENO, LA VERDAD ME SIRVE. EL 25 DE PERSONA_00000108 HAGO EL PAGO DE 350 MIL, APENAS ME PAGUEN UNOS PEDIDOS
[AGENTE] PERFECTO, QUEDA REGISTRADO EL COMPROMISO. TE ENVIO EL LINK DE PAGO POR ESTE MEDIO
[AGENTE] URL_ANONIMIZADA
[USUARIO] LISTO MUCHAS GRACIAS POR LA COLABORACION
[AGENTE] HAY ALGO MAS EN LO QUE TE PUEDA COLABORAR?
[USUARIO] NO ESO ES TODO, GRACIAS
[BOT] MUCHAS GRACIAS POR TU TIEMPO. SOMOS EL BANCO QUE ESTA DEL LADO DE LOS QUE HACEN."""

_SALIDA_A = {
    "analisis_previo": (
        "Roles presentes: HSM, USUARIO, BOT y AGENTE; hay lineas [AGENTE], asi que "
        "ofertas_asesor y argumentos_asesor pueden poblarse. El BOT se presenta como "
        "asesor humano, pero solo cuenta la etiqueta de rol. Frase del [USUARIO] para "
        "el motivo: 'SOY INDEPENDIENTE Y ESTE MES ENTRO MUY POCO'. Fecha: 'EL 25 DE "
        "PERSONA_00000108' es dia 25 + mes anonimizado, o sea FECHA_ESPECIFICA, y el "
        "cliente afirma 'HAGO EL PAGO DE 350 MIL'. Cierre con agradecimiento, sin friccion."
    ),
    "resumen": (
        "El cliente contacta tras un mensaje de cobro y explica que se atraso con dos "
        "cuotas porque es independiente y le bajaron las ventas del negocio. El asesor "
        "indaga por el motivo y le ofrece diferir el saldo en mora hasta 12 cuotas o "
        "hacer un abono parcial, argumentando que asi evita el reporte a centrales de "
        "riesgo y deja de generar intereses de mora. El cliente acepta y se compromete "
        "a pagar 350 mil el dia 25, y la conversacion cierra con agradecimiento."
    ),
    "evidencia_motivo": "SOY INDEPENDIENTE Y ESTE MES ENTRO MUY POCO",
    "motivo_no_pago": "NEGOCIO_O_INGRESO_VARIABLE",
    "motivos_secundarios": ["INGRESOS_INSUFICIENTES"],
    "cliente_reconoce_deuda": True,
    "asesor_pregunta_por_motivo": True,
    "ofertas_asesor": [
        {
            "tipo": "PLAN_PAGO_DIFERIDO",
            "evidencia": "PODEMOS DIFERIR EL SALDO EN MORA HASTA A 12 CUOTAS PARA QUE LA MENSUALIDAD TE QUEDE MAS COMODA",
        },
        {
            "tipo": "PAGO_MINIMO_O_ABONO_PARCIAL",
            "evidencia": "TAMBIEN PUEDES REALIZAR UN ABONO PARCIAL AHORA Y EL RESTO EN LA SIGUIENTE FACTURACION",
        },
        {
            "tipo": "CANAL_PAGO_FACILITADO",
            "evidencia": "TE ENVIO EL LINK DE PAGO POR ESTE MEDIO",
        },
    ],
    "argumentos_asesor": [
        {
            "tipo": "EVITAR_REPORTE_CENTRALES",
            "evidencia": "AL NORMALIZAR EVITAS QUE LA OBLIGACION SEA REPORTADA A LAS CENTRALES DE RIESGO",
        },
        {
            "tipo": "AHORRO_INTERESES_MORA",
            "evidencia": "DEJAS DE GENERAR INTERESES DE MORA",
        },
    ],
    "fecha_compromiso_texto": "EL 25 DE PERSONA_00000108",
    "tipo_fecha": "FECHA_ESPECIFICA",
    "monto_comprometido_texto": "350 MIL",
    "acuerdo_evidencia": "EL 25 DE PERSONA_00000108 HAGO EL PAGO DE 350 MIL",
    "acuerdo_pago": True,
    "justificacion_satisfaccion": (
        "No es 4 sino 5 porque el asesor indago por el motivo antes de ofrecer, dio dos "
        "alternativas concretas al caso del cliente sin recurrir a plantillas, no hubo "
        "repeticion de datos y el cliente cerro agradeciendo la colaboracion."
    ),
    "factores_insatisfaccion": [],
    "satisfaccion_llm": 5,
    "sentimiento_inicial": "NEUTRO",
    "sentimiento_final": "POSITIVO",
    "hubo_friccion_bot": False,
    "conversacion_abandonada": False,
    "recomendacion_mejora": (
        "Programar un recordatorio automatico uno o dos dias antes del 25 para asegurar "
        "el cumplimiento del compromiso, dado que el cliente lo condiciono al cobro de "
        "unos pedidos."
    ),
}


_TRANSCRIPCION_B = """\
[HSM] PONTE AL DIA CON TU OBLIGACION. INGRESA AL SIGUIENTE ENLACE URL_ANONIMIZADA
[USUARIO] BUENOS DIAS NECESITO HABLAR CON UN ASESOR
[BOT] AL CONTINUAR NOS AUTORIZAS A QUE TUS DATOS SEAN TRATADOS CONFORME A LA LEY 1581 DE PROTECCION DE DATOS.
[BOT] PARA CONTINUAR POR FAVOR INDICANOS TU NUMERO DE DOCUMENTO
[USUARIO] DOCUMENTO_00000044
[BOT] NO LOGRAMOS VALIDAR TU INFORMACION. PARA CONTINUAR POR FAVOR INDICANOS TU NUMERO DE DOCUMENTO
[USUARIO] DOCUMENTO_00000044
[BOT] NO LOGRAMOS VALIDAR TU INFORMACION. PARA CONTINUAR POR FAVOR INDICANOS TU NUMERO DE DOCUMENTO
[USUARIO] YA SE LOS MANDE DOS VECES
[BOT] NO LOGRAMOS VALIDAR TU INFORMACION. PARA CONTINUAR POR FAVOR INDICANOS TU NUMERO DE DOCUMENTO
[USUARIO] NECESITO HABLAR CON UNA PERSONA NO CON UNA MAQUINA
[BOT] ESTAMOS VALIDANDO TU INFORMACION. EN UN MOMENTO, UNO DE NUESTROS ASESORES TE AYUDARA A ENCONTRAR LA MEJOR ALTERNATIVA PARA QUE ESTES AL DIA CON TUS OBLIGACIONES
[USUARIO] SIGO ESPERANDO
[USUARIO] HAY ALGUIEN AHI
[BOT] ESTAMOS VALIDANDO TU INFORMACION. EN UN MOMENTO, UNO DE NUESTROS ASESORES TE AYUDARA A ENCONTRAR LA MEJOR ALTERNATIVA PARA QUE ESTES AL DIA CON TUS OBLIGACIONES
[USUARIO] QUE MAL SERVICIO, LLEVO MEDIA HORA
[BOT] EN UNA ESCALA DEL 0 AL 10, QUE TAN PROBABLE ES QUE RECOMIENDES NUESTRO SERVICIO?
[USUARIO] 0"""

_SALIDA_B = {
    "analisis_previo": (
        "Roles presentes: HSM, USUARIO y BOT. NO hay ninguna linea [AGENTE], por lo que "
        "ofertas_asesor y argumentos_asesor van vacios. El BOT repite identico el mensaje "
        "de validacion de documento cuatro veces (bucle) y dos veces la plantilla de "
        "espera. El cliente pide un asesor humano y nunca lo atienden. Ningun mensaje del "
        "[USUARIO] expone un motivo de no pago, asi que evidencia_motivo es null y "
        "motivo_no_pago NINGUNO. Cierra quejandose ('QUE MAL SERVICIO') y calificando 0."
    ),
    "resumen": (
        "El cliente solicita hablar con un asesor y el bot le pide el numero de documento "
        "cuatro veces seguidas con el mismo texto de error, pese a que el cliente lo envia "
        "y advierte que ya lo mando dos veces. Luego el bot responde dos veces con la misma "
        "plantilla de espera. Nunca interviene un asesor humano y la conversacion termina "
        "con el cliente quejandose del servicio y calificando con 0 la encuesta."
    ),
    "evidencia_motivo": None,
    "motivo_no_pago": "NINGUNO",
    "motivos_secundarios": [],
    "cliente_reconoce_deuda": None,
    "asesor_pregunta_por_motivo": False,
    "ofertas_asesor": [],
    "argumentos_asesor": [],
    "fecha_compromiso_texto": None,
    "tipo_fecha": "SIN_FECHA",
    "monto_comprometido_texto": None,
    "acuerdo_evidencia": None,
    "acuerdo_pago": False,
    "justificacion_satisfaccion": (
        "No es 2 sino 1 porque concurren las tres conductas del nivel mas bajo: el cliente "
        "pide expresamente un asesor y nunca lo atiende un AGENTE, el bot repite identico "
        "el mismo mensaje de error cuatro veces, y el cliente cierra quejandose del servicio."
    ),
    "factores_insatisfaccion": [
        "BUCLE_BOT",
        "SIN_RESPUESTA_HUMANA",
        "SOLICITUD_REPETIDA_DE_DATOS",
        "NO_RESOLVIO_SOLICITUD",
    ],
    "satisfaccion_llm": 1,
    "sentimiento_inicial": "NEUTRO",
    "sentimiento_final": "MUY_NEGATIVO",
    "hubo_friccion_bot": True,
    "conversacion_abandonada": True,
    "recomendacion_mejora": (
        "Escalar automaticamente a un asesor humano tras el segundo fallo de validacion de "
        "documento, en lugar de repetir el mismo mensaje de error de forma indefinida."
    ),
}


_TRANSCRIPCION_C = """\
[HSM] TE RECORDAMOS QUE TU CREDITO DE LIBRANZA CON BANCO_000001 REGISTRA UNA CUOTA PENDIENTE.
[USUARIO] BUENAS. A MI LA CUOTA ME LA DESCUENTAN POR LIBRANZA DIRECTAMENTE DE LA NOMINA, NO ENTIENDO POR QUE ME APARECE EN MORA
[BOT] AL CONTINUAR NOS AUTORIZAS A QUE TUS DATOS SEAN TRATADOS CONFORME A LA LEY 1581 DE PROTECCION DE DATOS.
[BOT] PARA CONTINUAR INDICANOS LA FECHA DE EXPEDICION DE TU DOCUMENTO
[USUARIO] FECHA_00000090
[BOT] PARA CONTINUAR INDICANOS LA FECHA DE EXPEDICION DE TU DOCUMENTO
[USUARIO] FECHA_00000090
[AGENTE] GRACIAS. VEO QUE EL DESCUENTO DE LIBRANZA DE ESTE PERIODO NO FUE REPORTADO POR TU PAGADURIA, POR ESO FIGURA LA MORA
[USUARIO] Y YO QUE TENGO QUE HACER SI ESO LO MANEJA LA EMPRESA DONDE TRABAJO
[AGENTE] MIENTRAS LA PAGADURIA REGULARIZA EL ENVIO PODEMOS DIFERIR ESA CUOTA A 6 MESES PARA QUE NO SIGA GENERANDO MORA
[AGENTE] TAMBIEN TIENES UN DESCUENTO DEL 50 POR CIENTO SOBRE LOS INTERESES DE MORA SI NORMALIZAS ESTA SEMANA
[AGENTE] NORMALIZAR AHORA EVITA QUE LA OBLIGACION SEA REPORTADA A CENTRALES DE RIESGO
[USUARIO] LO VOY A PENSAR, APENAS ME PAGUEN LA QUINCENA MIRO SI ABONO ALGO
[AGENTE] DE ACUERDO. TE DEJO EL CASO ANOTADO Y PUEDES ESCRIBIRNOS CUANDO LO DEFINAS
[USUARIO] LISTO
[BOT] GRACIAS POR COMUNICARTE CON BANCO_000001."""

_SALIDA_C = {
    "analisis_previo": (
        "Roles presentes: HSM, USUARIO, BOT y AGENTE; hay lineas [AGENTE], asi que "
        "ofertas y argumentos pueden poblarse. Motivo, frase del [USUARIO]: 'ME LA "
        "DESCUENTAN POR LIBRANZA DIRECTAMENTE DE LA NOMINA, NO ENTIENDO POR QUE ME "
        "APARECE EN MORA' -> descuento de nomina no aplicado; no afirma ni niega deber "
        "-> null. Cierre: 'APENAS ME PAGUEN LA QUINCENA MIRO SI ABONO ALGO', sin dia y "
        "sin compromiso -> FECHA_VAGA, sin acuerdo. El bot repitio la solicitud de fecha "
        "del documento -> friccion menor."
    ),
    "resumen": (
        "El cliente, con un credito de libranza, escribe porque su cuota se descuenta por "
        "nomina y aun asi figura en mora. Tras la validacion de identidad, en la que el bot "
        "le pide dos veces la fecha de expedicion del documento, el asesor le explica que la "
        "pagaduria no reporto el descuento del periodo y le ofrece diferir la cuota a 6 "
        "meses o normalizar esta semana con un 50 por ciento de descuento en intereses de "
        "mora, argumentando que asi evita el reporte a centrales. El cliente responde que lo "
        "pensara cuando le paguen la quincena y la conversacion cierra sin compromiso."
    ),
    "evidencia_motivo": "ME LA DESCUENTAN POR LIBRANZA DIRECTAMENTE DE LA NOMINA, NO ENTIENDO POR QUE ME APARECE EN MORA",
    "motivo_no_pago": "DESCUENTO_NOMINA_NO_APLICADO",
    "motivos_secundarios": [],
    "cliente_reconoce_deuda": None,
    "asesor_pregunta_por_motivo": False,
    "ofertas_asesor": [
        {
            "tipo": "PLAN_PAGO_DIFERIDO",
            "evidencia": "PODEMOS DIFERIR ESA CUOTA A 6 MESES PARA QUE NO SIGA GENERANDO MORA",
        },
        {
            "tipo": "DESCUENTO_O_CONDONACION",
            "evidencia": "TAMBIEN TIENES UN DESCUENTO DEL 50 POR CIENTO SOBRE LOS INTERESES DE MORA SI NORMALIZAS ESTA SEMANA",
        },
    ],
    "argumentos_asesor": [
        {
            "tipo": "EVITAR_REPORTE_CENTRALES",
            "evidencia": "NORMALIZAR AHORA EVITA QUE LA OBLIGACION SEA REPORTADA A CENTRALES DE RIESGO",
        },
    ],
    "fecha_compromiso_texto": None,
    "tipo_fecha": "FECHA_VAGA",
    "monto_comprometido_texto": None,
    "acuerdo_evidencia": None,
    "acuerdo_pago": False,
    "justificacion_satisfaccion": (
        "No es 4 sino 3 porque el tramite fue correcto pero por guion y el bot repitio la "
        "solicitud de la fecha de expedicion del documento; no es 2 porque el cliente no "
        "expreso inconformidad y su pregunta sobre que hacer fue respondida con alternativas."
    ),
    "factores_insatisfaccion": ["SOLICITUD_REPETIDA_DE_DATOS"],
    "satisfaccion_llm": 3,
    "sentimiento_inicial": "NEUTRO",
    "sentimiento_final": "NEUTRO",
    "hubo_friccion_bot": True,
    "conversacion_abandonada": False,
    "recomendacion_mejora": (
        "Cuando el cliente reporta un descuento de libranza no aplicado, abrir de una vez un "
        "caso de conciliacion con la pagaduria en lugar de ofrecer solo diferir o "
        "normalizar, que trasladan al cliente el sobrecosto de una falla que no es suya."
    ),
}


FEW_SHOT = [
    {
        "nombre": "A_acuerdo_y_buena_experiencia",
        "proposito": (
            "Frontera positiva: compromiso explicito con fecha especifica bajo "
            "marcador de mes anonimizado, separacion de oferta y argumento, y "
            "calificacion alta en una conversacion sin friccion."
        ),
        "transcripcion": _TRANSCRIPCION_A,
        "salida": _SALIDA_A,
    },
    {
        "nombre": "B_bucle_de_bot_y_abandono",
        "proposito": (
            "Frontera negativa: sin rol AGENTE en toda la conversacion, luego "
            "ofertas y argumentos vacios; motivo sin evidencia codificado como "
            "NINGUNO; uso efectivo de la cola baja de la rubrica."
        ),
        "transcripcion": _TRANSCRIPCION_B,
        "salida": _SALIDA_B,
    },
    {
        "nombre": "C_ofertas_sin_acuerdo",
        "proposito": (
            "Frontera media, la mas frecuente: hay [AGENTE] con dos ofertas y un "
            "argumento, pero el cliente responde con una referencia temporal vaga y "
            "sin compromiso -> FECHA_VAGA y acuerdo_pago false. Motivo "
            "DESCUENTO_NOMINA_NO_APLICADO, no cubierto por A ni B. Friccion menor del "
            "bot -> franja media de la rubrica (3)."
        ),
        "transcripcion": _TRANSCRIPCION_C,
        "salida": _SALIDA_C,
    },
]


# ==========================================================================
# VALIDACION DE LOS EJEMPLOS AL IMPORTAR
# ==========================================================================
# Un ejemplo few-shot que no cumple el contrato es peor que no tener ejemplos:
# le ensena al modelo a violarlo. Por eso la comprobacion corre en el import y
# no en un test aparte que se pueda olvidar de ejecutar.

def validar_few_shot() -> list[ConversacionIA]:
    """Valida cada ejemplo contra ConversacionIA. Lanza excepcion si alguno falla."""
    validados = []
    for ej in FEW_SHOT:
        try:
            validados.append(ConversacionIA.model_validate(ej["salida"]))
        except Exception as exc:
            raise ValueError(
                f"El ejemplo few-shot '{ej['nombre']}' NO cumple el contrato de "
                f"esquema.ConversacionIA:\n{exc}"
            ) from exc
    return validados


def verificar_citas_literales() -> list[str]:
    """Comprueba que cada evidencia de los ejemplos aparezca en su transcripcion.

    Es la contraparte ejecutable de EXIGENCIA_EVIDENCIA: si el propio ejemplo
    citara de forma aproximada, estaria ensenando al modelo a parafrasear.
    Devuelve la lista de incumplimientos, vacia si todo esta bien.
    """
    problemas = []
    for ej in FEW_SHOT:
        texto = ej["transcripcion"]
        citas = []
        for campo in ("evidencia_motivo", "acuerdo_evidencia"):
            if ej["salida"].get(campo):
                citas.append((campo, ej["salida"][campo]))
        for lista in ("ofertas_asesor", "argumentos_asesor"):
            for i, item in enumerate(ej["salida"].get(lista, [])):
                citas.append((f"{lista}[{i}]", item["evidencia"]))
        for campo, cita in citas:
            if cita not in texto:
                problemas.append(f"{ej['nombre']} -> {campo}: cita no literal: {cita!r}")
    return problemas


_EJEMPLOS_VALIDADOS = validar_few_shot()
_PROBLEMAS_CITAS = verificar_citas_literales()
if _PROBLEMAS_CITAS:
    raise ValueError(
        "Hay evidencias en los ejemplos few-shot que no aparecen literalmente en su "
        "transcripcion:\n  " + "\n  ".join(_PROBLEMAS_CITAS)
    )


# ==========================================================================
# ENSAMBLADO DE MENSAJES PARA LA API
# ==========================================================================

PLANTILLA_USUARIO = """\
Analiza la siguiente conversacion de cobranza y devuelve el JSON con las variables.

TRANSCRIPCION
=============
{transcripcion}

Devuelve unicamente el objeto JSON."""


def construir_mensajes(transcripcion: str, compacto: bool = True,
                       con_few_shot: bool = True) -> list[dict]:
    """Arma la lista de mensajes para la API de chat.

    Los ejemplos se inyectan como turnos user/assistant y no dentro del system
    prompt. Es la forma que mejor aprovecha el formato conversacional: el modelo
    ve el patron "asi se ve la entrada, asi se responde" en lugar de leer un
    ejemplo descrito en prosa.

    Parametros
    ----------
    transcripcion : texto ya armado con formato "[ROL] mensaje" por linea.
    compacto      : True usa SYSTEM_PROMPT_COMPACTO (produccion, ver BITACORA v6).
                    False usa SYSTEM_PROMPT con el JSON Schema completo.
    con_few_shot  : incluir los tres ejemplos por contraste.

    El response_format para la llamada se obtiene aparte con formato_respuesta().
    """
    mensajes = [
        {"role": "system", "content": SYSTEM_PROMPT_COMPACTO if compacto else SYSTEM_PROMPT}
    ]
    if con_few_shot:
        for ej in FEW_SHOT:
            mensajes.append({
                "role": "user",
                "content": PLANTILLA_USUARIO.format(transcripcion=ej["transcripcion"]),
            })
            mensajes.append({
                "role": "assistant",
                "content": json.dumps(ej["salida"], ensure_ascii=False),
            })
    mensajes.append({
        "role": "user",
        "content": PLANTILLA_USUARIO.format(transcripcion=transcripcion),
    })
    return mensajes


def mensaje_de_reintento(error: str) -> dict:
    """Turno de usuario que devuelve al modelo su propio error de validacion.

    Reintentar con el mismo prompt tiende a reproducir el mismo fallo. Mostrarle
    la restriccion incumplida convierte el reintento en una correccion dirigida.
    Los mensajes de error de esquema.py estan redactados para ser leidos aqui.
    """
    return {
        "role": "user",
        "content": (
            "Tu respuesta anterior no cumplio el contrato de salida. Errores:\n\n"
            f"{error}\n\n"
            "Corrige UNICAMENTE lo senalado, respetando el resto de tu analisis, y "
            "devuelve de nuevo el objeto JSON completo. Sin texto adicional."
        ),
    }


# ==========================================================================
# STRUCTURED OUTPUTS (formato OpenAI / Mistral)
# ==========================================================================
# El proveedor puede forzar la forma de la respuesta con response_format. En los
# modelos que lo soportan (Mistral instruct, gpt-oss, kimi-k2, llama-4) conviene
# json_schema, que ademas restringe las taxonomias a sus valores validos; en el
# resto, json_object garantiza JSON valido pero no el contrato. FORMATO_SALIDA en
# el prompt queda como respaldo en cualquier caso.

def formato_respuesta(estructurado: bool = True) -> dict:
    """Devuelve el bloque response_format para la llamada (formato OpenAI/Mistral).

    estructurado=True  -> {"type": "json_schema", ...} con el esquema estricto.
                          Solo en modelos que soportan structured outputs.
    estructurado=False -> {"type": "json_object"}: JSON valido de forma libre,
                          compatible con todos los modelos.
    """
    if estructurado:
        return {"type": "json_schema", "json_schema": esquema_json_estricto()}
    return {"type": "json_object"}


# ==========================================================================
# PARAMETROS DE EXTRACCION Y AUTOCONSISTENCIA (pregunta e)
# ==========================================================================
# El ranking de "las 5 conversaciones peor calificadas" depende de
# satisfaccion_llm y es sensible a la varianza de una sola llamada. Para ESE
# campo, y solo ese, el notebook toma varias muestras y se queda con la mediana.
# El resto de la extraccion se corre una vez a temperatura 0.

MAX_REINTENTOS = 2

PARAMS_EXTRACCION = {
    "temperature": 0.0,
    "top_p": 1.0,
    "max_tokens": 2000,   # con analisis_previo la salida crece; Mistral (TPM 500k) no obliga a recortarlo
}

K_AUTOCONSISTENCIA = 3
TEMP_AUTOCONSISTENCIA = 0.4


def mediana_entera(valores: list[int]) -> int:
    """Mediana redondeada a entero. Con un numero impar de valores es el central."""
    if not valores:
        raise ValueError("mediana_entera() requiere al menos un valor")
    ordenados = sorted(valores)
    n = len(ordenados)
    if n % 2 == 1:
        return ordenados[n // 2]
    return round((ordenados[n // 2 - 1] + ordenados[n // 2]) / 2)


def consolidar_satisfaccion(muestras: list[dict]) -> dict:
    """Combina k salidas del mismo caso para estabilizar satisfaccion_llm.

    Recibe las k respuestas ya parseadas (misma conversacion, k llamadas a
    temperatura TEMP_AUTOCONSISTENCIA) y devuelve:

        {"satisfaccion_llm": <mediana entera>,
         "dispersion":       <max - min de las k notas>,
         "muestras":         [<las k notas>]}

    El notebook sustituye satisfaccion_llm en la salida base -la corrida a
    temperatura 0- por esta mediana y RE-VALIDA con ConversacionIA; si la
    mediana rompe una regla de coherencia (p. ej. baja a 2 sin factores),
    conserva la nota de la corrida base. 'dispersion' marca los casos
    inestables que conviene revisar a mano.
    """
    if not muestras:
        raise ValueError("consolidar_satisfaccion() requiere al menos una muestra")
    notas = [int(m["satisfaccion_llm"]) for m in muestras]
    return {
        "satisfaccion_llm": mediana_entera(notas),
        "dispersion": max(notas) - min(notas),
        "muestras": notas,
    }


__all__ = [
    "BITACORA",
    "CONTEXTO_DOMINIO",
    "REGLA_ROLES",
    "REGLA_ANONIMIZACION",
    "MARCADORES_DECODIFICADOS",
    "EXIGENCIA_EVIDENCIA",
    "REGLA_ACUERDO",
    "RUBRICA_SATISFACCION",
    "FORMATO_SALIDA",
    "SYSTEM_PROMPT",
    "SYSTEM_PROMPT_COMPACTO",
    "FEW_SHOT",
    "PLANTILLA_USUARIO",
    "construir_mensajes",
    "mensaje_de_reintento",
    "formato_respuesta",
    "MAX_REINTENTOS",
    "PARAMS_EXTRACCION",
    "K_AUTOCONSISTENCIA",
    "TEMP_AUTOCONSISTENCIA",
    "mediana_entera",
    "consolidar_satisfaccion",
    "validar_few_shot",
    "verificar_citas_literales",
]


if __name__ == "__main__":
    print("Ejemplos few-shot validados contra el esquema:", len(_EJEMPLOS_VALIDADOS))
    print("Evidencias no literales encontradas:", len(_PROBLEMAS_CITAS))
    print()
    for nombre, txt in [
        ("SYSTEM_PROMPT (completo)", SYSTEM_PROMPT),
        ("SYSTEM_PROMPT_COMPACTO", SYSTEM_PROMPT_COMPACTO),
    ]:
        print(f"{nombre:<28} {len(txt):>7,} caracteres  (~{len(txt)//4:>6,} tokens)")
    fs = sum(
        len(PLANTILLA_USUARIO.format(transcripcion=e["transcripcion"]))
        + len(json.dumps(e["salida"], ensure_ascii=False))
        for e in FEW_SHOT
    )
    print(f"{'Few-shot (3 ejemplos)':<28} {fs:>7,} caracteres  (~{fs//4:>6,} tokens)")
    fijo = len(SYSTEM_PROMPT_COMPACTO) + fs
    print()
    print(f"Prompt fijo de produccion: ~{fijo//4:,} tokens por llamada")
    print(f"En 1.197 llamadas:         ~{fijo//4*1197:,} tokens de entrada solo de prompt fijo")
