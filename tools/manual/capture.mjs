#!/usr/bin/env node
/**
 * Captura las pantallas de la aplicación para el manual de usuario.
 *
 * Recorre el mapa `navegacion` de manual.config.yaml y guarda un PNG por
 * pantalla en docs/manual/capturas/<modulo>-pantalla.png, que es exactamente
 * el nombre que el scaffold referencia.
 *
 * CREDENCIALES
 * ------------
 * Nunca se escriben en el repositorio. El script las lee del entorno:
 *
 *   PowerShell:
 *     $env:MANUAL_USER="usuario@dominio.com"; $env:MANUAL_PASS="..."
 *     node tools/manual/capture.mjs
 *
 * Agregá un usuario de solo lectura si vas a correr esto contra producción.
 *
 * OPCIONES
 *   --espacio "Almacen Principal"   espacio de trabajo a seleccionar
 *   --solo caja,stock-actual        capturar únicamente esos módulos
 *   --headed                        ver el navegador mientras trabaja
 *   --full                          página completa en vez de solo el viewport
 *   --diagnostico                   listar campos y botones de cada pantalla
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Falta Playwright. Instalalo con:\n  npm i -D playwright\n  npx playwright install chromium');
  process.exit(1);
}

const ROOT = process.cwd();
const config = yaml.load(fs.readFileSync(path.resolve(ROOT, 'manual.config.yaml'), 'utf8'));
const OUT_DIR = path.resolve(ROOT, 'docs/manual/capturas');

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const USER = process.env.MANUAL_USER;
const PASS = process.env.MANUAL_PASS;
const ESPACIO = getArg('espacio', config.espacios?.[0]?.nombre ?? '');
const SOLO = getArg('solo', '').split(',').filter(Boolean);
const HEADED = args.includes('--headed');
const FULL = args.includes('--full');
const DIAG = args.includes('--diagnostico');

const BASE = config.frontend.urlBase;
const TIMEOUT = config.frontend.timeoutCargaMs ?? 20000;
const VP = config.frontend.viewport ?? { ancho: 1366, alto: 900 };

if (!USER || !PASS) {
  console.error(
    'Faltan credenciales. Definí MANUAL_USER y MANUAL_PASS en el entorno antes de correr el script.\n' +
      '  PowerShell:  $env:MANUAL_USER="..."; $env:MANUAL_PASS="..."',
  );
  process.exit(1);
}

/**
 * Espera a que la pantalla tenga datos de verdad.
 * La app tarda ~10 s en responder y muestra esqueletos mientras tanto, así que
 * un timeout fijo no alcanza: esperamos a que desaparezcan los placeholders.
 */
async function esperarContenido(page) {
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT }).catch(() => {});
  await page
    .waitForFunction(
      () => {
        const esqueletos = document.querySelectorAll(
          '[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"]',
        );
        return esqueletos.length === 0;
      },
      { timeout: TIMEOUT },
    )
    .catch(() => {
      console.warn('    (seguían apareciendo esqueletos de carga; capturo igual)');
    });
  await page.waitForTimeout(800); // asentar animaciones
}

/** Imprime qué hay realmente en la página. Sirve para ajustar los selectores. */
async function diagnostico(page, etiqueta) {
  const info = await page.evaluate(() => ({
    url: location.href,
    titulo: document.title,
    inputs: [...document.querySelectorAll('input, select, textarea')].map((e) => ({
      tag: e.tagName.toLowerCase(),
      type: e.type ?? '',
      name: e.name ?? '',
      id: e.id ?? '',
      placeholder: e.placeholder ?? '',
      visible: !!(e.offsetWidth || e.offsetHeight),
    })),
    botones: [...document.querySelectorAll('button, a[role="button"], input[type="submit"]')]
      .map((e) => (e.innerText || e.value || '').trim())
      .filter(Boolean),
    encabezados: [...document.querySelectorAll('h1, h2, h3')].map((e) => e.textContent.trim()).filter(Boolean),
  }));
  console.log(`\n--- DIAGNÓSTICO (${etiqueta}) ---`);
  console.log(JSON.stringify(info, null, 2));
  console.log('--- FIN DIAGNÓSTICO ---\n');
  return info;
}

async function login(page) {
  console.log('→ Iniciando sesión…');
  await page.goto(`${BASE}${config.frontend.rutaInicio}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  if (DIAG) await diagnostico(page, 'pantalla inicial');

  // El campo de usuario puede no declararse como type="email".
  const email = page
    .locator(
      'input[type="email"], input[name*="mail" i], input[name*="user" i], input[id*="mail" i], ' +
        'input[placeholder*="mail" i], input[placeholder*="usuario" i]',
    )
    .first();
  try {
    await email.waitFor({ timeout: TIMEOUT });
  } catch (e) {
    await diagnostico(page, 'no se encontró el campo de usuario');
    const shot = path.join(OUT_DIR, '_diagnostico-login.png');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({ path: shot });
    console.error(`Captura de la pantalla guardada en ${path.relative(ROOT, shot)}`);
    throw e;
  }
  await email.fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.getByRole('button', { name: /iniciar sesi|ingresar|entrar|acceder|login/i }).first().click();

  // Selección de espacio de trabajo
  const tarjeta = page.locator('div', { hasText: ESPACIO }).last();
  await tarjeta.waitFor({ timeout: TIMEOUT }).catch(() => {});
  const seleccionar = page.getByRole('button', { name: /seleccionar|ingresar/i }).first();
  if (await seleccionar.isVisible().catch(() => false)) {
    await seleccionar.click();
  }
  await esperarContenido(page);
  console.log('  sesión iniciada.');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const nav = config.navegacion ?? {};
  const objetivos = Object.entries(nav).filter(([id]) => !SOLO.length || SOLO.includes(id));

  if (!objetivos.length) {
    console.error('No hay pantallas para capturar. Revisá la sección `navegacion` de manual.config.yaml.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    viewport: { width: VP.ancho, height: VP.alto },
    deviceScaleFactor: 2, // capturas nítidas para impresión
    locale: 'es-AR',
  });
  const page = await context.newPage();

  const ok = [];
  const fallidas = [];

  try {
    await login(page);

    // Evita capturar dos veces la misma ruta (varios módulos comparten pantalla)
    const vistas = new Map();

    for (const [id, item] of objetivos) {
      const destino = `${BASE}${item.ruta}`;
      const archivo = path.join(OUT_DIR, `${id}-pantalla.png`);
      console.log(`→ ${id}  ${item.ruta}`);

      if (vistas.has(item.ruta)) {
        fs.copyFileSync(vistas.get(item.ruta), archivo);
        console.log(`    reutiliza la captura de ${path.basename(vistas.get(item.ruta))}`);
        ok.push(id);
        continue;
      }

      try {
        await page.goto(destino, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await esperarContenido(page);
        await page.screenshot({ path: archivo, fullPage: FULL });
        vistas.set(item.ruta, archivo);
        ok.push(id);
        console.log(`    ✔ ${path.relative(ROOT, archivo).split(path.sep).join('/')}`);
      } catch (e) {
        fallidas.push({ id, error: e.message.split('\n')[0] });
        console.warn(`    ✖ ${e.message.split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n✔ ${ok.length} capturas guardadas en docs/manual/capturas/`);
  if (fallidas.length) {
    console.warn(`✖ ${fallidas.length} fallidas:`);
    for (const f of fallidas) console.warn(`   ${f.id}: ${f.error}`);
  }
  console.log('\nRecordá revisar las capturas antes de entregar: pueden contener datos reales de clientes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
