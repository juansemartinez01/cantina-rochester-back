#!/usr/bin/env node
/**
 * Extractor de modelo de conocimiento para manuales de usuario.
 *
 * Recorre el AST de src/ y produce docs/manual/system-model.json con los
 * "hechos" del sistema: endpoints, roles, entidades, campos, validaciones,
 * enums/estados y catálogo de errores.
 *
 * Es 100% determinístico: no usa IA. Misma entrada -> misma salida.
 *
 *   node tools/manual/extract.mjs [--src src] [--out docs/manual/system-model.json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// ---------------------------------------------------------------- argumentos

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const ROOT = process.cwd();
const SRC_DIR = path.resolve(ROOT, getArg('src', 'src'));
const OUT_FILE = path.resolve(ROOT, getArg('out', 'docs/manual/system-model.json'));

const HTTP_DECORATORS = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options'];
const VALIDATION_DECORATORS = new Set([
  'IsString', 'IsInt', 'IsNumber', 'IsBoolean', 'IsDate', 'IsDateString', 'IsArray',
  'IsEnum', 'IsEmail', 'IsUUID', 'IsUrl', 'IsPositive', 'IsNegative', 'IsNotEmpty',
  'IsOptional', 'IsIn', 'IsNotIn', 'IsDecimal', 'IsObject', 'IsDefined',
  'Min', 'Max', 'MinLength', 'MaxLength', 'Length', 'Matches', 'ArrayMinSize',
  'ArrayMaxSize', 'ArrayNotEmpty', 'ValidateNested', 'ValidateIf', 'IsPhoneNumber',
]);
const RELATION_DECORATORS = new Set(['ManyToOne', 'OneToMany', 'ManyToMany', 'OneToOne']);
const EXCEPTION_SUFFIX = /Exception$/;

// ------------------------------------------------------------------ utilidades

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'migrations', '.git'].includes(entry.name)) continue;
      walkFiles(full, acc);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !entry.name.includes('.spec.')) {
      acc.push(full);
    }
  }
  return acc;
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');
const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

/** Nombre del módulo = primer directorio bajo src/ */
function moduleOf(file) {
  const r = path.relative(SRC_DIR, file).split(path.sep);
  return r.length > 1 ? r[0] : '_root';
}

function decoratorsOf(node) {
  if (!ts.canHaveDecorators || !ts.canHaveDecorators(node)) return [];
  return ts.getDecorators(node) ?? [];
}

/** Devuelve { name, args: [valores literales] } de un decorador. */
function readDecorator(dec) {
  const expr = dec.expression;
  if (ts.isCallExpression(expr)) {
    return {
      name: expr.expression.getText(),
      args: expr.arguments.map(literalValue),
      rawArgs: expr.arguments.map((a) => a.getText()),
    };
  }
  return { name: expr.getText(), args: [], rawArgs: [] };
}

/** Intenta reducir un nodo a un valor JS simple; si no, devuelve su texto. */
function literalValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  if (ts.isObjectLiteralExpression(node)) {
    const o = {};
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p)) o[p.name.getText()] = literalValue(p.initializer);
    }
    return o;
  }
  return node.getText();
}

const findDecorator = (decs, name) => decs.find((d) => d.name === name);

// --------------------------------------------------------------- controllers

