# Trazabilidad NTS 188 - Odontograma V2

Fuente primaria: Ministerio de Salud del Perú, **NTS N.° 188-MINSA/DGIESP-2022**, aprobada mediante RM N.° 559-2022-MINSA. La copia oficial utilizada está en `documentos/NTS-188-MINSA-DGIESP-2022.pdf`.

## Reglas implementadas

| Regla de software | Hallazgo | Nomenclatura | Representación | Color | Referencia |
|---|---|---|---|---|---|
| `NTS188-5.4` | Numeración dentaria | Sistema Dígito Dos (FDI) | Validación de pieza | N/A | numeral 5.4, p. 14 |
| `NTS188-5.12-5.13` | Regla general de color | Buen estado/no patológico vs. patológico/temporal | Azul o rojo | Azul/rojo | numerales 5.12 y 5.13, p. 15 |
| `NTS188-5.15` | Hallazgo no contemplado | Observación | Texto en observaciones, no gráfico inventado | N/A | numeral 5.15, p. 15 |
| `NTS188-6.1.16` | Lesión de caries | MB, CE, CD, CDP | Pintado rojo según forma y ubicación observadas | Rojo | numeral 6.1.16, pp. 22-23 |
| `NTS188-6.1.20` | Pieza ausente | DNE, DEX, DAO | Aspa y sigla | Azul | numeral 6.1.20, p. 24 |

## Cobertura gráfica

El odontograma interactivo reproduce la organización del **Anexo: Gráfico del odontograma**: dentición permanente superior, dentición decidua superior, dentición decidua inferior y dentición permanente inferior, con numeración FDI, recuadros de especificación y piezas vectoriales diferenciadas por grupo dentario.

El catálogo gráfico contiene las 38 convenciones de los numerales 6.1.1 a 6.1.38. Cada renderer conserva la regla de color normativo (azul, rojo o dependiente del estado), la sigla correspondiente y la geometría indicada: líneas de arco, coronas, flechas, círculos, aspa, triángulo, restauraciones por superficie, conducto y demás marcas.

El registro manual permite seleccionar las 38 convenciones y solicita dinámicamente los datos estructurados aplicables: sigla normativa, estado, superficie y segunda pieza o extensión. Caries y pieza ausente mantienen sus validadores clínicos especializados; las demás reglas utilizan el validador estructural del catálogo gráfico.

Las abreviaturas de superficie O/M/D/V/P/L/C/I se usan únicamente como códigos internos de interfaz; la NTS revisada no las define como nomenclatura normativa. La representación clínica se conserva mediante la etiqueta completa y el renderer de superficie.

## Decisiones de seguridad normativa

- Una instrucción “ausente por extracción” no se transforma automáticamente en DEX: la norma limita DEX a extracción por experiencia de lesión de caries. Se solicita aclaración.
- El contexto puede heredar el tipo de hallazgo y la clasificación de caries, pero nunca una superficie omitida.
- Un hallazgo fuera de las reglas anteriores devuelve `REQUIERE_VALIDACION_ODONTOLOGICA` y puede registrarse como observación solo por decisión explícita del odontólogo.
- Los registros persistidos no pueden deshacerse desde la conversación. El comando deshacer actúa únicamente sobre `PENDING`.

## Pendientes normativos

La captura manual y por voz admite las 38 convenciones. El contrato de herramientas de voz utiliza las mismas claves del catálogo y envía al motor determinista la sigla, el estado, la superficie y la segunda pieza cuando corresponda. Si falta un campo obligatorio, el asistente solicita únicamente ese dato y no permite confirmar hasta completar la validación.

## Persistencia y privacidad

Los hallazgos clínicos V2 se aíslan en `odontogramaAiSessions`. La colección `odontograma` del flujo tradicional no se modifica. La telemetría se guarda por separado en `odontogramaAiMetrics` y no contiene nombre, documento ni identificador del paciente.

## Configuración para pruebas controladas

- `VITE_CONVERSATIONAL_ODONTOGRAM_ENABLED=true`: habilita la función.
- `VITE_CONVERSATIONAL_ODONTOGRAM_USERS=uid-1,uid-2`: limita el acceso a usuarios de prueba. En desarrollo, una lista vacía permite probar localmente; en producción la función permanece apagada salvo configuración explícita.
- `VITE_QUIRU_AI_MAX_SESSION_MINUTES` y `VITE_QUIRU_AI_INACTIVITY_SECONDS`: guardrails de sesión Live.
- `VITE_QUIRU_LIVE_COST_PER_MINUTE`, `VITE_QUIRU_INPUT_COST_PER_MILLION_TOKENS` y `VITE_QUIRU_OUTPUT_COST_PER_MILLION_TOKENS`: tarifas administradas para estimación. El código no inventa precios y devuelve `configured=false` si no se proporcionan.

La API Live de Firebase AI Logic está en Preview. Debe habilitarse solamente en un proyecto de prueba con App Check y reglas Firestore revisadas. El fragmento `documentos/firestore-quiru-ai.rules.example` no está enlazado ni desplegado automáticamente.
