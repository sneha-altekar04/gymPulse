import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/01a0e10b-3b2b-79d0-9a8e-be77c75dbb5d";
const outputPath = `${outputDir}/GymPulse_Editable_Client_Invoice.xlsx`;
const qaDir = `${outputDir}/qa_invoice`;

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Invoice");
sheet.showGridLines = false;
sheet.tabColor = "#071A2D";

const NAVY = "#071A2D";
const BLUE = "#0C8CE9";
const ORANGE = "#FF7A21";
const PALE_BLUE = "#EAF5FD";
const PALE_ORANGE = "#FFF1E8";
const INPUT = "#FFF2CC";
const INK = "#142033";
const MUTED = "#5E6B7C";
const LINE = "#D8E1EB";
const WHITE = "#FFFFFF";
const FONT = "Arial";
const INR = '[$₹-en-IN] #,##0;[Red]-[$₹-en-IN] #,##0';

const all = sheet.getRange("A1:H42");
all.format.font = { name: FONT, size: 10, color: INK };
all.format.verticalAlignment = "center";

const widths = [4, 18, 18, 20, 20, 17, 17, 16];
for (let i = 0; i < widths.length; i += 1) {
  sheet.getRangeByIndexes(0, i, 42, 1).format.columnWidth = widths[i];
}

function mergeWrite(address, value) {
  sheet.mergeCells(address);
  sheet.getRange(address).values = [[value]];
  return sheet.getRange(address);
}

function border(range, preset = "outside", color = LINE, style = "thin") {
  range.format.borders = { preset, color, style };
}

