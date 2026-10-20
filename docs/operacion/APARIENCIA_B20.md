# B20 — Preferencia local y consulta de fotografías

20/10/2026. Complemento de B18/B19; no sustituye sus procedimientos, recibos, claves, límites o barreras. Recogida pública OFF. No contiene datos reales ni autoriza activación.

## Preferencia sin analítica

Usar Node 24.19.0 fijado, compilar y arrancar una instancia propia en puerto libre. No detener servidores del autor. En PowerShell, seleccionar la ruta existente del runtime:

```powershell
cd E:\KARTA3\KARTA3_IA\APP\karta3
$env:PATH = 'C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
$env:KARTA3_USAGE_COLLECTION = 'off'
$env:PORT = '3158'
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run build
if ($LASTEXITCODE -eq 0) { node dist-server/server/main.js }
```

Abrir http://127.0.0.1:3158 y otra sesión independiente (otro perfil/incógnito). Sin preferencia aparece Predefinida; el menú ofrece cuatro temas reales. Elegir Claro y comprobar que ahora dice Claro. Elegir Crema, recargar y abrir otra pestaña del mismo perfil; cambiar Oscuro allí. El segundo perfil conserva su elección propia. Al borrar la clave local o si es inválida, vuelve al predeterminado; un fallo de guardado solo avisa y conserva memoria.

Crear/entrar, seleccionar baraja explícitamente e iniciar con dos humanos o humano/bots. Cambiar apariencia en espera y mesa no cambia configuración, mano, parcial o plazo. Probar HOST jugador/observador e invitado, D/Escape y retorno de foco, Jugar normal, arrastre de carrusel sin jugada, Mesa y mano independientes, útil 1367/1368 y tamaño intermedio. En móvil estrecho el selector del HOST va debajo de Cancelar. En Resultados no se produce una nueva foto al cambiarlo. Abrir `/privacidad` directamente desde perfil nuevo: no debe crear sesión/visita ni montar mesa.

La preferencia no está en RoomSettings/GameSettings. `optimizeForMobile` continúa compartido. Pestañas no son dispositivos sincronizados y una captura de pantalla no acredita revisión humana o dispositivo físico.

## Ensayos aislados de estadística

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run check
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run test:browser -- --workers=1 --retries=0 appearance.spec.ts appearanceUsage.spec.ts privacyNotice.spec.ts usageChoice.spec.ts usageActivation.spec.ts usage.spec.ts
```

Los arneses crean instancias/SQLite/claves temporales propias, HUMAN fabricado o SYNTHETIC separado. No habilitan el servidor habitual ni constituyen consentimiento de usuarios reales. El aviso 2026-10-20.1 mantiene aceptar/rechazar/retirar y doce horas; un recibo anterior no autoriza nuevas fotos. No aceptar tarde para reconstruir el inicio de un ciclo censurado.

Para revisión posterior autorizada del autor en entorno aislado: dos sesiones aceptan antes de crear/entrar; tercera pestaña del HOST. START predeterminado frente a Claro explícito, temas distintos y Claro→Oscuro→Claro; terminar de modo ordinario/inactividad/cancelación. Probar desconexión antes de final, F5, consulta tardía, retirada y nueva sala B tras A. Sin continuidad o permiso queda ausencia. Solo una foto por participación/momento entre pestañas. No prometer durabilidad por HTTP202 ni generar fotos al consultar resultados. No existe endpoint de reloj/timeout o consulta pública.

## Consulta privada y conservación

Con el mismo acceso administrativo del SO y directorio/entorno B19, tras compilar:

```powershell
$usageB20To = (Get-Date).ToUniversalTime().ToString('o')
npm run usage:report -- --report appearance --from 2026-10-01T00:00:00Z --to $usageB20To --environment pruebas --format csv
```

El comando escribe archivo privado y devuelve solo su nombre. Para tráfico de ensayo SYNTHETIC usar `usage:report:synthetic` y entorno test; no mezclarlo con HUMAN. No aporta nuevos permisos administrativos ni SQL libre.

La cohorte es el inicio UTC de Game, aun si END llega otro mes. START usa withStart; END withEnd; pares paired. Denominador cero → porcentaje nulo. Cobertura distingue pendientes, solo inicio/final, ninguna y no instrumentado. Los pares netos no prueban que no hubiera cambios intermedios, preferencias demostradas o personas únicas.

Esquema3 acepta históricos1/2 sin backfill: marca límite real de instrumentación y capacidad por partida nueva. Mantiene ocho informes, censura/unknown, 90 días de detalle y doce meses UTC de agregados. Copia/restauración existentes incluyen apariencia agregada del mes actual, sin ids, detalle, recibos, tokens o sesiones; no restauran partidas. Limpieza privada incluye archivos appearance. No recuperar detail del disco perdido. Linux/volumen/CI y operación pública requieren sus puertas posteriores; la adaptación del verificador no acredita ejecutarlas.
