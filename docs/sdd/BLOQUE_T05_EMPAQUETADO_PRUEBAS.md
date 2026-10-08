# T05 — Empaquetado Docker para Pruebas

**Alcance registrado antes de implementar — 08/10/2026.** Fuentes: AGENTS, proceso SDD, organización/dependencias, infraestructura §§3–4/12/15 y plan compartido de VPS §§4/8 (actualización 08/10). Base efectiva `4b56914bb1610908061b414090225cce3e6f5236`, rama inicial `fix/t04-inc01-verificacion`, árbol limpio; contiene main integrado `7f340a0` y su revisión T04 posterior. Rama propia `chore/docker-pruebas`; trabajo previo conservado. Git requiere una excepción de propiedad limitada a cada invocación de este repositorio; no se modifica su configuración global.

## Entrega acotada

Dockerfile Linux con Node 24.19.0/dependencias bloqueadas, exclusiones de construcción desde APP, Compose/Caddy, configuración de ejemplo sin secretos y guía de arranque/actualización/reversión. Una imagen independiente de dominio/entorno; configuración en arranque, sin nuevas funciones públicas. Solo preparar Pruebas: un proceso de juego en red interna, Caddy publica TCP 80/443 y conserva certificados. Acceso de jugadores sin contraseña; administración, credenciales de registro y API de Caddy permanecen privadas. Futuro Play reutilizará digest con estado/configuración separados y Caddy compartido; no se prepara ese servicio todavía.

Único ajuste de producto previsto: `HOST` configurable en el arranque; valor local predeterminado 127.0.0.1 y 0.0.0.0 en contenedor. Reutilizar sesiones/orígenes/Socket.IO y catálogo existentes, sin ampliar confianza del proxy ni entregar JSON privados. No cambia dominio, aplicación, cliente, reglas, contratos o barajas; no nuevas credenciales de producto inventadas. Los secretos administrativos no se incorporan a la imagen ni a ejemplos.

| Criterio | Comprobación prevista |
| --- | --- |
| T05-01 — Imagen APP/Linux reproducible | Node fijado, npm ci/build/check, dependencias nativas Linux, ejecución sin ASSETS/TFM/MASTER; verificar imagen real donde exista motor Linux. |
| T05-02 — Configuración y promoción | Dominio/mode por arranque; cliente usa origen relativo. Referencia por digest, misma imagen comprobada reutilizable sin reconstruir. |
| T05-03 — Red y administración | Una instancia, app sin puertos publicados, Caddy TCP 80/443, volúmenes, sin socket Docker/puerto admin expuestos. |
| T05-04 — Sesión/tiempo real/privacidad | Cookie Secure/HttpOnly/SameSite, origen HTTPS, dos sesiones y WebSocket/polling a través de proxy; JSON privados 404 y catálogo seguro. Distinguir proxy de montaje y Caddy real. |
| T05-05 — Puertas/operación | npm run check, navegador pertinente compilado, guía y reversión por digest con pérdida de memoria explícita; evidencias y pendientes CI/VPS diferenciados. |

**Estado inicial:** acordado; comprobaciones pendientes. Node 24.19.0 disponible en la ruta T03. Docker CLI 29.6.1/Compose 5.3.0 instalados; motor desktop-linux inicialmente inaccesible. Se intenta iniciar el Docker Desktop ya instalado, sin instalar herramientas. Los primeros accesos de registro fallan por DNS del entorno restringido; se comprobará acceso autorizado antes de atribuirlo al registro o a una versión de imagen. No operaciones del VPS ni workflows/publicación/PR. La coordinación se entrega como texto al autor, sin mensajes entre hilos.
