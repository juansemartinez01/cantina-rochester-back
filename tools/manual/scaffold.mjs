#!/usr/bin/env node
/**
 * Genera el esqueleto del manual en Markdown a partir de system-model.json
 * + manual.config.yaml.
 *
 * Todo lo FACTUAL (campos, validaciones, estados, errores, permisos) se
 * escribe aquí de forma determinística: la IA nunca lo inventa.
 * Lo que queda para redacción quedan marcados con bloques <!-- PROSA:x -->.
 *
 *   node tools/manual/scaffold.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

const ROOT = process.cwd();
const MODEL_FILE = path.resolve(ROOT, 'docs/manual/system-model.json');
const CONFIG_FILE = path.resolve(ROOT, 'manual.config.yaml');
const OUT_DIR = path.resolve(ROOT, 'docs/manual/chapters');
const PROSA_FILE = path.resolve(ROOT, 'docs/manual/prosa.md');
const OVERRIDE_DIR = path.resolve(ROOT, 'docs/manual/overrides');

const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf8'));
const config = yaml.load(fs.readFileSync(CONFIG_FILE, 'utf8'));

// ------------------------------------------------------- preservación de prosa
//
// El scaffold regenera los capítulos desde cero en cada release. Para que eso
// no borre lo ya redactado, la prosa vive fuera de los capítulos:
//
//   docs/manual/prosa.md        banco de textos, uno por id de bloque PROSA
//   docs/manual/overrides/*.md  capítulos escritos enteros a mano (ganan siempre)
//
// Antes de regenerar se "cosecha" lo que haya en los capítulos actuales, así
// editar el capítulo directamente también funciona: el texto se recupera.

const BLOQUE_RE = /<!-- PROSA:([^\s>]+) -->\n?([\s\S]*?)<!-- \/PROSA -->/g;
const esPlaceholder = (t) => /^>\s*_Pendiente de redacción/.test(t.trim()) || !t.trim();

/** Lee el banco de prosa a un Map id -> texto. */
function loadProsa() {
  const store = new Map();
  if (!fs.existsSync(PROSA_FILE)) return store;
  for (const [, id, cuerpo] of fs.readFileSync(PROSA_FILE, 'utf8').matchAll(BLOQUE_RE)) {
    if (!esPlaceholder(cuerpo)) store.set(id, cuerpo.trim());
  }
  return store;
}

/** Recupera del capítulo cualquier bloque ya redactado y lo suma al banco. */
function harvestProsa(store) {
  if (!fs.existsSync(OUT_DIR)) return 0;
  let nuevos = 0;
  for (const f of fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.md'))) {
    const texto = fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
    for (const [, id, cuerpo] of texto.matchAll(BLOQUE_RE)) {
      if (esPlaceholder(cuerpo)) continue;
      const limpio = cuerpo.trim();
      if (store.get(id) !== limpio) {
        store.set(id, limpio);
        nuevos++;
      }
    }
  }
  return nuevos;
}

function saveProsa(store) {
  const ids = [...store.keys()].sort((a, b) => a.localeCompare(b, 'es'));
  const cuerpo = ids.map((id) => `<!-- PROSA:${id} -->\n${store.get(id)}\n<!-- /PROSA -->`).join('\n\n');
  fs.mkdirSync(path.dirname(PROSA_FILE), { recursive: true });
  fs.writeFileSync(
    PROSA_FILE,
    `<!--\n  Banco de prosa del manual.\n\n  Este archivo SOBREVIVE a la regeneración de capítulos: es la fuente de\n  verdad de todo lo redactado a mano. Se puede editar aquí o directamente en\n  docs/manual/chapters/*.md (en ese caso, el próximo scaffold lo recupera).\n\n  NO tocar los marcadores de apertura y cierre: son la clave de cada texto.\n-->\n\n${cuerpo}\n`,
    'utf8',
  );
}

const prosaStore = loadProsa();

// ------------------------------------------------------------------ índices

const enumIndex = new Map();
const dtoIndex = new Map();
for (const m of model.modules) {
  for (const e of m.enums) enumIndex.set(e.name, e);
  for (const d of m.dtos) dtoIndex.set(d.className, d);
}

const moduleCfg = new Map((config.modulos ?? []).map((m) => [m.id, m]));

// ---------------------------------------------------------------- utilidades

