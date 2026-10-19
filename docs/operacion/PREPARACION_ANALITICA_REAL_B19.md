# B19 — Preparación y puesta en servicio coordinadas en Pruebas

**19/10/2026. Estado:** procedimiento no aplicado. Leer [B19](../sdd/BLOQUE_19_HABILITACION_ANALITICA_REAL.md) y [operación B18](ANALITICA_USO.md). Coordinación conduce implementación/publicación/preparación y puesta en servicio como **una entrega B19** autorizada por el autor. La preparación independiente puede avanzar; actualizar la pila pública y activar HUMAN esperan la **única autorización final** del autor sobre commit/digest/texto/evidencias/plan exactos. SDD no ejecuta operaciones ni mensajes por este documento.

**Ámbito vigente:** HUMAN solo en **Pruebas**, con enlace público libre, sin contraseña/cuentas/sesiones cerradas ni audiencia exclusivamente adulta garantizada. Responsable **Adrián Capilla López**, contacto público `k3k314com@gmail.com`. Elección mínima en la app según B19 §§4.4–4.5; el autor ejecutará el guion final en su consola. No SSH delegado a los hilos. Conservar las copias Hostinger. Estas aclaraciones sustituyen la interpretación de cohorte cerrada, no autorizan todavía activar.

**Recepción factual final19/10:** incorporados en APP los cuatro campos de `TFM/Planificación/despliegue_pruebas/PREPARACION_B19_2026-10-19.md §8`, respaldados por `INVENTARIO_B19_2026-10-19_102736Z.md` ampliado hPanel. [Aviso2026-10-19.2 y huella](../sdd/evidencias/B19/AVISO_FINAL.md), completo y accesible incluso OFF; ya no faltan ubicación/panel ni referencia de alineación general19/10 (Aplicación16.1–16.2/17.13 e Infraestructura16.10). Se conservan límites de retención por rotación y restore no ensayado. La siguiente puesta en servicio continúa pendiente de autorización final; no se ejecutó aquí el procedimiento ni se activó tráfico real.

## 1. Qué ya acredita CI y qué falta en el VPS

| Acreditado técnicamente por [cierre B18](../../../verificacion-b18-20261018/cierre-publicacion.md) | Debe verificar el responsable en el servidor real |
|---|---|
| Node24.19.0/SQLite3.53.3, UID1000, raíz read-only, volumen0700 y archivos0600; UID ajeno denegado | Imagen/configuración nuevas exactas y montajes/propietario reales, espacio, SSH/ACL y accesos del proveedor. No usar el candidato B18 para una función HUMAN que no contiene. |
| Persistencia tras recreación, RAM jugable perdida y consultas de solo lectura | Compatibilidad/configuración del histórico de ese entorno, tareas diarias y ventana de operación sin partidas en curso. |
| Copia K3AGG1/AES-256-GCM y restauración aislada sin detalle | Clave real privada, custodia separada, entrega a otro disco, caducidad/supervisión/RPO y ensayo humano. |
| OFF/ausencia de emisiones y errores seguros con pruebas fabricadas | Versión con B19 preparada, información publicada/revisada y autorización explícita para ese entorno. CI no es aprobación de privacidad. |

## 2. Ficha no secreta que se completa antes de operar

Registrar: entorno autorizado; responsable operativo —autor en su consola—; commit/versión y digest futuro aprobado; proyecto Compose/ruta operativa y volumen reales; root estadístico; ruta del archivo de clave; directorio/destino externo cifrado y custodio separado de la clave; fecha/huella de información pública; referencia de valoración específica de privacidad y autorización; fecha/resultado de ensayo y próxima revisión. Incluir inventario Hostinger —alcance/ubicación/plazo/restauración de copias—. Nunca claves, tokens, cookies, DB o exportación de eventos. No pegar `docker inspect`/env/config privados completos ni solicitar SSH delegado.

Propuesta de rutas a confirmar por el hilo VPS, no afirmadas existentes:

