---
name: manual-usuario
description: Genera o actualiza el manual de usuario profesional del proyecto a partir del código del backend (NestJS + TypeORM) y de las pantallas de la aplicación. Usar cuando se pida crear, regenerar o actualizar el manual de usuario, la documentación funcional o el instructivo para el cliente.
---

# Generación de manuales de usuario

Pipeline en 4 pasos. Los pasos 1 y 2 son determinísticos (scripts, sin IA);
los pasos 3 y 4 son donde interviene el modelo.

**Regla de oro: nunca inventar datos factuales.** Campos, validaciones,
estados, mensajes de error y endpoints salen únicamente de
`docs/manual/system-model.json`. Si un dato no está en el modelo, no va al
manual: se marca como pendiente y se le pregunta al usuario.

## Paso 1 — Extraer el modelo de conocimiento

```bash
node tools/manual/extract.mjs
```

Recorre el AST de `src/` y escribe `docs/manual/system-model.json` con:
endpoints, roles y guards, entidades y columnas, DTOs con sus validaciones,
enums/estados y el catálogo de `throw new *Exception('...')`.

Revisar la advertencia de seguridad que imprime al final: si informa que no
hay `@Roles()` en uso, la matriz de permisos **no** puede derivarse del código
y debe acordarse con el usuario.

## Paso 2 — Generar el esqueleto de capítulos

```bash
node tools/manual/scaffold.mjs
```

Lee el modelo + `manual.config.yaml` y escribe `docs/manual/chapters/*.md`
con toda la información factual ya tabulada, más bloques
`<!-- PROSA:id -->…<!-- /PROSA -->` marcando lo que falta redactar.

Si `manual.config.yaml` no existe, crearlo primero preguntando al usuario:
nombre del sistema, cliente, colores de marca, glosario del negocio,
descripción de cada rol y el mapa `navegacion` (a qué menú y pantalla
corresponde cada módulo). Es lo único que no se deduce del código.

**La regeneración no borra lo redactado.** El scaffold rehace los capítulos
desde cero, pero antes rescata la prosa:

- `docs/manual/prosa.md` — banco de textos, uno por id de bloque `PROSA`. Es la
  fuente de verdad. Se puede editar ahí o en los capítulos: al re-ejecutar el
  scaffold, lo que esté escrito en los capítulos se cosecha hacia el banco.
- `docs/manual/overrides/<archivo>.md` — capítulos escritos enteros a mano.
  Si el archivo existe, se copia tal cual y el generador no lo toca.

Usar un override cuando el capítulo se aparta mucho de la estructura generada
(por ejemplo, cuando la pantalla real agrupa varias operaciones en una sola).

## Paso 3 — Redactar la prosa

Recorrer los capítulos y reemplazar cada bloque `<!-- PROSA:... -->`.
Antes de escribir sobre un módulo, **leer su `*.service.ts`** para entender la
regla de negocio real (cálculos, transiciones de estado, efectos colaterales).

Convenciones de redacción:

- Dirigirse al usuario final, nunca al programador. Nada de "endpoint",
  "DTO", "payload", "request".
- Pasos numerados, en imperativo, describiendo lo que se ve en pantalla:
  "Presione **Nuevo movimiento**", no "Se envía una petición POST".
- Usar el tratamiento definido en `opciones.tono` de la config.
- Traducir nombres técnicos usando `glosario` de la config.
- En la columna "Motivo / Cómo resolverlo" de cada mensaje de error,
  explicar **qué hacer**, no repetir el mensaje.
- Los nombres de campo (`monto_inicial`) se dejan en `código` porque el
  usuario los ve así en pantalla; su explicación va en lenguaje llano.
- Cuando una regla implique un cálculo (arqueos, totales, descuentos),
  incluirla como bloque de fórmula legible.
- Si un módulo tiene transiciones de estado, agregar un diagrama ASCII.

## Paso 4 — Capturas y render

Capturas (opcional, requiere la app levantada):

```bash
node tools/manual/capture.mjs
```

Recorre el mapa `navegacion` de la config y guarda
`docs/manual/capturas/<modulo>-pantalla.png` — una captura por pantalla, que es
el nombre que el scaffold ya referencia. Opciones: `--solo caja,stock-actual`,
`--headed`, `--full`, `--espacio "Nombre"`.

Reglas, sin excepciones:

- **Las credenciales las carga el usuario** en `MANUAL_USER` / `MANUAL_PASS`.
  Nunca escribirlas en un archivo del repositorio ni tipearlas en un formulario.
- En entornos de producción: **solo lectura**. Navegar y capturar; no crear,
  editar, borrar ni enviar formularios.
- Revisar las capturas antes de entregar: suelen contener datos reales de
  clientes. Anonimizar si el destinatario no es el dueño de esos datos.

Render final:

```bash
node tools/manual/render.mjs --draft   # borrador: muestra huecos y capturas faltantes
node tools/manual/render.mjs           # entregable: oculta lo pendiente
```

Produce `docs/manual/manual.html`, autocontenido y con estilos de impresión.
El PDF se obtiene con Ctrl+P → "Guardar como PDF".

## Actualizar un manual existente

1. Re-ejecutar el paso 1.
2. Comparar contra la versión anterior del modelo (`git diff` sobre
   `system-model.json`) para ver qué cambió.
3. Re-ejecutar el paso 2 **solo si cambió la estructura**; el scaffold
   sobrescribe los capítulos, así que la prosa ya redactada debe conservarse
   con control de versiones o re-aplicarse.
4. Redactar únicamente los módulos afectados.

## Salidas del pipeline

| Archivo | Qué es | Se edita a mano |
| --- | --- | --- |
| `manual.config.yaml` | Configuración, glosario y mapa de navegación | **Sí** |
| `docs/manual/system-model.json` | Hechos extraídos del código | No (generado) |
| `docs/manual/chapters/*.md` | Capítulos del manual | Sí (la prosa) |
| `docs/manual/prosa.md` | Banco de prosa, sobrevive a la regeneración | **Sí** |
| `docs/manual/overrides/*.md` | Capítulos escritos enteros a mano | **Sí** |
| `docs/manual/capturas/*.png` | Capturas de pantalla | No (generadas) |
| `docs/manual/manual.html` | Documento final para PDF | No (generado) |