/** obtenerVentasPorCategoria -> "Obtener ventas por categoría" (aproximado) */
function humanize(name) {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const md = {
  table(headers, rows) {
    if (!rows.length) return '';
    const esc = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const out = [
      `| ${headers.join(' | ')} |`,
      `| ${headers.map(() => '---').join(' | ')} |`,
      ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`),
    ];
    return out.join('\n') + '\n';
  },
  /** Texto -> identificador estable y corto, para claves de prosa. */
  slug(texto) {
    return String(texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60);
  },
  prosa(id, hint) {
    const escrito = prosaStore.get(id);
    const cuerpo = escrito ?? `> _Pendiente de redacción — ${hint}_`;
    return `<!-- PROSA:${id} -->\n${cuerpo}\n<!-- /PROSA -->\n`;
  },
};

/** Traduce decoradores de class-validator a lenguaje de usuario. */
function describeConstraints(field) {
  const parts = [];
  const byRule = new Map(field.constraints.map((c) => [c.rule, c]));

  const typeLabel = () => {
    if (byRule.has('IsInt')) return 'Número entero';
    if (byRule.has('IsNumber') || byRule.has('IsDecimal')) return 'Número';
    if (byRule.has('IsBoolean')) return 'Sí / No';
    if (byRule.has('IsDateString') || byRule.has('IsDate')) return 'Fecha';
    if (byRule.has('IsEmail')) return 'Correo electrónico';
    if (byRule.has('IsArray')) return 'Lista';
    if (byRule.has('IsEnum')) return 'Opción de lista';
    if (byRule.has('IsString')) return 'Texto';
    return field.type?.replace(/\[\]$/, ' (lista)') ?? 'Texto';
  };

  if (byRule.has('IsEnum')) {
    const enumName = field.type?.replace(/\[\]/g, '').trim();
    const en = enumIndex.get(enumName);
    if (en) parts.push(`Valores: ${en.members.map((x) => `\`${x.value ?? x.key}\``).join(', ')}`);
  }
  if (byRule.has('IsIn')) {
    const v = byRule.get('IsIn').value;
    if (Array.isArray(v)) parts.push(`Valores: ${v.map((x) => `\`${x}\``).join(', ')}`);
  }

  const min = byRule.get('Min')?.value;
  const max = byRule.get('Max')?.value;
  if (min !== undefined && max !== undefined) parts.push(`Entre ${min} y ${max}`);
  else if (min !== undefined) parts.push(`Mínimo ${min}`);
  else if (max !== undefined) parts.push(`Máximo ${max}`);

  const minLen = byRule.get('MinLength')?.value;
  const maxLen = byRule.get('MaxLength')?.value;
  if (minLen !== undefined) parts.push(`Mín. ${minLen} caracteres`);
  if (maxLen !== undefined) parts.push(`Máx. ${maxLen} caracteres`);

  if (byRule.has('IsPositive')) parts.push('Debe ser mayor a cero');
  if (byRule.has('ArrayNotEmpty')) parts.push('Debe tener al menos un elemento');
  const aMin = byRule.get('ArrayMinSize')?.value;
  if (aMin !== undefined) parts.push(`Al menos ${aMin} elemento(s)`);
  if (byRule.has('Matches')) parts.push(`Debe cumplir el formato \`${byRule.get('Matches').value}\``);

  return { tipo: typeLabel(), reglas: parts.join('. ') || '—' };
}

/** Tabla de campos de un DTO, expandiendo un nivel de DTOs anidados. */
function fieldsTable(dtoName, depth = 0) {
  const dto = dtoIndex.get(dtoName);
  if (!dto) return { markdown: '', nested: [] };

  const rows = [];
  const nested = [];

  for (const f of dto.fields) {
    const { tipo, reglas } = describeConstraints(f);
    const childName = (f.transformTo ?? f.type ?? '').replace(/\[\]/g, '').trim();
    if (depth === 0 && dtoIndex.has(childName) && childName !== dtoName) nested.push(childName);
    rows.push([
      `\`${f.name}\``,
      tipo,
      f.required ? '**Sí**' : 'No',
      reglas,
    ]);
  }

  return {
    markdown: md.table(['Campo', 'Tipo', 'Obligatorio', 'Reglas'], rows),
    nested: [...new Set(nested)],
  };
}

/** Errores cuyo método coincide con el handler del endpoint. */
function errorsForHandler(mod, handler) {
  return mod.errors.filter((e) => {
    const method = (e.method ?? '').split('.').pop();
    return method === handler;
  });
}

// ---------------------------------------------------------- capítulo módulo

function buildModuleChapter(mod, cfg, index) {
  const titulo = cfg.titulo ?? humanize(mod.name);
  const L = [];

  L.push(`## ${index}. ${titulo}\n`);

  // Propósito (prosa)
  L.push(`### ${index}.1 Para qué sirve\n`);
  const glos = config.glosario ?? {};
  const glosHit = Object.entries(glos).find(([k]) => k.toLowerCase().replace(/[^a-z]/g, '') === mod.name.replace(/[^a-z]/g, ''));
  if (glosHit) L.push(`${glosHit[1]}\n`);
  L.push(md.prosa(`${mod.name}.proposito`, `describir en 2-4 frases qué resuelve "${titulo}" para el usuario`));

  // Cómo llegar — desde el mapa de navegación relevado de la app
  L.push(`\n### ${index}.2 Cómo llegar\n`);
  const nav = (config.navegacion ?? {})[mod.name];
  if (nav) {
    L.push(`En el menú lateral, abra **${nav.menu}** y elija **${nav.item}**.\n`);
    if (nav.tituloPantalla) L.push(`\nLa pantalla se titula *${nav.tituloPantalla}*.\n`);
    if (nav.nota) L.push(`\n${nav.nota}\n`);
    for (const alt of nav.tambienEn ?? []) {
      L.push(`\nTambién disponible en **${alt.menu} → ${alt.item}** (*${alt.tituloPantalla}*).\n`);
    }
    if (config.opciones?.incluirCapturas) {
      L.push(`\n![Pantalla ${nav.tituloPantalla ?? titulo}](../capturas/${mod.name}-pantalla.png)\n`);
    }
  } else {
    L.push(md.prosa(`${mod.name}.navegacion`, 'completar con la ruta de menú real de la aplicación'));
  }

  // Acciones
  const endpoints = mod.controllers.flatMap((c) => c.endpoints);
  if (endpoints.length) {
    L.push(`\n### ${index}.3 Acciones disponibles\n`);

    let sub = 0;
    for (const ep of endpoints) {
      sub++;
      L.push(`\n#### ${index}.3.${sub} ${humanize(ep.handler)}\n`);

      L.push(md.prosa(`${mod.name}.${ep.handler}.pasos`, 'redactar el paso a paso numerado desde la interfaz'));

      // Filtros / parámetros de búsqueda
      if (ep.queryParams.length) {
        const rows = ep.queryParams.map((q) => [
          `\`${q.name}\``,
          q.dto ? `Ver DTO \`${q.dto}\`` : q.type,
          q.optional ? 'No' : '**Sí**',
          q.default !== undefined ? `Por defecto: \`${q.default}\`` : '—',
        ]);
        L.push(`\n**Filtros disponibles**\n`);
        L.push(md.table(['Filtro', 'Tipo', 'Obligatorio', 'Observación'], rows));
      }

      // Campos del formulario
      if (ep.bodyDto?.dto) {
        const { markdown, nested } = fieldsTable(ep.bodyDto.dto);
        if (markdown) {
          L.push(`\n**Datos a completar**\n`);
          L.push(markdown);
          for (const n of nested) {
            const child = fieldsTable(n, 1);
            if (child.markdown) {
              L.push(`\n*Detalle de \`${humanize(n.replace(/Dto$/, '').replace(/^Create/, ''))}\`*\n`);
              L.push(child.markdown);
            }
          }
        }
        if (ep.validation?.forbidNonWhitelisted) {
          L.push(`\n> ⚠️ Este formulario rechaza cualquier dato que no esté en la lista anterior.\n`);
        }
      }

      // Errores propios de la acción
      const errs = errorsForHandler(mod, ep.handler);
      if (errs.length && config.opciones?.incluirCatalogoErrores) {
        L.push(`\n**Mensajes que puede mostrar el sistema**\n`);
        L.push(
          md.table(
            ['Mensaje', 'Motivo / Cómo resolverlo'],
            errs.map((e) => [
              e.message ?? '(sin texto)',
              md.prosa(`${mod.name}.error.${md.slug(e.message ?? 'sin-texto')}`, 'explicar qué hacer').trim(),
            ]),
          ),
        );
      }
    }
  }

  // Estados
  if (mod.enums.length && config.opciones?.incluirDiagramasEstado) {
    L.push(`\n### ${index}.4 Estados y opciones\n`);
    for (const en of mod.enums) {
      L.push(`\n**${humanize(en.name)}**\n`);
      L.push(
        md.table(
          ['Valor', 'Significado'],
          en.members.map((m) => [
            `\`${m.value ?? m.key}\``,
            md.prosa(`${mod.name}.${md.slug(en.name)}.${md.slug(m.value ?? m.key)}`, 'explicar el significado').trim(),
          ]),
        ),
      );
    }
  }

  // Errores restantes del módulo
  const handlers = new Set(endpoints.map((e) => e.handler));
  const otros = mod.errors.filter((e) => !handlers.has((e.method ?? '').split('.').pop()));
  if (otros.length && config.opciones?.incluirCatalogoErrores) {
    L.push(`\n### ${index}.5 Otras validaciones del módulo\n`);
    L.push(
      md.table(
        ['Mensaje', 'Se produce en'],
        otros.map((e) => [e.message ?? '(sin texto)', humanize((e.method ?? '').split('.').pop() ?? '')]),
      ),
    );
  }

  return L.join('\n');
}

// -------------------------------------------------------------- anexos

function buildPermissionsAnnex() {
  const L = ['## Anexo A. Perfiles y permisos\n'];

  for (const [rol, desc] of Object.entries(config.roles ?? {})) {
    L.push(`**${rol}** — ${desc}\n`);
  }

  if (!model.security.roleDecoratorsInUse) {
    L.push(
      `\n> ⚠️ **Nota técnica para el equipo (quitar del entregable al cliente):** ` +
        `el backend exige inicio de sesión en todos los endpoints, pero **no restringe por rol**: ` +
        `no hay ningún \`@Roles()\` aplicado. La tabla siguiente describe el comportamiento *previsto*, ` +
        `no el que el sistema aplica hoy.\n`,
    );
  }

  const rows = [];
  for (const mod of model.modules) {
    const cfg = moduleCfg.get(mod.name);
    if (!cfg || cfg.incluir === false) continue;
    const eps = mod.controllers.flatMap((c) => c.endpoints);
    if (!eps.length) continue;
    rows.push([cfg.titulo ?? humanize(mod.name), eps.length, '—', '—', '—']);
  }

  L.push('\n' + md.table(['Módulo', 'Acciones', 'Admin', 'Vendedor', 'Cocina'], rows));
  L.push('\n> Completar la matriz con ✔ / ✖ según la política de acceso definida con el cliente.\n');
  return L.join('\n');
}

function buildErrorAnnex() {
  const rows = [];
  for (const mod of model.modules) {
    const cfg = moduleCfg.get(mod.name);
    if (!cfg || cfg.incluir === false) continue;
    for (const e of mod.errors) {
      rows.push([e.message ?? '(sin texto)', cfg.titulo ?? humanize(mod.name)]);
    }
  }
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'es'));
  return `## Anexo B. Catálogo completo de mensajes del sistema\n\n` + md.table(['Mensaje', 'Módulo'], rows);
}