- Root dentro de app: `/var/lib/karta3/usage`; histórico real Pruebas: `pruebas/human/usage.sqlite`. Otro entorno utiliza proyecto/volumen/directorio diferentes, jamás copia el archivo Pruebas como producción.
- Clave en host: `/opt/karta3/pruebas/secrets/usage-backup.key`; montaje de **archivo** solo lectura dentro de app: `/run/secrets/karta3-usage-backup-key`. No incluirla en imagen, volumen de copias o Git.
- Proyecto existente de Pruebas y volúmenes de Caddy se conservan. Contrastar nombres/rutas/montajes efectivos antes de tocar permisos; no `down -v`, prune o sustituciones globales.

## 3. Preparación pública OFF

1. Hilo VPS prepara guion revisable; el autor ejecuta inventario/preparación en su consola, sin delegar SSH. Cuando Implementación/GitHub entreguen candidato, fijar digest/configuración y comprobarlo aislado sin modificar la pila pública. No construir/editar dentro del contenedor. Guardar referencia anterior/configuración/resultados sin secretos; actualizar el servicio público y HUMAN esperan la autorización final, incluso si se actualizara primero en OFF. No añadir barrera pública de contraseña; la administración privada sigue protegida.
2. Preparar volumen exclusivo, raíz0700 propietario UID1000, DB/WAL/SHM/export/copias0600. Mantener usuario no root y sistema raíz read-only; solo root estadístico escribible. No estáticos, puertos nuevos o API administrativa. Verificar desde proceso y usuario no autorizado; no aplicar chown recursivo a rutas/volúmenes sin haber contrastado su destino real.
3. Generar **localmente en el entorno administrativo** 32 bytes aleatorios criptográficos en representación de 64 hex, directamente en archivo privado, sin mostrarlos por pantalla/comando/historial. Montar RO con propietario/permisos que permitan leer solo al proceso autorizado. Configurar `KARTA3_USAGE_BACKUP_KEY_FILE` a la ruta, nunca valor literal; conservar copia de recuperación separada y protegida fuera del disco. No solicitar enviarla a un hilo.
4. Preparar configuración futura: `KARTA3_ENV=pruebas`, `NODE_ENV=production`, `KARTA3_USAGE_DIRECTORY=/var/lib/karta3/usage`, archivo de clave y **`KARTA3_USAGE_COLLECTION=off`**. B19 prepara `compose.usage.yaml` configurable con off predeterminado y un overlay de archivo secreto RO; el B18 anterior fijaba off. Usar la versión exacta comprobada, sin editar el contenedor vivo. Solo Pruebas podrá solicitar HUMAN en esta habilitación; production/development/test no lo activan. El aviso factual completo2026-10-19.2 satisface esa condición técnica; no sustituye la autorización final ni activa recogida.
5. Si ya hay histórico HUMAN, comprobar sus metadatos, mantenimiento y escritor único; no sustituir o importar datos de test. Si no existe, OFF no debe inventar historial vacío. No «probar» la recogida con visitas reales en esta fase.
6. Verificar HTTPS/origen, exclusión de JSON/SQLite/WAL/SHM/backup/export —404, sin fallback HTML—, cookie funcional y ausencia de POST de eventos/UUIDs de visita con OFF o sin permiso. Elección/retirada son controles funcionales, no eventos. Información funciona apagada y el juego sigue accesible sin aceptar; no inferirlo por ver off en un archivo.

## 4. Consulta, mantenimiento y copias

Los siguientes son **comandos existentes dentro de una ejecución administrativa preparada**, no instrucciones para ejecutarlos ahora. Entorno/root/clave se proporcionan mediante configuración privada, no como literales en argumentos. En imagen compilada:

```text
node dist-server/server/composition/usageCli.js --report completion --from <ISO-UTC> --to <ISO-UTC> --environment pruebas --format csv
node dist-server/server/composition/usageMaintenanceCli.js backup
node dist-server/server/composition/usageMaintenanceCli.js maintain
```

