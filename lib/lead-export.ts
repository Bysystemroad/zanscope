import type { Lead } from "@/lib/dummy-data";

type ExportColumn = {
  header: string;
  value: (lead: Lead) => string | number;
};

const CSV_DELIMITER = ";";
const UTF8_BOM = "\uFEFF";

const columns: ExportColumn[] = [
  { header: "Company Name", value: (lead) => lead.company_name },
  { header: "Website", value: (lead) => lead.website },
  { header: "Email", value: (lead) => lead.email },
  { header: "Phone", value: (lead) => lead.phone },
  { header: "Address", value: (lead) => lead.address },
  { header: "City", value: (lead) => lead.city },
  { header: "Country", value: (lead) => lead.country },
  { header: "Enrichment Status", value: (lead) => enrichmentLabel(lead.scraper_status) },
  { header: "Duplicate Count", value: (lead) => lead.duplicate_count },
  { header: "Lead Score", value: (lead) => lead.lead_score },
  { header: "Lead Quality", value: (lead) => lead.lead_quality },
  { header: "Created At", value: (lead) => formatDate(lead.created_at) }
];

function enrichmentLabel(status: Lead["scraper_status"]) {
  if (status === "found") return "Enriched";
  if (status === "not_found") return "No contact found";
  if (status === "failed") return "Needs review";
  return "Pending";
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function normalizeValue(value: string | number | null | undefined) {
  return String(value ?? "").replace(/\r\n|\r|\n/g, " ").trim();
}

function csvCell(value: string | number, forceFormulaText = false) {
  const normalized = normalizeValue(value);
  const output = forceFormulaText && normalized ? `="${normalized.replaceAll('"', '""')}"` : normalized;
  return `"${output.replaceAll('"', '""')}"`;
}

export function leadsToExcelFriendlyCsv(rows: Lead[]) {
  const header = columns.map((column) => csvCell(column.header)).join(CSV_DELIMITER);
  const body = rows.map((lead) =>
    columns
      .map((column) => csvCell(column.value(lead), column.header === "Phone"))
      .join(CSV_DELIMITER)
  );

  return `${UTF8_BOM}${[header, ...body].join("\r\n")}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadLeadsCsv(rows: Lead[], filename: string) {
  downloadBlob(new Blob([leadsToExcelFriendlyCsv(rows)], { type: "text/csv;charset=utf-8" }), filename);
}

export function downloadLeadsExcel(rows: Lead[], filename: string) {
  downloadBlob(createLeadsWorkbook(rows), filename);
}

function xmlEscape(value: string | number) {
  return normalizeValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let name = "";
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function worksheetXml(rows: Lead[]) {
  const widths = columns.map((column) => {
    const maxLength = Math.max(
      column.header.length,
      ...rows.map((lead) => normalizeValue(column.value(lead)).length)
    );
    return Math.min(Math.max(maxLength + 2, 12), 48);
  });

  const headerCells = columns.map((column, index) =>
    `<c r="${columnName(index + 1)}1" t="inlineStr" s="1"><is><t>${xmlEscape(column.header)}</t></is></c>`
  );

  const dataRows = rows.map((lead, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const cells = columns.map((column, columnIndex) => {
      const cellRef = `${columnName(columnIndex + 1)}${rowNumber}`;
      return `<c r="${cellRef}" t="inlineStr" s="2"><is><t>${xmlEscape(column.value(lead))}</t></is></c>`;
    });
    return `<row r="${rowNumber}">${cells.join("")}</row>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>
  <sheetData>
    <row r="1">${headerCells.join("")}</row>
    ${dataRows.join("")}
  </sheetData>
</worksheet>`;
}

function createLeadsWorkbook(rows: Lead[]) {
  const now = new Date().toISOString();
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Zanscope</Application></Properties>`,
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Zanscope Leads</dc:title>
  <dc:creator>Zanscope</dc:creator>
  <cp:lastModifiedBy>Zanscope</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF101820"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>
</styleSheet>`,
    "xl/worksheets/sheet1.xml": worksheetXml(rows)
  };

  return new Blob([zipFiles(files)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function zipFiles(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const contentBytes = encoder.encode(content);
    const crc = crc32(contentBytes);
    const localHeader = concatBytes(
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(contentBytes.length),
      uint32(contentBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes
    );

    chunks.push(localHeader, contentBytes);
    centralDirectory.push(
      concatBytes(
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(crc),
        uint32(contentBytes.length),
        uint32(contentBytes.length),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        nameBytes
      )
    );
    offset += localHeader.length + contentBytes.length;
  });

  const centralDirectoryStart = offset;
  const centralDirectoryBytes = concatBytes(...centralDirectory);
  const end = concatBytes(
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(centralDirectory.length),
    uint16(centralDirectory.length),
    uint32(centralDirectoryBytes.length),
    uint32(centralDirectoryStart),
    uint16(0)
  );

  return concatBytes(...chunks, centralDirectoryBytes, end);
}

function concatBytes(...parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}
