export type CsvRow = Record<string, string>;

export type CsvPreviewResult = {
  delimiter: "," | ";";
  columns: string[];
  rows: CsvRow[];
  rowCount: number;
  truncated: boolean;
};

const MAX_UPLOAD_ROWS = 100;

function stripBom(value: string) {
  return value.replace(/^\uFEFF/, "");
}

function detectDelimiter(content: string) {
  const firstLine = stripBom(content).split(/\r\n|\n|\r/)[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function parseCsvRows(content: string, delimiter: "," | ";") {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const input = stripBom(content);

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function uniqueColumnName(name: string, seen: Map<string, number>) {
  const cleanName = name.trim() || "Column";
  const count = seen.get(cleanName) || 0;
  seen.set(cleanName, count + 1);
  return count === 0 ? cleanName : `${cleanName} ${count + 1}`;
}

export function parseCsvUpload(content: string): CsvPreviewResult {
  const delimiter = detectDelimiter(content);
  const parsedRows = parseCsvRows(content, delimiter);
  const [header = [], ...dataRows] = parsedRows;
  const seen = new Map<string, number>();
  const columns = header.map((name) => uniqueColumnName(name, seen));
  const limitedRows = dataRows.slice(0, MAX_UPLOAD_ROWS);

  return {
    delimiter,
    columns,
    rows: limitedRows.map((values) =>
      Object.fromEntries(columns.map((column, index) => [column, values[index] || ""]))
    ),
    rowCount: dataRows.length,
    truncated: dataRows.length > MAX_UPLOAD_ROWS
  };
}

export function findLikelyColumn(columns: string[], patterns: RegExp[]) {
  return columns.find((column) => patterns.some((pattern) => pattern.test(column.toLowerCase()))) || "";
}

export function defaultColumnMapping(columns: string[]) {
  return {
    companyName: findLikelyColumn(columns, [/company/, /firma/, /business/, /name/]),
    website: findLikelyColumn(columns, [/website/, /web site/, /url/, /site/]),
    country: findLikelyColumn(columns, [/country/, /ülke/, /ulke/, /paese/, /land/]),
    city: findLikelyColumn(columns, [/city/, /şehir/, /sehir/, /citt/, /stadt/]),
    email: findLikelyColumn(columns, [/email/, /e-mail/, /mail/]),
    phone: findLikelyColumn(columns, [/phone/, /telefon/, /tel/, /mobile/])
  };
}