function extractController(node, sf) {
  const decs = decoratorsOf(node).map(readDecorator);
  const ctrl = findDecorator(decs, 'Controller');
  if (!ctrl) return null;

  const basePath = typeof ctrl.args[0] === 'string' ? ctrl.args[0] : '';
  const classRoles = findDecorator(decs, 'Roles');
  const classPublic = !!findDecorator(decs, 'Public');

  const endpoints = [];

  for (const member of node.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const mDecs = decoratorsOf(member).map(readDecorator);
    const http = mDecs.find((d) => HTTP_DECORATORS.includes(d.name));
    if (!http) continue;

    const subPath = typeof http.args[0] === 'string' ? http.args[0] : '';
    const fullPath = '/' + [basePath, subPath].filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\//, '');

    const roleDec = findDecorator(mDecs, 'Roles') ?? classRoles;
    const isPublic = classPublic || !!findDecorator(mDecs, 'Public');

    // Parámetros del handler
    const pathParams = [];
    const queryParams = [];
    let bodyDto = null;

    for (const p of member.parameters) {
      const pDecs = decoratorsOf(p).map(readDecorator);
      const typeText = p.type ? p.type.getText(sf) : 'any';
      const optional = !!p.questionToken || !!p.initializer;
      const defaultValue = p.initializer ? literalValue(p.initializer) : undefined;

      for (const d of pDecs) {
        const entry = {
          name: typeof d.args[0] === 'string' ? d.args[0] : p.name.getText(),
          type: typeText,
          optional,
          ...(defaultValue !== undefined ? { default: defaultValue } : {}),
        };
        if (d.name === 'Param') pathParams.push(entry);
        else if (d.name === 'Query') {
          // @Query() sin nombre => DTO completo de filtros
          if (typeof d.args[0] === 'string') queryParams.push(entry);
          else queryParams.push({ ...entry, name: '(dto)', dto: typeText });
        } else if (d.name === 'Body') {
          bodyDto = { dto: typeText, property: typeof d.args[0] === 'string' ? d.args[0] : null };
        }
      }
    }

    // ValidationPipe a nivel de método
    const pipe = findDecorator(mDecs, 'UsePipes');
    const validation = pipe
      ? {
          whitelist: /whitelist:\s*true/.test(pipe.rawArgs.join(' ')),
          forbidNonWhitelisted: /forbidNonWhitelisted:\s*true/.test(pipe.rawArgs.join(' ')),
          transform: /transform:\s*true/.test(pipe.rawArgs.join(' ')),
        }
      : null;

    endpoints.push({
      httpMethod: http.name.toUpperCase(),
      path: fullPath,
      handler: member.name.getText(),
      roles: roleDec ? roleDec.args.flat().map(String) : null,
      public: isPublic,
      pathParams,
      queryParams,
      bodyDto,
      validation,
      returns: member.type ? member.type.getText(sf) : null,
      file: rel(sf.fileName),
      line: lineOf(sf, member),
    });
  }

  return {
    className: node.name?.getText() ?? '(anónimo)',
    basePath: '/' + basePath,
    file: rel(sf.fileName),
    endpoints,
  };
}

// ---------------------------------------------------------------------- DTOs

function extractDto(node, sf) {
  const fields = [];

  for (const member of node.members) {
    if (!ts.isPropertyDeclaration(member)) continue;
    const decs = decoratorsOf(member).map(readDecorator);
    const rules = decs.filter((d) => VALIDATION_DECORATORS.has(d.name));
    const typeDec = findDecorator(decs, 'Type');

    const constraints = rules.map((r) => ({
      rule: r.name,
      ...(r.args.length && r.args[0] !== undefined ? { value: r.args[0] } : {}),
    }));

    fields.push({
      name: member.name.getText(),
      type: member.type ? member.type.getText(sf) : 'any',
      required: !member.questionToken && !rules.some((r) => r.name === 'IsOptional'),
      constraints,
      ...(typeDec ? { transformTo: typeDec.rawArgs[0]?.replace(/^\(\)\s*=>\s*/, '') } : {}),
      line: lineOf(sf, member),
    });
  }

  if (!fields.length) return null;
  return { className: node.name?.getText(), file: rel(sf.fileName), fields };
}

// ------------------------------------------------------------------ entidades

