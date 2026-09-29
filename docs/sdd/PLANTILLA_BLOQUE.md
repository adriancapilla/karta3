# Bloque XX — [nombre]

**Estado:** propuesto | acordado | implementado | verificado  
**Fecha y responsable del acuerdo:** [fecha; persona]  
**Tipo y punto de partida:** [funcional o técnico; commit y cambios locales relevantes si existe implementación]

**Referencias:** [documento y sección, con enlace si es accesible]

[Consultar AGENTS.md y docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md. Citar qué decisiones gobiernan este bloque antes de plantear preguntas.]

## Objetivo

[Qué resultado concreto buscamos y por qué aporta valor al MVP o a su preparación.]

## Alcance

- **Incluye:** [comportamiento que se entrega en este bloque].
- **Queda fuera:** [comportamiento cercano que tendrá otro bloque; no implica excluirlo del MVP].
- **Estado de las decisiones:** [qué está confirmado, qué se propone aquí y qué es intención futura].
- **Comportamiento y contratos conservados:** [criterios de bloques anteriores, rutas, datos y errores que deben permanecer; especialmente en un bloque técnico].

## Recorrido y comportamiento

[Qué ve y hace cada persona, qué conserva el servidor, qué sucede al repetir, recargar, fallar o cerrar. Referenciar las reglas generales sin copiarlas enteras.]

## Contrato mínimo para implementar

[Operaciones necesarias, entradas, resultados, permisos, errores y estados. Fijar lo necesario para que otra conversación programe sin rediseñar el comportamiento; dejarle los detalles internos compatibles con la arquitectura.]

## Responsabilidades y dependencias

| Responsabilidad del bloque | Capa o módulo responsable | Dependencias permitidas y prohibidas | Cómo se comprueba |
|---|---|---|---|
| [regla o transición] | [dominio o modelo de aplicación, según la fuente] | [datos y tipos puros; sin transporte ni almacenamiento] | [prueba pura y revisión de importaciones] |
| [coordinación, permiso o vista] | [caso de uso de aplicación] | [modelo y puertos de aplicación; sin adaptadores concretos] | [pruebas con puertos sustitutos] |
| [capacidad externa, transporte y construcción] | [puerto, adaptador y composición que lo conecta] | [dirección de dependencia concreta] | [integración y comprobación de límites] |
| [presentación o intercambio] | [cliente y shared/contracts] | [sin importar server ni transmitir estado interno] | [contrato y recorrido de navegador] |

[Eliminar filas sin trabajo real e indicar qué capas no se afectan. Especificar solo los puertos necesarios, qué datos cruzan cada límite y quién conserva la atomicidad, identidad o estado si aplica. No basta enumerar carpetas.]

## Ejemplos

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| E1 | [estado] | [acción] | [resultado] |
| E2 | [estado límite o inválido] | [acción] | [resultado] |

## Criterios de aceptación

- [ ] [Condición observable y comprobable, con caso válido].
- [ ] [Condición observable y comprobable, con límite o rechazo].
- [ ] [Comprobación de que no se altera una regla o estado relacionado, si aplica].
- [ ] [Responsabilidades separadas y dependencias permitidas comprobadas; sin ciclos ni importaciones internas desde el cliente].

## Dependencias

[Qué debe existir o resolverse antes de implementar; qué puede esperar. Señalar otros bloques sin ampliar este.]

## Preguntas y decisiones

| Pregunta | Respuesta acordada y fecha | Fuente que necesita alineación, si aplica |
|---|---|---|
| [pregunta concreta] | [respuesta fechada] | [documento o «ninguna»] |

Antes de marcar el bloque como acordado, no deben quedar preguntas abiertas que cambien su comportamiento, alcance o aceptación. Anotar aparte las decisiones menores que puede tomar el implementador sin pedir otra definición funcional.

**Autonomía del implementador:** [nombres, estructura local, funciones o clases y otras elecciones compatibles; señalar qué cambio exigiría volver al autor o al hilo de arquitectura].

## Plan de verificación

[Nombrar las pruebas existentes que deben conservarse, las nuevas comprobaciones necesarias y su relación con los criterios. En refactorizaciones se puede adaptar el montaje o ubicación de las pruebas, sin reducir las garantías.]

- `npm run check` y [pruebas de navegador pertinentes, con requisitos de ejecución].
- [Pruebas por capa, revisión de contratos públicos e información que se envía].
- [Comprobación de importaciones y ciclos; mecanismo automático disponible o que debe añadirse, y revisión semántica de responsabilidades].

Este plan describe verificaciones futuras. Las ejecuciones y resultados se registran en el cierre.

## Cambios de alcance o reglas

| Fecha | Motivo y decisión | Criterios y fuentes afectados |
|---|---|---|
| — | Sin cambios registrados | — |

## Comprobación y cierre

**Cambio de código:** [commit o PR; pendiente si todavía no existe].  
**Pruebas ejecutadas:** [fecha, entorno, comando o recorrido, resultado; no escribir «superadas» antes de ejecutarlas].  
**Comprobaciones arquitectónicas ejecutadas:** [método, resultado, dependencias revisadas y desviaciones; pendiente hasta realizarlas].

**Límites y siguiente bloque:** [si existen].  
**Fecha de verificación:** [solo al cumplir los criterios].
