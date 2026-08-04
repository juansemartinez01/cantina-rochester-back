# Plan de despliegue AWS — Rochester (kiosco) + San Esquina (kiosco) + Rochester (viandas)

3 aplicaciones en la misma instancia EC2 (3 contenedores Docker) y una
única instancia RDS PostgreSQL con 3 bases lógicas:

1. **gestion-stock-backend** (este repo, kiosco) → cliente Rochester
2. **gestion-stock-backend** (misma imagen, distinto `.env`) → cliente San Esquina
3. **backend-rochester** (repo aparte, sistema de "viandas": pedidos, menús,
   producción, entregas, Mercado Pago) → cliente Rochester, otro negocio

Los backends 1 y 2 son el mismo código (no-multitenant), solo cambia el
`.env`. El backend 3 es una aplicación completamente distinta (código,
auth y variables de entorno propias) que no tiene ninguna dependencia de
código con el backend de kioscos — se co-hostea en la misma instancia
solo para ahorrar costo de infraestructura.

## Decisiones tomadas

- **Región:** us-east-2 (Ohio)
- **Cómputo:** 1x EC2 (Ubuntu LTS), sin dominio propio por ahora
  → acceso por IP fija + puertos (3001 Rochester-kiosco, 3002 San Esquina-kiosco,
  3003 Rochester-viandas)
- **Base de datos:** 1x RDS PostgreSQL `db.t4g.micro`, sin acceso público,
  bases lógicas `db_rochester_kiosco`, `db_sanesquina`, `db_rochester_viandas`
- **Clientes/sistemas:**
  - Rochester (kiosco): tiene datos actuales en Railway, hay que migrarlos
  - San Esquina (kiosco): tiene datos actuales (hosting/lugar a confirmar), hay que migrarlos
  - Rochester (viandas / backend-rochester): también en Railway, se suma a este mismo despliegue
- **Facturación ARCA:** `gestion-stock-backend` llama a
  `https://facturador-production.up.railway.app/facturas` (hardcodeado en
  `src/factura/factura.service.ts`, no es env var). Es un servicio externo
  que se mantiene donde está — no requiere nada especial en AWS más allá
  de salida a internet (default en EC2). Pendiente confirmar si ese
  facturador soporta múltiples `cuit_emisor` (relevante si San Esquina
  también facturara).
- **Despliegue:** pasos manuales por consola AWS (sin IaC)
- **Key pair EC2:** se genera nuevo en la Fase 4 (no había uno previo)
- **Sizing EC2:** `t3.small` (2GB RAM) definitivo, para tener margen con los
  3 backends corriendo desde el día 1. Ver nota abajo.

## Hallazgos críticos para la Fase 6

- **`gestion-stock-backend` tiene `synchronize` en `true` por default fuera de
  Railway** (`shouldSynchronizeSchema()` en `src/database/migration-runtime.ts`
  devuelve `!isRailwayDeploy()`). Hay que setear **`DB_SYNCHRONIZE=false`**
  explícitamente en los `.env` de Rochester-kiosco y San Esquina en AWS, o
  TypeORM puede alterar/romper el schema migrado al arrancar. `migrationsRun`
  sí es seguro por default (`false` fuera de Railway).
- `backend-rochester` tiene `synchronize: false` hardcodeado — no aplica este riesgo.
- `backend-rochester` corre `db:migration:run` + `db:seed` en cada arranque
  (`docker-entrypoint.sh`). El seed es idempotente (no duplica admins existentes)
  pero **requiere `SEED_TENANT_ID`** o el contenedor no levanta. Confirmado:
  el `tenant_id` real en los datos migrados es `00000000-0000-0000-0000-000000000001`,
  coincide con el `SEED_TENANT_ID` que ya usaban en Railway.
- Secretos JWT que eran placeholders literales sin cambiar (`tu_secreto_super_seguro`
  en gestion-stock-backend, `change-me-access`/`change-me-refresh` en
  backend-rochester) — se reemplazan por secretos reales generados en la Fase 6.
- `backend-rochester` usa un servicio externo de archivos/imágenes que **ya está
  en AWS** (`FILES_API_BASE`/`IMAGES_CLOUDFRONT_BASE` en App Runner + CloudFront) —
  no requiere cambios.
- Las URLs de Mercado Pago (`MP_NOTIFICATION_URL`, `MP_SUCCESS_URL`, etc.) y los
  `CORS_ORIGINS` de ambos backends siguen apuntando a dominios de Railway —
  quedan como pendiente para cuando haya dominio propio en AWS (Fase 8), no
  bloquean levantar los contenedores para probar.