function extractEntity(node, sf) {
  const decs = decoratorsOf(node).map(readDecorator);
  const ent = findDecorator(decs, 'Entity');
  if (!ent) return null;

  const columns = [];
  const relations = [];

  for (const member of node.members) {
    if (!ts.isPropertyDeclaration(member)) continue;
    const mDecs = decoratorsOf(member).map(readDecorator);

    const relDec = mDecs.find((d) => RELATION_DECORATORS.has(d.name));
    if (relDec) {
      relations.push({
        name: member.name.getText(),
        kind: relDec.name,
        target: relDec.rawArgs[0]?.replace(/^\(\)\s*=>\s*/, '') ?? null,
        type: member.type ? member.type.getText(sf) : null,
      });
      continue;
    }

    const colDec = mDecs.find((d) =>
      ['Column', 'PrimaryGeneratedColumn', 'PrimaryColumn', 'CreateDateColumn', 'UpdateDateColumn', 'DeleteDateColumn'].includes(d.name),
    );
    if (!colDec) continue;

    const opts = colDec.args.find((a) => a && typeof a === 'object' && !Array.isArray(a)) ?? {};
    columns.push({
      name: member.name.getText(),
      tsType: member.type ? member.type.getText(sf) : null,
      dbType: typeof colDec.args[0] === 'string' ? colDec.args[0] : opts.type ?? null,
      primary: colDec.name.startsWith('Primary'),
      nullable: opts.nullable === true,
      unique: opts.unique === true,
      default: opts.default,
      enum: opts.enum ?? null,
      precision: opts.precision,
      scale: opts.scale,
      auto: ['CreateDateColumn', 'UpdateDateColumn', 'DeleteDateColumn'].includes(colDec.name),
    });
  }

  return {
    className: node.name?.getText(),
    table: typeof ent.args[0] === 'string' ? ent.args[0] : null,
    file: rel(sf.fileName),
    columns,
    relations,
  };
}

// --------------------------------------------------------------------- enums

function extractEnum(node, sf) {
  return {
    name: node.name.getText(),
    file: rel(sf.fileName),
    line: lineOf(sf, node),
    members: node.members.map((m) => ({
      key: m.name.getText(),
      value: m.initializer ? literalValue(m.initializer) : null,
    })),
  };
}

