# B19 — Preparación y puesta en servicio coordinadas en Pruebas

**19/10/2026. Estado:** procedimiento no aplicado. Leer [B19](../sdd/BLOQUE_19_HABILITACION_ANALITICA_REAL.md) y [operación B18](ANALITICA_USO.md). Coordinación conduce implementación/publicación/preparación y puesta en servicio como **una entrega B19** autorizada por el autor. La preparación independiente puede avanzar; actualizar la pila pública y activar HUMAN esperan la **única autorización final** del autor sobre commit/digest/texto/evidencias/plan exactos. SDD no ejecuta operaciones ni mensajes por este documento.

**Ámbito confirmado por el autor:** primera habilitación HUMAN solo en **Pruebas**, para pruebas organizadas con adultos; responsable **Adrián Capilla López**, contacto público `k3k314com@gmail.com`. Revisión de privacidad/operación pendiente. No inferir autorización de activar o acceso exclusivo de adultos en un sitio abierto por estas confirmaciones.

## 1. Qué ya acredita CI y qué falta en el VPS

| Acreditado técnicamente por [cierre B18](../../../verificacion-b18-20261018/cierre-publicacion.md) | Debe verificar el responsable en el servidor real |
|---|---|
| Node24.19.0/SQLite3.53.3, UID1000, raíz read-only, volumen0700 y archivos0600; UID ajeno denegado | Imagen/configuración nuevas exactas y montajes/propietario reales, espacio, SSH/ACL y accesos del proveedor. No usar el candidato B18 para una función HUMAN que no contiene. |
| Persistencia tras recreación, RAM jugable perdida y consultas de solo lectura | Compatibilidad/configuración del histórico de ese entorno, tareas diarias y ventana de operación sin partidas en curso. |
| Copia K3AGG1/AES-256-GCM y restauración aislada sin detalle | Clave real privada, custodia separada, entrega a otro disco, caducidad/supervisión/RPO y ensayo humano. |
| OFF/ausencia de emisiones y errores seguros con pruebas fabricadas | Versión con B19 preparada, información publicada/revisada y autorización explícita para ese entorno. CI no es aprobación de privacidad. |

## 2. Ficha no secreta que se completa antes de operar

Registrar: entorno autorizado; responsable operativo; commit/versión y digest futuro aprobado; proyecto Compose/ruta operativa y volumen reales; root estadístico; ruta del archivo de clave; directorio/destino externo cifrado y custodio separado de la clave; fecha/huella de información pública; referencia de validación de privacidad y autorización; fecha/resultado de ensayo y próxima revisión. Nunca valores de clave, tokens, cookies, DB o exportación de eventos. No pegar `docker inspect`/env/config privados completos en el chat.

Propuesta de rutas a confirmar por el hilo VPS, no afirmadas existentes:

- Root dentro de app: `/var/lib/karta3/usage`; histórico real Pruebas: `pruebas/human/usage.sqlite`. Otro entorno utiliza proyecto/volumen/directorio diferentes, jamás copia el archivo Pruebas como producción.
- Clave en host: `/opt/karta3/pruebas/secrets/usage-backup.key`; montaje de **archivo** solo lectura dentro de app: `/run/secrets/karta3-usage-backup-key`. No incluirla en imagen, volumen de copias o Git.
- Proyecto existente de Pruebas y volúmenes de Caddy se conservan. Contrastar nombres/rutas/montajes efectivos antes de tocar permisos; no `down -v`, prune o sustituciones globales.

## 3. Preparación pública OFF

1. Avanzar ya en inventario y preparación independientes de versión, coordinados con Implementación/GitHub dentro de B19. Cuando estos entreguen el candidato, fijar imagen por digest/configuración compatibles y comprobarla en montaje aislado sin modificar la pila pública. No construir o editar dentro de un contenedor. Guardar referencia anterior/configuración y resultados sin secretos; actualización del servicio público y HUMAN quedan tras autorización final, incluso si se pretendiera actualizar primero en OFF.
2. Preparar volumen exclusivo, raíz0700 propietario UID1000, DB/WAL/SHM/export/copias0600. Mantener usuario no root y sistema raíz read-only; solo root estadístico escribible. No estáticos, puertos nuevos o API administrativa. Verificar desde proceso y usuario no autorizado; no aplicar chown recursivo a rutas/volúmenes sin haber contrastado su destino real.
3. Generar **localmente en el entorno administrativo** 32 bytes aleatorios criptográficos en representación de 64 hex, directamente en archivo privado, sin mostrarlos por pantalla/comando/historial. Montar RO con propietario/permisos que permitan leer solo al proceso autorizado. Configurar `KARTA3_USAGE_BACKUP_KEY_FILE` a la ruta, nunca valor literal; conservar copia de recuperación separada y protegida fuera del disco. No solicitar enviarla a un hilo.
4. Preparar configuración futura: `KARTA3_ENV=pruebas`, `NODE_ENV=production`, `KARTA3_USAGE_DIRECTORY=/var/lib/karta3/usage`, archivo de clave y **`KARTA3_USAGE_COLLECTION=off`**. Adaptar el overlay B18 que fija off únicamente mediante cambio revisado para el paso posterior, no editando el contenedor vivo. Solo Pruebas podrá solicitar HUMAN en esta habilitación; production/development/test no lo activan.
5. Si ya hay histórico HUMAN, comprobar sus metadatos, mantenimiento y escritor único; no sustituir o importar datos de test. Si no existe, OFF no debe inventar historial vacío. No «probar» la recogida con visitas reales en esta fase.
6. Verificar HTTPS/origen, exclusión de JSON/SQLite/WAL/SHM/backup/export —404, sin fallback HTML—, cookie funcional y ausencia de POST de analítica/UUIDs de visita en navegación normal. El enlace de información funciona también apagado. No inferirlo por ver off en un archivo.