El primer comando devuelve nombre de archivo nuevo privado, no una URL: el autor lo recoge desde su consola administrativa o SSH/SFTP propio. Comprobar numerador/denominador/asOf/calidad; no volcar CSV/DB o datos individuales en el chat. No delegar SSH, shell, socket Docker o informes a los hilos; estos preparan el guion. El lector no migra/reconcilia/purga la DB viva.

El escritor de app mantiene purga y copia incluso con captura off, cuando existe histórico/configuración válida. El mantenimiento manual necesita escritor detenido y lease libre; no lanzar dos escritores ni borrar un lock dudoso por antigüedad. Una copia administrativa de solo lectura puede coexistir con el escritor bajo el bloqueo de exportación B18; no copiar simplemente el archivo SQLite abierto.

Preparar tarea diaria del SO y registro seguro de resultado: supervisar mantenimiento/copia, ejecutar mantenimiento fuera de app cuando corresponda y copiar **el archivo cifrado final** a otro disco bajo control del responsable. No ejecutar el mantenimiento CLI simultáneamente con el escritor de la app. El hilo VPS concreta su timer/comando y prueba éxito/fallo, sin una plataforma nueva ni un monitor de chat.

Siete copias B18 locales máximas y mismas reglas en su destino externo; retirar también las que contengan un mes fuera de los doce permitidos aunque queden menos de siete. Transportar con canal autenticado, comparar tamaño/huella del **cifrado** y registrar fecha/asOf/entrega sin clave. Rotar también exportaciones; no copiar intermedios completos.

**Hostinger se conserva activo por decisión expresa del autor.** Sus copias de servidor/snapshots pueden incluir SQLite detallado, recibos, logs o claves si están en disco; no son los archivos B18 cifrados de solo agregados ni acreditan la aceptación de pérdida de detalle. Inventariar inclusiones, frecuencia/retención, ubicación/accesos, posibilidad de borrado y restauración aislada **antes de proponer cambios**. No apagarlas, excluir volúmenes o cambiar plazos por iniciativa. Si su retención/restauración contradice los plazos informados, devolver el conflicto medido y alternativa mínima al autor. Tras restaurar servidor, mantener captura OFF, comprobar fecha/volúmenes/configuración, purgar detalle/recibos vencidos y no resucitar permisos RAM o partidas. Un snapshot no reinicia los plazos. No afirmar esto ya probado.

RPO inicial aceptado: **24 h para agregados**, no para eventos. Supervisar diariamente: último mantenimiento, próxima caducidad, calidad/descartes, espacio/budgets, copia local y entrega externa; si exceden 24 h o falla restauración/clave, corregir y no autorizar continuidad de HUMAN sin resolver el incumplimiento. Registrar responsable y canal operativo ya disponible para incidencias; no prometer que la app verifica la entrega externa.

Ensayar restauración desde una copia **externa** en directorio/volumen nuevo, mismo entorno, destino inexistente; clave suministrada por archivo y `KARTA3_USAGE_RESTORE_FILE` al cifrado. Ejecutar el comando restore preparado y consultas sobre el restaurado; verificar autenticación, agregados/asOf/cobertura, cero eventos/subjects y rechazo de sobrescritura. No sustituir la DB activa ni habilitar captura en el restaurado. No intentar reconstruir partidas, detalle o intervalo posterior a la copia.

## 5. Ensayo previo fabricado y autorización

Preparar instalación **aislada y desechable** de la versión B19, con root/volumen/clave propios y acceso limitado al responsable: probar modo HUMAN con datos fabricados por el arnés o recorridos de ensayo, bajo configuración de entorno permitida. Aunque esos ficheros se etiqueten técnicamente HUMAN para probar ese camino, su evidencia los identifica como ensayo, no recogida real. Nunca usar el root/clave/histórico real; SYNTHETIC/test B18 conserva su separación.

Comprobar dos sesiones, creación/entrada/configuración/inicio/final/cancelación, informes, OFF y persistencia/mantenimiento, falta de clave/permisos/DB, cabecera/cliente, consultas privadas, copia/restore y rollback **de configuración** sin borrar volumen. Datos de prueba no se trasladan a la DB real. CI Linux previa no sustituye este ensayo en la configuración operativa elegida.

