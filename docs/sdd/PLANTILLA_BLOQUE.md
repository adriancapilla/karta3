# Bloque XX — [nombre]

**Estado:** propuesto | acordado | implementado | verificado  
**Fecha y responsable del acuerdo:** [fecha; persona]  
**Referencias:** [documento y sección, con enlace si es accesible]

## Objetivo

[Qué resultado concreto buscamos y por qué aporta valor al MVP o a su preparación.]

## Alcance

- **Incluye:** [comportamiento que se entrega en este bloque].
- **Queda fuera:** [comportamiento cercano que tendrá otro bloque; no implica excluirlo del MVP].
- **Estado de las decisiones:** [qué está confirmado, qué se propone aquí y qué es intención futura].

## Recorrido y comportamiento

[Qué ve y hace cada persona, qué conserva el servidor, qué sucede al repetir, recargar, fallar o cerrar. Referenciar las reglas generales sin copiarlas enteras.]

## Contrato mínimo para implementar

[Operaciones necesarias, entradas, resultados, permisos, errores y estados. Fijar lo necesario para que otra conversación programe sin rediseñar el comportamiento; dejarle los detalles internos compatibles con la arquitectura.]

## Ejemplos

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| E1 | [estado] | [acción] | [resultado] |
| E2 | [estado límite o inválido] | [acción] | [resultado] |

## Criterios de aceptación

- [ ] [Condición observable y comprobable, con caso válido].
- [ ] [Condición observable y comprobable, con límite o rechazo].
- [ ] [Comprobación de que no se altera una regla o estado relacionado, si aplica].

## Dependencias

[Qué debe existir o resolverse antes de implementar; qué puede esperar. Señalar otros bloques sin ampliar este.]

## Preguntas y decisiones

| Pregunta | Respuesta acordada y fecha | Fuente que necesita alineación, si aplica |
|---|---|---|
| [pregunta concreta] | [respuesta fechada] | [documento o «ninguna»] |

Antes de marcar el bloque como acordado, no deben quedar preguntas abiertas que cambien su comportamiento, alcance o aceptación. Anotar aparte las decisiones menores que puede tomar el implementador sin pedir otra definición funcional.

## Cambios de alcance o reglas

| Fecha | Motivo y decisión | Criterios y fuentes afectados |
|---|---|---|
| — | Sin cambios registrados | — |

## Comprobación y cierre

**Cambio de código:** [commit o PR; pendiente si todavía no existe].  
**Pruebas ejecutadas:** [fecha, entorno, comando o recorrido, resultado; no escribir «superadas» antes de ejecutarlas].  
**Límites y siguiente bloque:** [si existen].  
**Fecha de verificación:** [solo al cumplir los criterios].