## 4. Consulta, mantenimiento y copias

Los siguientes son **comandos existentes dentro de una ejecución administrativa preparada**, no instrucciones para ejecutarlos ahora. Entorno/root/clave se proporcionan mediante configuración privada, no como literales en argumentos. En imagen compilada:

```text
node dist-server/server/composition/usageCli.js --report completion --from <ISO-UTC> --to <ISO-UTC> --environment pruebas --format csv
node dist-server/server/composition/usageMaintenanceCli.js backup
node dist-server/server/composition/usageMaintenanceCli.js maintain
```

El primer comando devuelve nombre de archivo nuevo privado, no una URL: recogerlo mediante SSH/SFTP con acceso autorizado. Comprobar numerador/denominador/asOf/calidad; no volcar CSV/DB o datos individuales en el chat. Si se delega consulta, wrapper/regla SO acotados a ejecutable/env/root/filtros permitidos; no dar shell libre, socket Docker o permiso HOST por necesidad de un informe. El lector no migra/reconcilia/purga la DB viva.

El escritor de app mantiene purga y copia incluso con captura off, cuando existe histórico/configuración válida. El mantenimiento manual necesita escritor detenido y lease libre; no lanzar dos escritores ni borrar un lock dudoso por antigüedad. Una copia administrativa de solo lectura puede coexistir con el escritor bajo el bloqueo de exportación B18; no copiar simplemente el archivo SQLite abierto.

Preparar tarea diaria del SO y registro seguro de resultado: supervisar mantenimiento/copia, ejecutar mantenimiento fuera de app cuando corresponda y copiar **el archivo cifrado final** a otro disco bajo control del responsable. No ejecutar el mantenimiento CLI simultáneamente con el escritor de la app. El hilo VPS concreta su timer/comando y prueba éxito/fallo, sin una plataforma nueva ni un monitor de chat.

Siete copias locales máximas y mismas reglas en destino externo; retirar también las que contengan un mes fuera de los doce permitidos aunque queden menos de siete. Transportar con canal autenticado, comparar tamaño/huella del **cifrado** y registrar fecha/asOf/entrega sin clave. Rotar también exportaciones; no copiar intermedios completos. Confirmar que el proveedor de copias/snapshots no prolonga sin control el detalle que conserva el volumen original.

RPO inicial aceptado: **24 h para agregados**, no para eventos. Supervisar diariamente: último mantenimiento, próxima caducidad, calidad/descartes, espacio/budgets, copia local y entrega externa; si exceden 24 h o falla restauración/clave, corregir y no autorizar continuidad de HUMAN sin resolver el incumplimiento. Registrar responsable y canal operativo ya disponible para incidencias; no prometer que la app verifica la entrega externa.

Ensayar restauración desde una copia **externa** en directorio/volumen nuevo, mismo entorno, destino inexistente; clave suministrada por archivo y `KARTA3_USAGE_RESTORE_FILE` al cifrado. Ejecutar el comando restore preparado y consultas sobre el restaurado; verificar autenticación, agregados/asOf/cobertura, cero eventos/subjects y rechazo de sobrescritura. No sustituir la DB activa ni habilitar captura en el restaurado. No intentar reconstruir partidas, detalle o intervalo posterior a la copia.

## 5. Ensayo previo fabricado y autorización

Preparar instalación **aislada y desechable** de la versión B19, con root/volumen/clave propios y acceso limitado al responsable: probar modo HUMAN con datos fabricados por el arnés o recorridos de ensayo, bajo configuración de entorno permitida. Aunque esos ficheros se etiqueten técnicamente HUMAN para probar ese camino, su evidencia los identifica como ensayo, no recogida real. Nunca usar el root/clave/histórico real; SYNTHETIC/test B18 conserva su separación.

