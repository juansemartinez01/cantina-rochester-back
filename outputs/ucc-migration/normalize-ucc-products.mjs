import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputPath = "C:/Users/juans/Downloads/Productos Bar UCC (1).xlsx";
const outputDir = "C:/Users/juans/OneDrive/Desktop/Proyectos/gestion-stock-backend - Rochester/outputs/ucc-migration";
const outputPath = path.join(outputDir, "productos-bar-ucc-normalizado.xlsx");

const HEADERS = [
  "sku",
  "barcode",
  "nombre",
  "descripcion",
  "categoria",
  "unidad",
  "es_por_gramos",
  "proveedor",
  "activo",
  "precio_base",
  "precio_almacen1",
  "en_oferta",
  "precio_oferta",
  "stock_unidades",
  "stock_gramos",
];

function cleanText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function cleanBarcode(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value);
  }
  const text = String(value).trim();
  if (text === "") return null;
  if (/^\d+\.0$/.test(text)) return text.replace(/\.0$/, "");
  return text;
}

function cleanNumber(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const number = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(number) ? number : null;
}

function normalizeCategory(value) {
  const category = cleanText(value);
  if (!category) return null;
  return category.toUpperCase() === "KIOSKO" ? "KIOSCO" : category;
}

const sourceBlob = await FileBlob.load(inputPath);
const sourceWorkbook = await SpreadsheetFile.importXlsx(sourceBlob);
const sourceSheet = sourceWorkbook.worksheets.getItem("Hoja1");
const sourceValues = sourceSheet.getRange("A1:O179").values;

const rows = sourceValues.slice(1).filter((row) =>
  row.some((value) => value != null && value !== ""),
);

const normalizedRows = rows.map((row, index) => {
  const originalBarcode = cleanBarcode(row[1]);
  const barcode = originalBarcode ?? `UCC-INT-${String(index + 1).padStart(4, "0")}`;
  const precioBase = cleanNumber(row[9]);
  const precioAlmacen = cleanNumber(row[10]) ?? precioBase;

  return [
    `UCC-${String(index + 1).padStart(4, "0")}`,
    barcode,
    cleanText(row[2]),
    cleanText(row[3]),
    normalizeCategory(row[4]),
    "Unidad",
    "NO",
    cleanText(row[7]) ?? "Proveedor generico",
    "SI",
    precioBase,
    precioAlmacen,
    "NO",
    null,
    0,
    null,
  ];
});

const outWorkbook = Workbook.create();
const productsSheet = outWorkbook.worksheets.add("Productos");
productsSheet.getRange(`B2:B${normalizedRows.length + 1}`).format.numberFormat = "@";
productsSheet.getRangeByIndexes(0, 0, normalizedRows.length + 1, HEADERS.length).values = [
  HEADERS,
  ...normalizedRows,
];

productsSheet.freezePanes.freezeRows(1);
productsSheet.getRange("A1:O1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
};
productsSheet.getRange(`A1:O${normalizedRows.length + 1}`).format.borders = {
  preset: "all",
  style: "thin",
  color: "#D9E2F3",
};
productsSheet.getRange(`J2:K${normalizedRows.length + 1}`).format.numberFormat = "#,##0.00";
productsSheet.getRange(`N2:N${normalizedRows.length + 1}`).format.numberFormat = "#,##0";
productsSheet.getRange("A:O").format.autofitColumns();
productsSheet.getRange("B:B").format.columnWidthPx = 130;
productsSheet.getRange("C:C").format.columnWidthPx = 300;
productsSheet.getRange("H:H").format.columnWidthPx = 145;

const summarySheet = outWorkbook.worksheets.add("Resumen");
summarySheet.getRange("A1:B10").values = [
  ["Campo", "Valor"],
  ["Productos", normalizedRows.length],
  ["SKUs", "UCC-0001 a UCC-0178"],
  ["Barcodes internos generados", normalizedRows.filter((row) => String(row[1]).startsWith("UCC-INT-")).length],
  ["Categorias", [...new Set(normalizedRows.map((row) => row[4]))].sort().join(", ")],
  ["Unidad", "Unidad"],
  ["Proveedor default", "Proveedor generico"],
  ["Stock inicial", 0],
  ["Precio almacen", "Igual a precio_base"],
  ["KIOSKO", "Unificado en KIOSCO"],
];
summarySheet.getRange("A1:B1").format = {
  fill: "#548235",
  font: { bold: true, color: "#FFFFFF" },
};
summarySheet.getRange("A1:B10").format.borders = {
  preset: "all",
  style: "thin",
  color: "#E2F0D9",
};
summarySheet.getRange("A:B").format.autofitColumns();

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(outWorkbook);
await output.save(outputPath);

console.log(JSON.stringify({
  outputPath,
  products: normalizedRows.length,
  internalBarcodes: normalizedRows.filter((row) => String(row[1]).startsWith("UCC-INT-")).length,
  categories: [...new Set(normalizedRows.map((row) => row[4]))].sort(),
}, null, 2));
