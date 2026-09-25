#!/usr/bin/env node
/**
 * Une los capítulos Markdown y produce un documento HTML autocontenido con
 * portada, índice y estilos de impresión → PDF con Ctrl+P → "Guardar como PDF".
 *
 *   node tools/manual/render.mjs [--out docs/manual/manual.html]
 *
 * Si más adelante instalás Typst o Pandoc, este mismo Markdown se convierte
 * a PDF sin intervención del navegador.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

const ROOT = process.cwd();
const CHAPTERS_DIR = path.resolve(ROOT, 'docs/manual/chapters');
const CONFIG_FILE = path.resolve(ROOT, 'manual.config.yaml');

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};
const OUT_FILE = path.resolve(ROOT, getArg('out', 'docs/manual/manual.html'));
const DRAFT = args.includes('--draft'); // muestra los huecos de prosa

const config = yaml.load(fs.readFileSync(CONFIG_FILE, 'utf8'));
const P = config.proyecto ?? {};

// ------------------------------------------------- markdown → html (mínimo)
// El Markdown lo generamos nosotros, así que alcanza con un subconjunto
// controlado: encabezados, tablas, listas, citas, imágenes, énfasis y código.

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  let t = escapeHtml(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${src}" alt="${alt}">`);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
  return t;
}

const headingIds = [];

function slugify(s, i) {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `sec-${i}`
  );
}

function markdownToHtml(mdText) {
  const lines = mdText.split(/\r?\n/);
  const out = [];
  let i = 0;
  let listOpen = null;

  const closeList = () => {
    if (listOpen) {
      out.push(`</${listOpen}>`);
      listOpen = null;
    }
  };

  while (i < lines.length) {
    let line = lines[i];

    // Comentarios de prosa
    if (/^<!--\s*\/?PROSA/.test(line.trim())) {
      i++;
      continue;
    }

    // Tabla
    if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? '')) {
      closeList();
      const header = line.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      out.push('<div class="tabla-wrap"><table>');
      out.push('<thead><tr>' + header.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead>');
      out.push(
        '<tbody>' +
          rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody>',
      );
      out.push('</table></div>');
      continue;
    }

    // Encabezado
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text, headingIds.length);
      if (level <= 3) headingIds.push({ level, text, id });
      const pageBreak = level === 2 ? ' class="salto"' : '';
      out.push(`<h${level} id="${id}"${pageBreak}>${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // Cita / aviso
    if (/^>\s?/.test(line)) {
      closeList();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const body = buf.join(' ').trim();
      const isPendiente = /Pendiente de redacci|_completar_/.test(body);
      if (isPendiente && !DRAFT) continue;
      const cls = isPendiente ? 'aviso pendiente' : /⚠/.test(body) ? 'aviso warn' : 'aviso';
      out.push(`<div class="${cls}">${inline(body)}</div>`);
      continue;
    }

    // Listas
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    const oli = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (li || oli) {
      const want = li ? 'ul' : 'ol';
      if (listOpen !== want) {
        closeList();
        out.push(`<${want}>`);
        listOpen = want;
      }
      out.push(`<li>${inline((li ?? oli)[1])}</li>`);
      i++;
      continue;
    }

    // Imagen sola
    const img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
    if (img) {
      closeList();
      const [, alt, src] = img;
      const abs = path.resolve(CHAPTERS_DIR, src);
      if (fs.existsSync(abs)) {
        out.push(`<figure><img src="${src}" alt="${escapeHtml(alt)}"><figcaption>${escapeHtml(alt)}</figcaption></figure>`);
      } else if (DRAFT) {
        out.push(`<div class="captura-faltante">📷 Captura pendiente: <code>${escapeHtml(src)}</code></div>`);
      }
      i++;
      continue;
    }

    if (!line.trim()) {
      closeList();
      i++;
      continue;
    }

    closeList();
    // Párrafo (acumula líneas contiguas)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^[|>#]|^\s*[-*]\s|^\s*\d+\.\s|^<!--/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  closeList();
  return out.join('\n');
}

// ---------------------------------------------------------------------- main

function main() {
  const files = fs
    .readdirSync(CHAPTERS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const body = files.map((f) => markdownToHtml(fs.readFileSync(path.join(CHAPTERS_DIR, f), 'utf8'))).join('\n');

  const toc = headingIds
    .filter((h) => h.level <= 3)
    .map((h) => `<li class="n${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`)
    .join('\n');

  const fecha = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Manual de usuario — ${escapeHtml(P.nombre ?? '')}</title>
<style>
  :root {
    --primario: ${P.colorPrimario ?? '#1e3a5f'};
    --acento: ${P.colorAcento ?? '#c8102e'};
    --texto: #1a1a1a;
    --suave: #5a6570;
    --borde: #d8dee5;
    --fondo-alt: #f6f8fa;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--texto); line-height: 1.6; margin: 0;
    font-size: 10.5pt;
  }
  .pagina { max-width: 20cm; margin: 0 auto; padding: 2.2cm 2cm; background: #fff; }

  /* ---------- portada ---------- */
  .portada {
    min-height: 96vh; display: flex; flex-direction: column;
    justify-content: center; page-break-after: always;
    border-top: 10px solid var(--primario);
  }
  .portada .kicker { color: var(--acento); font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; font-size: 9pt; margin-bottom: 1.2rem; }
  .portada h1 { font-size: 30pt; line-height: 1.15; margin: 0 0 .4rem; color: var(--primario); }
  .portada h2 { font-size: 15pt; font-weight: 400; color: var(--suave); margin: 0 0 3rem; border: 0; padding: 0; }
  .portada .meta { border-top: 1px solid var(--borde); padding-top: 1.2rem; color: var(--suave); font-size: 9.5pt; }
  .portada .meta strong { color: var(--texto); }

  /* ---------- índice ---------- */
  .toc { page-break-after: always; }
  .toc h2 { border: 0; }
  .toc ul { list-style: none; padding: 0; margin: 0; columns: 1; }
  .toc li { padding: 2px 0; }
  .toc li a { text-decoration: none; color: var(--texto); }
  .toc li.n1 { font-weight: 700; color: var(--primario); margin-top: .9rem; }
  .toc li.n2 { padding-left: 1.1rem; }
  .toc li.n3 { padding-left: 2.3rem; color: var(--suave); font-size: 9.5pt; }

  /* ---------- contenido ---------- */
  h1 { font-size: 20pt; color: var(--primario); }
  h2 { font-size: 16pt; color: var(--primario); margin-top: 2.2rem;
       border-bottom: 2px solid var(--primario); padding-bottom: .35rem; }
  h2.salto { page-break-before: always; }
  h3 { font-size: 12.5pt; color: var(--primario); margin-top: 1.8rem; }
  h4 { font-size: 11pt; margin-top: 1.4rem; color: var(--texto);
       border-left: 3px solid var(--acento); padding-left: .6rem; }
  p { margin: .6rem 0; }
  code { background: var(--fondo-alt); border: 1px solid var(--borde);
         border-radius: 3px; padding: 1px 4px; font-size: .88em;
         font-family: "Cascadia Mono", Consolas, monospace; }

  .tabla-wrap { overflow-x: auto; margin: .8rem 0 1.2rem; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; page-break-inside: avoid; }
  th { background: var(--primario); color: #fff; text-align: left;
       padding: .5rem .6rem; font-weight: 600; }
  td { padding: .45rem .6rem; border-bottom: 1px solid var(--borde); vertical-align: top; }
  tbody tr:nth-child(even) { background: var(--fondo-alt); }

  .aviso { border-left: 4px solid var(--primario); background: var(--fondo-alt);
           padding: .7rem .9rem; margin: 1rem 0; page-break-inside: avoid; }
  .aviso.warn { border-left-color: #d97706; background: #fffbeb; }
  .aviso.pendiente { border-left-color: #94a3b8; background: #f1f5f9; color: var(--suave); font-style: italic; }
  .captura-faltante { border: 1px dashed var(--borde); color: var(--suave);
                      padding: 1.4rem; text-align: center; margin: 1rem 0; border-radius: 6px; }

  figure { margin: 1.2rem 0; page-break-inside: avoid; }
  figure img { width: 100%; border: 1px solid var(--borde); border-radius: 4px; }
  figcaption { font-size: 9pt; color: var(--suave); text-align: center; margin-top: .4rem; }

  /* ---------- impresión ---------- */
  @page { size: A4; margin: 1.8cm 1.6cm; }
  @media print {
    .pagina { max-width: none; padding: 0; }
    .portada { min-height: 24cm; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>
<div class="pagina">

  <section class="portada">
    <div class="kicker">Manual de usuario</div>
    <h1>${escapeHtml(P.nombre ?? 'Sistema')}</h1>
    <h2>${escapeHtml(P.cliente ?? '')}</h2>
    <div class="meta">
      <div>Versión <strong>${escapeHtml(String(P.version ?? '1.0'))}</strong> &nbsp;·&nbsp; ${fecha}</div>
      <div>Elaborado por <strong>${escapeHtml(P.empresa ?? '')}</strong></div>
    </div>
  </section>

  <nav class="toc">
    <h2>Contenido</h2>
    <ul>${toc}</ul>
  </nav>

  ${body}

</div>
</body>
</html>`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, html, 'utf8');
  console.log(`✔ Manual renderizado en ${path.relative(ROOT, OUT_FILE).split(path.sep).join('/')}`);
  console.log(`  ${files.length} capítulos · ${headingIds.length} entradas de índice${DRAFT ? ' · modo BORRADOR' : ''}`);
  console.log(`  Abrilo en el navegador y usá Ctrl+P → "Guardar como PDF".`);
}

main();