Para la autorización final, devolver ficha/resultados/aviso y valoración concreta del tratamiento. No exigir dictamen externo universal o reabrir identidad/correo/acceso libre. El inventario resuelve hechos de operación y completa el aviso; no transforma acceso público en control de edad. Decisiones materiales solo en [B19 §10](../sdd/BLOQUE_19_HABILITACION_ANALITICA_REAL.md#10-pendientes-del-autor-y-traslado).

Ensayar la versión candidata con **elección dentro de la app**: sin responder/rechazar se puede crear/entrar/jugar sin captura propia; aceptar habilita solo hechos permitidos; salas mixtas y retirada producen censura/calidad explícitas sin falso final. Retirar desde cualquier pantalla/pestaña corta también SERVER/colas del ámbito, conserva Game y no requiere moderador, pausa global o reinicio. Ensayar recibos/plazos/revisión/red caída sobre datos fabricados. Ninguna credencial de prueba identifica visitantes; no montar CMP, cuentas o contraseña para jugar.

## 6. Autorización final, actualización y activación dentro de B19

Coordinación agrupa candidato exacto, aviso, consecuencias/evidencias y guion de actualización/activación/retirada/vuelta a OFF para **la única autorización final del autor**. No requiere otro bloque o encargo de fase. Con esa autorización el autor ejecuta el guion en su consola, en ventana sin partidas/salas activas: imagen B19 por digest, human en orden aprobado, recrear solo app con mismo volumen/configuración y conservar Caddy/certificados/redes y copias Hostinger. Mantener acceso público libre; disponibilidad HUMAN no equivale a aceptación de ningún visitante. No ejecutar desde SDD ni sustituir otro digest/aviso.

Comprobar modo efectivo sin secretos: navegador nuevo sin elección no captura; juego e información disponibles; aceptación voluntaria habilita los hechos existentes correspondientes, rechazo/retirada los impiden según ámbito. CLI consulta HUMAN correcto, nunca sintéticos; validar agregado/calidad de recorrido autorizado sin nombres/dumps ni usar personas únicas como interpretación. Registrar cobertura UTC y autorización; no inferir ausencia de pérdidas por un último cero ni poblar el histórico real con automatizaciones.

## 7. Desactivación e incidencias

Ante falta de base/autorización, exposición, clave/DB/mantenimiento o copia externa sin garantías, detener recogida mediante configuración off y recreación controlada. En emergencia no esperar a una partida si eso prolonga la incidencia; informar de que el reinicio pierde su RAM y puede emitir el último final técnico del proceso anterior. No es una nueva facultad de cancelar partidas por el HOST.

No borrar volumen/histórico ni restaurar copia sobre él para apagar. Verificar que el proceso nuevo no emite señal de captura, clientes informados/reconectados no generan eventos y los tardíos no se persisten; consultas/purga/copia del histórico mantenido siguen disponibles. Conservar prueba no secreta de hora/cobertura/huecos y causa operativa, sin datos afectados ni credenciales en conversaciones.

La retirada propia probada en §5 detiene BROWSER/SERVER del ámbito sin esperar al final de ronda, sin último hecho posterior y sin reinicio. La recreación es el recurso global ante incidentes, no el mecanismo de retirada ni una nueva pausa administrativa obligatoria. No apagar copias Hostinger al desactivar recogida: mantener conservación/supervisión y guion de restauración revisados.

Reanudar solo tras reparación, mantenimiento y autorización vigente, con el mismo archivo compatible —nunca el restaurado de agregados—. No backfill de visitas/partidas perdidas. Esta guía no acredita pasos ejecutados. Su resultado se incorpora al **cierre único B19**: versión/digest/texto exactos, autorización final, preparación y pruebas VPS, comienzo de cobertura HUMAN y comprobación de informes/privacidad/retirada/recuperación. Solo entonces se informa Pruebas actualizado y HUMAN activo/verificado dentro del alcance acordado, sin afirmar cumplimiento universal o producción habilitada.