Comprobar dos sesiones, creación/entrada/configuración/inicio/final/cancelación, informes, OFF y persistencia/mantenimiento, falta de clave/permisos/DB, cabecera/cliente, consultas privadas, copia/restore y rollback **de configuración** sin borrar volumen. Datos de prueba no se trasladan a la DB real. CI Linux previa no sustituye este ensayo en la configuración operativa elegida.

Para pedir autorización al autor, devolver ficha no secreta y resultados de estos preparativos, más información pública final y referencia de validación RGPD/LSSI/ePrivacy. Mecanismo exigible sin resolver, adecuación del acceso al alcance adulto o copia externa sin comprobar mantienen OFF. Identidad, correo y ámbito inicial están confirmados; no reabrirlos ni considerar aprobada la activación por aceptar la especificación o preparar una variable.

**Opción por evaluar, no aprobada:** [B19 §6.1](../sdd/BLOQUE_19_HABILITACION_ANALITICA_REAL.md#61-opción-evaluada-sesiones-cerradas-consentimiento-previo-y-retirada). VPS inventaría una barrera temporal en el proxy, antes de cargar la app y cubriendo HTTP/API/Socket.IO, sin cuentas de jugador o guardar credenciales en analítica; privacidad informativa accesible sin captura. Credencial solo tras información/aceptación verificable de cada adulto, observadores incluidos, durante ventana organizada. Verificar que no haya rutas/puertos que eludan la barrera, y no registrar Authorization. La barrera por sí sola no prueba consentimiento/edad. Decisiones y datos que faltan se consolidan **solo en la lista B19 §10**, no se vuelven a preguntar aquí.

Si se adopta esa opción, ensayar rechazo/alternativa OFF y retirada efectiva con el moderador presente. **Cerrar acceso o reiniciar sin más no acredita retirada correcta**: pueden continuar eventos SERVER o perderse la partida. Concretar con Implementación el mecanismo administrativo validado para detener toda captura y conservar el juego, sin inventar un consentimiento por sala otorgado por HOST; no habilitarlo en público hasta quedar decidido/probado y autorizado al final. No desarrollar un consent-manager o mecanismo individual especulativo.

## 6. Autorización final, actualización y activación dentro de B19

Coordinación agrupa candidato exacto, texto, decisiones/evidencias y plan de actualización/activación/retirada/vuelta a OFF para **la única autorización final del autor**. No requiere otro bloque o encargo de arranque de fase. Con esa autorización, en la ventana y acceso acordados sin partidas/salas activas, actualizar a la imagen B19 por digest y habilitar human siguiendo el orden aprobado; recrear solo app con el mismo volumen/configuración válida y conservar Caddy/certificados/redes, aplicando la restricción de acceso revisada cuando corresponda. No ejecutar desde esta preparación SDD ni sustituir otro digest/texto por el aprobado.

Comprobar modo efectivo sin imprimir secretos; navegador nuevo recibe señal human y los tres hechos UI, servidor los seis hechos existentes, CLI humano ve el entorno correcto y no lee sintéticos; validar reporte agregado/calidad de un recorrido autorizado sin nombres ni dumps. Registrar inicio de cobertura UTC y fecha de autorización; no inferir ausencia de pérdidas por un último cero. No añadir una campaña de tráfico o visitas de prueba automatizadas al histórico real.

## 7. Desactivación e incidencias

Ante falta de base/autorización, exposición, clave/DB/mantenimiento o copia externa sin garantías, detener recogida mediante configuración off y recreación controlada. En emergencia no esperar a una partida si eso prolonga la incidencia; informar de que el reinicio pierde su RAM y puede emitir el último final técnico del proceso anterior. No es una nueva facultad de cancelar partidas por el HOST.

No borrar volumen/histórico ni restaurar copia sobre él para apagar. Verificar que el proceso nuevo no emite señal de captura, clientes informados/reconectados no generan eventos y los tardíos no se persisten; consultas/purga/copia del histórico mantenido siguen disponibles. Conservar prueba no secreta de hora/cobertura/huecos y causa operativa, sin datos afectados ni credenciales en conversaciones.

La retirada elegida en §5 debe tener su propia prueba: detener BROWSER/SERVER sin esperar al final de partida ni ocultar un último hecho posterior a retirar. La recreación descrita es el recurso operativo general ante incidentes, no prueba de que el consentimiento/retirada sean válidos.

Reanudar solo tras reparación, mantenimiento y autorización vigente, con el mismo archivo compatible —nunca el restaurado de agregados—. No backfill de visitas/partidas perdidas. Esta guía no acredita pasos ejecutados. Su resultado se incorpora al **cierre único B19**: versión/digest/texto exactos, autorización final, preparación y pruebas VPS, comienzo de cobertura HUMAN y comprobación de informes/privacidad/retirada/recuperación. Solo entonces se informa Pruebas actualizado y HUMAN activo/verificado dentro del alcance acordado, sin afirmar cumplimiento universal o producción habilitada.
