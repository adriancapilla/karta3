# B18 — comprobación Linux pendiente para el autor

No ejecutada desde esta máquina: no hay motor Docker Linux utilizable. No constituye aprobación para publicar, usar GHCR o operar VPS. Usar checkout del commit local entregado, Node24.19.0 y una máquina Linux propia; datos exclusivamente sintéticos, nombres/volúmenes nuevos y **sin publicar puertos**.

## Puertas a repetir

1. `npm ci` y `npm run check` con Node fijado. Los tests de SQLite/worker/permisos se ejecutan ahí en Linux; eso no sustituye la comprobación del usuario y montaje de la imagen final.
2. Construir imagen local `docker build -t karta3-b18-local .`. Sin modificar barajas ni incorporar ASSETS/PRODUCTO/datos privados.
3. Crear volumen propio y arrancar instancia sintética aislada:

```sh
docker volume create karta3-b18-sintetico
docker run -d --name karta3-b18-sintetico --read-only --tmpfs /tmp \
  --mount source=karta3-b18-sintetico,target=/var/lib/karta3/usage \
  -e KARTA3_ENV=test -e KARTA3_USAGE_COLLECTION=synthetic \
  -e KARTA3_USAGE_DIRECTORY=/var/lib/karta3/usage karta3-b18-local
```

Esperar healthy; comprobar `docker logs` sin payloads, cuenta node/UID1000, Linux/x64, Node24.19.0/SQLite efectiva; raíz `/app` no escribible y montaje sí. El ensayo **no cambia** Pruebas pública. No compartir el volumen con otros entornos.

## Sonda de ingesta y permisos dentro de la instancia

```sh
docker exec --user node karta3-b18-sintetico node --input-type=module -e '
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {randomUUID} from "node:crypto";
assert.equal(process.version,"v24.19.0"); assert.equal(process.platform,"linux"); assert.equal(process.arch,"x64"); assert.equal(process.getuid(),1000);
const base="http://127.0.0.1:3000";
const result=await fetch(base+"/api/usage/events",{method:"POST",headers:{Origin:"https://127.0.0.1:3000","Content-Type":"application/json"},body:JSON.stringify({eventId:randomUUID(),version:1,visitId:randomUUID(),name:"home_viewed",data:{viewId:randomUUID(),navigation:"DOCUMENT_INITIAL"}})});
assert.equal(result.status,202); assert.equal(result.headers.get("set-cookie"),null);
const dir="/var/lib/karta3/usage/test/synthetic";
assert.equal((await fs.stat(dir)).mode&511,448);
for(const suffix of ["","-wal","-shm"]){const file=await fs.stat(dir+"/usage.sqlite"+suffix);assert.equal(file.uid,1000);assert.equal(file.mode&511,384);}
await assert.rejects(fs.writeFile("/app/.b18-readonly-probe","x"),{code:"EROFS"});
for(const route of ["/usage","/usage-data","/backups","/exports","/usage.sqlite","/usage.sqlite-wal","/usage.sqlite-shm","/api/usage/report"]){assert.equal((await fetch(base+route)).status,404);}
console.log(JSON.stringify({node:process.version,sqlite:process.versions.sqlite,platform:process.platform,uid:process.getuid(),probe:"OK"}));
'
```

Registrar salida real, no marcar esta lista como superada por estar escrita. Origin https corresponde al backend compilado de producción, sin excepción TLS o apertura pública.

## Informes, copia y reinicio

Con fechas UTC actuales válidas, ejecutar dentro del contenedor `node dist-server/server/composition/usageSyntheticCli.js --report access --from <primer-día-del-mes-UTC> --to <ahora-UTC> --environment test --format csv`. Comprobar fichero privado0600, traffic SYNTHETIC, numerador/denominador/calidad y ausencia de IDs. El comando humano ordinario no debe abrir este archivo sintético ni producir cifras humanas.

Generar clave aleatoria privada0600 **sin mostrarla**, fuera de Git; configurar `KARTA3_USAGE_BACKUP_KEY_FILE` y usar `usage:backup` según la guía. Verificar origen sin mutación por copia de lectura, siete rotatorias/caducidad, autenticación GCM y SQLite nuevo sin eventos/proyecciones/identificadores. Reiniciar solo esta instancia con el mismo volumen: estadísticas permitidas sobreviven, juego/sesiones no. Comprobar manejo SIGTERM Linux y UNKNOWN tras corte abrupto de otro hijo propio; distinguir ambos casos.

Restaurar en **otro volumen y contenedor de ensayo**, clave/copia original montadas de lectura, destino nuevo con propietario node. `usage:restore` debe reconstruir únicamente agregados/cobertura/asOf. Comprobar también archivo de entorno/tráfico equivocado, raíz read-only, falta de permisos y límites; no mover el archivo restaurado sobre la DB activa. Procedimiento/configuración: [guía operativa](../../../operacion/ANALITICA_USO.md).

Devolver por el autor referencia del commit/imagen **local**, comandos, runtime/UID/montaje/modos/errores/retención/restauración realmente ejecutados y límites. Detener solo lo creado en este ensayo, conservando evidencias para revisión. Copia a otro disco, tarea diaria/SSH/delegación reales y revisión de privacidad siguen siendo preparación operativa aparte. No publicar/activar HUMAN para obtener esta evidencia.