/** `export const X = {...} as const` — patrón de enum usado en el proyecto. */
function extractConstEnum(node, sf) {
  if (!ts.isVariableStatement(node)) return null;
  const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  if (!isExported) return null;

  const out = [];
  for (const d of node.declarationList.declarations) {
    let init = d.initializer;
    if (init && ts.isAsExpression(init)) init = init.expression;
    if (!init || !ts.isObjectLiteralExpression(init)) continue;

    const members = [];
    for (const p of init.properties) {
      if (ts.isPropertyAssignment(p)) {
        members.push({ key: p.name.getText().replace(/['"]/g, ''), value: literalValue(p.initializer) });
      }
    }
    if (members.length) {
      out.push({ name: d.name.getText(), file: rel(sf.fileName), line: lineOf(sf, node), members, constObject: true });
    }
  }
  return out.length ? out : null;
}

// ------------------------------------------------- catálogo de errores/reglas

function extractErrors(sf) {
  const found = [];

  const visit = (node) => {
    if (ts.isThrowStatement(node) && node.expression && ts.isNewExpression(node.expression)) {
      const ctorName = node.expression.expression.getText(sf);
      if (EXCEPTION_SUFFIX.test(ctorName)) {
        const first = node.expression.arguments?.[0];
        let message = null;
        if (first) {
          if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) message = first.text;
          else if (ts.isTemplateExpression(first)) {
            message = first.head.text + first.templateSpans.map((s) => '{' + s.expression.getText(sf) + '}' + s.literal.text).join('');
          } else message = first.getText(sf).slice(0, 200);
        }
        found.push({
          exception: ctorName,
          message,
          method: enclosingMethodName(node, sf),
          file: rel(sf.fileName),
          line: lineOf(sf, node),
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return found;
}

function enclosingMethodName(node, sf) {
  let cur = node.parent;
  while (cur) {
    if (ts.isMethodDeclaration(cur) || ts.isFunctionDeclaration(cur)) {
      const cls = cur.parent && ts.isClassDeclaration(cur.parent) ? cur.parent.name?.getText() : null;
      const m = cur.name?.getText() ?? '(anónimo)';
      return cls ? `${cls}.${m}` : m;
    }
    cur = cur.parent;
  }
  return null;
}

// ------------------------------------------------------------ roles de la app

function extractAppRoles(files) {
  const roleFile = files.find((f) => f.endsWith('roles.constants.ts'));
  if (!roleFile) return [];
  const sf = ts.createSourceFile(roleFile, fs.readFileSync(roleFile, 'utf8'), ts.ScriptTarget.Latest, true);
  let roles = [];
  ts.forEachChild(sf, (node) => {
    const consts = extractConstEnum(node, sf);
    if (consts) {
      for (const c of consts) {
        if (/ROLES?$/i.test(c.name)) roles = c.members.map((m) => String(m.value));
      }
    }
  });
  return roles;
}

// -------------------------------------------------------- detección de guards

function detectGlobalGuards(files) {
  const mainFile = files.find((f) => f.endsWith(path.sep + 'main.ts'));
  const guards = [];
  if (mainFile) {
    const text = fs.readFileSync(mainFile, 'utf8');
    for (const m of text.matchAll(/useGlobalGuards\(\s*new\s+(\w+)/g)) guards.push({ guard: m[1], scope: 'global', file: rel(mainFile) });
  }
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    if (/APP_GUARD/.test(text)) {
      for (const m of text.matchAll(/useClass:\s*(\w+)/g)) guards.push({ guard: m[1], scope: 'global(APP_GUARD)', file: rel(f) });
    }
  }
  return guards;
}

// --------------------------------------------------------------------- main

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`No existe el directorio de fuentes: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = walkFiles(SRC_DIR);
  const modules = new Map();

  const ensureModule = (name) => {
    if (!modules.has(name)) {
      modules.set(name, { name, controllers: [], entities: [], dtos: [], enums: [], errors: [] });
    }
    return modules.get(name);
  };

  let rolesUsedAnywhere = false;

  for (const file of files) {
    const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const mod = ensureModule(moduleOf(file));

    ts.forEachChild(sf, (node) => {
      if (ts.isClassDeclaration(node)) {
        const ctrl = extractController(node, sf);
        if (ctrl) {
          mod.controllers.push(ctrl);
          if (ctrl.endpoints.some((e) => e.roles)) rolesUsedAnywhere = true;
          return;
        }
        const ent = extractEntity(node, sf);
        if (ent) {
          mod.entities.push(ent);
          return;
        }
        const name = node.name?.getText() ?? '';
        if (/Dto$/.test(name) || file.includes(`${path.sep}dto${path.sep}`)) {
          const dto = extractDto(node, sf);
          if (dto) mod.dtos.push(dto);
        }
        return;
      }

      if (ts.isEnumDeclaration(node)) {
        mod.enums.push(extractEnum(node, sf));
        return;
      }

      const consts = extractConstEnum(node, sf);
      if (consts) mod.enums.push(...consts);
    });

    // Errores solo desde services/controllers (donde vive la regla de negocio)
    if (/\.(service|controller)\.ts$/.test(file)) {
      mod.errors.push(...extractErrors(sf));
    }
  }

  const moduleList = [...modules.values()]
    .filter((m) => m.controllers.length || m.entities.length || m.dtos.length || m.enums.length || m.errors.length)
    .sort((a, b) => a.name.localeCompare(b.name));

  const endpointCount = moduleList.reduce((n, m) => n + m.controllers.reduce((k, c) => k + c.endpoints.length, 0), 0);

  const model = {
    project: path.basename(ROOT),
    generatedAt: new Date().toISOString(),
    stack: 'NestJS + TypeORM',
    security: {
      globalGuards: detectGlobalGuards(files),
      declaredRoles: extractAppRoles(files),
      roleDecoratorsInUse: rolesUsedAnywhere,
      warning: rolesUsedAnywhere
        ? null
        : 'No se encontró ningún @Roles() aplicado. La autorización por rol no está siendo aplicada en el backend; la matriz de permisos del manual no puede derivarse del código.',
    },
    stats: {
      modules: moduleList.length,
      endpoints: endpointCount,
      entities: moduleList.reduce((n, m) => n + m.entities.length, 0),
      dtos: moduleList.reduce((n, m) => n + m.dtos.length, 0),
      enums: moduleList.reduce((n, m) => n + m.enums.length, 0),
      errorMessages: moduleList.reduce((n, m) => n + m.errors.length, 0),
    },
    modules: moduleList,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(model, null, 2), 'utf8');

  console.log(`✔ Modelo escrito en ${rel(OUT_FILE)}`);
  console.table(model.stats);
  if (model.security.warning) console.warn(`\n⚠  ${model.security.warning}`);
}

main();