sheet.getRange("A1:H1").format.rowHeight = 10;
mergeWrite("A2:E4", "GYMPULSE");
sheet.getRange("A2:E4").format = {
  fill: NAVY,
  font: { name: FONT, size: 16, bold: true, color: WHITE },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
mergeWrite("A5:E5", "CUSTOM GYM MANAGEMENT SYSTEM");
sheet.getRange("A5:E5").format = {
  fill: NAVY,
  font: { name: FONT, size: 9, color: "#BBDCF5" },
  horizontalAlignment: "left",
};
mergeWrite("F2:H3", "INVOICE");
sheet.getRange("F2:H3").format = {
  fill: NAVY,
  font: { name: FONT, size: 16, bold: true, color: WHITE },
  horizontalAlignment: "right",
  verticalAlignment: "center",
};
mergeWrite("F4:G4", "Invoice No.");
mergeWrite("F5:G5", "Invoice Date");
sheet.getRange("F4:G5").format = {
  fill: NAVY,
  font: { name: FONT, size: 9, color: WHITE },
  horizontalAlignment: "right",
};
sheet.getRange("H4").values = [["GP-2026-001"]];
sheet.getRange("H5").values = [[new Date(2026, 8, 27)]];
sheet.getRange("H4:H5").format = {
  fill: INPUT,
  font: { name: FONT, size: 9, bold: true, color: INK },
  horizontalAlignment: "right",
};
sheet.getRange("H5").format.numberFormat = "dd mmmm yyyy";
sheet.getRange("A2:H5").format.borders = { preset: "outside", color: NAVY, style: "thin" };

mergeWrite("A7:D7", "FROM");
mergeWrite("E7:H7", "BILL TO");
sheet.getRange("A7:H7").format = {
  fill: PALE_BLUE,
  font: { name: FONT, size: 10, bold: true, color: BLUE },
  horizontalAlignment: "left",
};
border(sheet.getRange("A7:H11"));
sheet.getRange("A7:H11").format.borders = {
  outside: { style: "thin", color: LINE },
  insideVertical: { style: "thin", color: LINE },
};

mergeWrite("A8:D8", "[Your Name / Business Name]");
mergeWrite("A9:D9", "Software development and implementation services");
mergeWrite("A10:D10", "[Phone] | [Email]");
mergeWrite("A11:D11", "[Address / GSTIN, if applicable]");
mergeWrite("E8:H8", "Client / Gym Owner");
mergeWrite("E9:H9", "[Gym Name]");
mergeWrite("E10:H10", "[Address / Contact Details]");
mergeWrite("E11:H11", "[Client GSTIN, if applicable]");
sheet.getRange("A8:D11").format.fill = INPUT;
sheet.getRange("E8:H11").format.fill = INPUT;
sheet.getRange("A8:H11").format.wrapText = true;
sheet.getRange("A8:H11").format.rowHeight = 22;

sheet.getRange("A13:B13").values = [["PROJECT", null]];
sheet.mergeCells("A13:B13");
sheet.getRange("A13:B13").values = [["PROJECT"]];
mergeWrite("C13:H13", "GymPulse Custom Gym Management Web Application");
sheet.getRange("A14:B14").values = [["SCOPE", null]];
sheet.mergeCells("A14:B14");
sheet.getRange("A14:B14").values = [["SCOPE"]];
mergeWrite("C14:H14", "Design, development, configuration and deployment of the agreed gym operations platform.");
sheet.getRange("A13:B14").format = {
  fill: PALE_ORANGE,
  font: { name: FONT, size: 10, bold: true, color: BLUE },
};
sheet.getRange("C13:H14").format = {
  font: { name: FONT, size: 10, bold: true, color: INK },
  wrapText: true,
};
sheet.getRange("C14:H14").format.font = { name: FONT, size: 10, color: INK };
border(sheet.getRange("A13:H14"), "all");
sheet.getRange("A13:H14").format.rowHeight = 24;

mergeWrite("A16:C16", "FEATURE / MODULE");
mergeWrite("D16:G16", "DELIVERABLE");
sheet.getRange("H16").values = [["VALUE"]];
sheet.getRange("A16:H16").format = {
  fill: NAVY,
  font: { name: FONT, size: 10, bold: true, color: WHITE },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A16:H16").format.rowHeight = 28;

const featureRows = [
  ["Public gym profile and responsive interface", "Customer-facing gym information page and responsive application layout.", 6000],
  ["Secure login, user roles and permissions", "Authentication and access control for owner, manager, reception and trainer roles.", 7000],
  ["Member and trainer management", "Member records, search, status tracking and trainer administration.", 10000],
  ["Membership plans, renewals and personal training", "Plan configuration, membership lifecycle, renewals and PT package management.", 10000],
  ["Attendance management", "Manual attendance, attendance history and operational tracking.", 7000],
  ["Payments and digital receipts", "Payment recording, collection information and receipt generation.", 8000],
  ["Dashboard and business reports", "Operational KPIs, charts, filters and management reporting.", 7000],
  ["Messaging, settings and production deployment", "Communication tools, configuration and initial deployment support.", 5000],
];

for (let i = 0; i < featureRows.length; i += 1) {
  const row = 17 + i;
  const [feature, description, value] = featureRows[i];
  mergeWrite(`A${row}:C${row}`, feature);
  mergeWrite(`D${row}:G${row}`, description);
  sheet.getRange(`H${row}`).values = [[value]];
  sheet.getRange(`A${row}:G${row}`).format.fill = i % 2 === 0 ? WHITE : "#F7FAFD";
  sheet.getRange(`H${row}`).format.fill = INPUT;
  sheet.getRange(`A${row}:H${row}`).format.wrapText = true;
  sheet.getRange(`A${row}:H${row}`).format.rowHeight = 35;
  sheet.getRange(`A${row}:C${row}`).format.font = { name: FONT, size: 9, bold: true, color: INK };
  sheet.getRange(`D${row}:G${row}`).format.font = { name: FONT, size: 9, color: INK };
  sheet.getRange(`H${row}`).format.font = { name: FONT, size: 9, color: INK };
  sheet.getRange(`H${row}`).format.horizontalAlignment = "right";
}
sheet.getRange("H17:H24").format.numberFormat = INR;
sheet.getRange("A16:H24").format.borders = {
  outside: { style: "thin", color: LINE },
  insideHorizontal: { style: "thin", color: LINE },
  insideVertical: { style: "thin", color: LINE },
};

mergeWrite("E26:G26", "Normal development value");
sheet.getRange("H26").formulas = [["=SUM(H17:H24)"]];
mergeWrite("E27:G27", "Introductory project discount");
sheet.getRange("H27").values = [[-25000]];
sheet.getRange("H27").dataValidation = { rule: { type: "whole", operator: "lessThanOrEqual", formula1: 0 } };
mergeWrite("E28:G28", "Discounted development price");
sheet.getRange("H28").formulas = [["=H26+H27"]];
mergeWrite("E29:G29", "GoDaddy domain cost");
sheet.getRange("H29").values = [[4243]];
mergeWrite("E30:G31", "GRAND TOTAL");
sheet.mergeCells("H30:H31");
sheet.getRange("H30:H31").formulas = [["=H28+H29"]];

sheet.getRange("E26:H29").format.borders = { preset: "all", color: LINE, style: "thin" };
sheet.getRange("E26:H29").format.rowHeight = 24;
sheet.getRange("E26:G26").format.font = { name: FONT, size: 10, bold: true, color: INK };
sheet.getRange("H26").format.font = { name: FONT, size: 10, bold: true, color: INK };
sheet.getRange("E27:G27").format.fill = PALE_ORANGE;
sheet.getRange("H27").format.fill = INPUT;
sheet.getRange("E28:H28").format.fill = PALE_BLUE;
sheet.getRange("E28:H28").format.font = { name: FONT, size: 10, bold: true, color: INK };
sheet.getRange("H29").format.fill = INPUT;
sheet.getRange("E30:H31").format = {
  fill: BLUE,
  font: { name: FONT, size: 13, bold: true, color: WHITE },
  verticalAlignment: "center",
};
sheet.getRange("H26:H31").format.horizontalAlignment = "right";
sheet.getRange("H26:H31").format.numberFormat = INR;
sheet.getRange("E30:H31").format.borders = { preset: "outside", color: BLUE, style: "thin" };
sheet.getRange("E30:H31").format.rowHeight = 27;

mergeWrite("A33:H33", "Yellow cells are editable. Formula cells update automatically when feature values, discount or domain cost change.");
sheet.getRange("A33:H33").format = {
  fill: INPUT,
  font: { name: FONT, size: 9, italic: true, color: MUTED },
  wrapText: true,
};
sheet.getRange("A33:H33").format.rowHeight = 24;
border(sheet.getRange("A33:H33"));

mergeWrite("A35:B35", "ANNUAL MAINTENANCE");
mergeWrite("C35:G35", "Routine bug fixes, updates and basic support. New features and third-party charges are separate.");
sheet.getRange("H35").values = [[15000]];
sheet.getRange("A35:B35").format = {
  fill: PALE_BLUE,
  font: { name: FONT, size: 9, bold: true, color: BLUE },
};
sheet.getRange("C35:G35").format = {
  font: { name: FONT, size: 9, color: MUTED },
  wrapText: true,
};
sheet.getRange("H35").format = {
  fill: INPUT,
  font: { name: FONT, size: 9, bold: true, color: INK },
  numberFormat: INR,
  horizontalAlignment: "right",
};
sheet.getRange("A35:H35").format.rowHeight = 34;
sheet.getRange("A35:H35").format.borders = { preset: "all", color: LINE, style: "thin" };

mergeWrite("A37:H38", "Terms: Hosting, Firebase usage, SMS/WhatsApp, email, taxes (if applicable) and future domain renewals are not included. Annual maintenance begins after the agreed support period.");
sheet.getRange("A37:H38").format = {
  font: { name: FONT, size: 9, color: MUTED },
  wrapText: true,
  verticalAlignment: "top",
};

mergeWrite("A40:D40", "Prepared by");
mergeWrite("E40:H40", "Accepted by client");
mergeWrite("A41:D42", "____________________________\nName and signature");
mergeWrite("E41:H42", "____________________________\nName, signature and date");
sheet.getRange("A40:H40").format.font = { name: FONT, size: 9, color: MUTED };
sheet.getRange("A41:H42").format = {
  font: { name: FONT, size: 9, color: INK },
  wrapText: true,
  verticalAlignment: "bottom",
};
sheet.getRange("A41:H42").format.rowHeight = 24;

workbook.recalculate();

// Verify that editable pricing inputs flow through the invoice formulas.
sheet.getRange("H17").values = [[8000]];
workbook.recalculate();
const changedValues = sheet.getRange("H26:H30").values.flat();
if (changedValues[0] !== 62000 || changedValues[2] !== 37000 || changedValues[4] !== 41243) {
  throw new Error(`Invoice formula test failed: ${JSON.stringify(changedValues)}`);
}
sheet.getRange("H17").values = [[6000]];
workbook.recalculate();

const inspect = await workbook.inspect({
  kind: "table",
  range: "Invoice!A1:H35",
  include: "values,formulas",
  tableMaxRows: 40,
  tableMaxCols: 10,
  maxChars: 18000,
});
await fs.writeFile(`${qaDir}/inspect.ndjson`, inspect.ndjson, "utf8");

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "invoice formula error scan",
});
await fs.writeFile(`${qaDir}/formula_errors.ndjson`, errors.ndjson, "utf8");

const preview = await workbook.render({
  sheetName: "Invoice",
  range: "A1:H42",
  scale: 1.5,
  format: "png",
});
await fs.writeFile(`${qaDir}/Invoice.png`, new Uint8Array(await preview.arrayBuffer()));

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

const savedWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const savedFormulaCheck = await savedWorkbook.inspect({
  kind: "formula",
  sheetId: "Invoice",
  range: "H17:H31",
  maxChars: 4000,
  options: { maxResults: 20 },
});
await fs.writeFile(`${qaDir}/saved_formulas.ndjson`, savedFormulaCheck.ndjson, "utf8");

console.log(outputPath);