function buildGlossaryAnnex() {
  const rows = Object.entries(config.glosario ?? {}).map(([k, v]) => [humanize(k), v]);
  return `## Anexo C. Glosario\n\n` + md.table(['Término', 'Significado'], rows);
}

// ---------------------------------------------------------------------- main

function main() {
  // Rescatar lo redactado ANTES de borrar nada.
  const cosechados = harvestProsa(prosaStore);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const written = [];
  const respetados = [];
  const write = (file, content) => {
    const override = path.join(OVERRIDE_DIR, file);
    if (fs.existsSync(override)) {
      fs.copyFileSync(override, path.join(OUT_DIR, file));
      respetados.push(file);
    } else {
      fs.writeFileSync(path.join(OUT_DIR, file), content, 'utf8');
    }
    written.push(file);
  };

  // Introducción
  write(
    '00-introduccion.md',
    `## Introducción\n\n` +
      md.prosa('intro.bienvenida', `presentar el sistema "${config.proyecto.nombre}" al usuario final`) +
      `\n### A quién está dirigido\n\n` +
      Object.entries(config.roles ?? {})
        .map(([r, d]) => `- **${r}**: ${d}`)
        .join('\n') +
      `\n\n### Cómo usar este manual\n\n` +
      md.prosa('intro.uso', 'explicar la estructura del documento y las convenciones tipográficas') +
      `\n`,
  );

  // Capítulos por módulo, en el orden del config
  let n = 0;
  for (const cfg of config.modulos ?? []) {
    if (cfg.incluir === false) continue;
    const mod = model.modules.find((m) => m.name === cfg.id);
    if (!mod) {
      console.warn(`⚠  Módulo "${cfg.id}" declarado en la config pero no encontrado en el código.`);
      continue;
    }
    n++;
    const slug = String(n).padStart(2, '0');
    write(`${slug}-${cfg.id}.md`, buildModuleChapter(mod, cfg, n));
  }

  if (config.opciones?.incluirMatrizPermisos) write('90-anexo-permisos.md', buildPermissionsAnnex());
  if (config.opciones?.incluirCatalogoErrores) write('91-anexo-errores.md', buildErrorAnnex());
  write('92-anexo-glosario.md', buildGlossaryAnnex());

  saveProsa(prosaStore);

  // Recuento de huecos de prosa
  let huecos = 0;
  for (const f of written) {
    const texto = fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
    for (const [, , cuerpo] of texto.matchAll(BLOQUE_RE)) if (esPlaceholder(cuerpo)) huecos++;
  }

  console.log(`✔ ${written.length} capítulos generados en docs/manual/chapters/`);
  console.log(`  ${n} módulos documentados`);
  if (cosechados) console.log(`  ${cosechados} textos rescatados de los capítulos anteriores`);
  console.log(`  ${prosaStore.size} textos conservados en docs/manual/prosa.md`);
  if (respetados.length) {
    console.log(`  ${respetados.length} capítulos escritos a mano respetados: ${respetados.join(', ')}`);
  }
  console.log(`  ${huecos} bloques de prosa pendientes de redacción por la IA`);
}

main();