- **RDS exige SSL** (`rds.force_ssl` del parameter group). Detectado en la Fase 6
  al ver `no pg_hba.conf entry ... no encryption` en los 3 contenedores. Fix
  aplicado: `DB_SSL=true` en los `.env` de Rochester-kiosco y San Esquina
  (ya soportado por `app.module.ts`), y `?sslmode=no-verify` agregado al
  `DATABASE_URL` de viandas (no tiene lógica de SSL en código, se resuelve
  vía connection string).
- `backend-rochester` requiere **`PORT`** explícito en el `.env` (su
  `env.validation.ts` lo valida como entero obligatorio) — no estaba
  contemplado en el `.env` inicial y tumbaba el contenedor en loop de
  reinicio hasta agregarlo (`PORT=3000`).

## Nota de sizing (importante)

La decisión original de `t3.micro` se tomó pensando en 2 backends. Con 3
backends NestJS corriendo en simultáneo (Rochester-kiosco, San Esquina-kiosco,
Rochester-viandas) más el overhead de Docker y el SO, 1GB de RAM total
puede no alcanzar cómodo, sobre todo en picos de tráfico. Recomendación:
arrancar directamente con **`t3.small`** (2GB RAM) en vez de `t3.micro`
para evitar tener que redimensionar la instancia (con su breve downtime)
apenas se prendan los 3 contenedores. Diferencia de costo: micro ~$7.5/mes
→ small ~$15/mes on-demand.

## Pendiente de definir durante el proceso

- Rotar el password de Postgres de Railway una vez migrado Rochester
  (quedó expuesto en el chat de planificación)
- Generar un `JWT_SECRET` nuevo y fuerte para el `.env` de cada cliente
  en vez de reusar el valor actual
- Confirmar dónde están hoy los datos de San Esquina para planificar el dump
- Confirmar si el facturador ARCA soporta múltiples `cuit_emisor` (si San Esquina factura también)
- Revisar env vars reales de `backend-rochester` (`DATABASE_URL`, `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, `TENANCY_*`, etc. — distintas a las de gestion-stock-backend)

## Fases

- [ ] **Fase 0** — Preparativos (nombres, env vars, sizing) — ✅ completada
- [x] **Fase 1** — Cuenta y seguridad base AWS (IAM, MFA, billing alarm)
- [x] **Fase 2** — Red (Security Groups EC2 y RDS) — `ec2-kioscos-sg`, `rds-kioscos-sg`
- [x] **Fase 3a** — RDS PostgreSQL: instancia `rds-kioscos` creada, PostgreSQL 18.3, db.t4g.micro (endpoint y credenciales guardados en gestor de contraseñas, **no en este archivo**)
- [x] **Fase 3b** — Bases lógicas creadas y renombradas: `db_rochester_kiosco`, `db_sanesquina`, `db_rochester_viandas`
- [x] **Fase 4** — EC2 `ec2-kioscos` (t3.small, Elastic IP `3.151.25.238`, 25GB gp3, Docker instalado). Hay 3 contenedores placeholder corriendo (`cantina-rochester-back`:3000, `cantina-cliente1`:3001, `cantina-cliente2`:3002) que se reemplazan por las imágenes reales en la Fase 6 — no requieren cambios de Security Group porque el deploy real va a publicar en 3001/3002/3003.
- [x] **Fase 5** — Migración de datos completada y validada (`\dt` OK en las 3 bases, sin errores de restore)
- [x] **Fase 6** — Despliegue de contenedores: repos clonados en `~/deploy`, `.env` por sistema, `docker-compose.yml` con 3 servicios (`rochester-kiosco`:3001, `sanesquina`:3002, `rochester-viandas`:3003), placeholders reemplazados. Los 3 arrancan con `Nest application successfully started`, sin `ALTER TABLE` en los kioscos.
- [x] **Fase 7** — Validación: login OK en los 3 sistemas con usuarios reales migrados; `/productos` en Rochester-kiosco y San Esquina devuelven catálogos propios y distintos (aislamiento de datos confirmado, cada cliente en su base); `/admin/sedes` en viandas devuelve la sede migrada real con `tenant_id` correcto. Nota: `backend-rochester` requiere el header `x-tenant-id` en cada request (no alcanza con el JWT solo, por orden de ejecución middleware→guard) — comportamiento propio de la app, no algo a corregir para este despliegue.
- [ ] **Fase 8** — Pendientes futuros (dominio, HTTPS, monitoreo, Secrets Manager)

## Variables de entorno por backend

Mismo patrón que Railway, un `.env` por cliente apuntando a su base:

```
DATABASE_URL=postgresql://<user>:<pass>@<rds-endpoint>:5432/db_rochester
DB_HOST=<rds-endpoint>
DB_NAME=db_rochester
DB_PASS=<nueva-pass>
DB_PORT=5432
DB_USER=<user>
JWT_SECRET=<nuevo-secreto-fuerte>
```

(Ídem para San Esquina apuntando a `db_sanesquina`)
