import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Messages = Record<string, string>;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");

function loadJson(filePath: string): Messages {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as Messages;
}

function toSortedEntries(record: Messages): Array<[string, string]> {
  return Object.entries(record).sort(([a], [b]) => a.localeCompare(b));
}

function formatTsMessagesExport(varName: string, entries: Array<[string, string]>): string {
  const lines: string[] = [];
  lines.push(`import type { PartialMessages } from \"../i18n\";`);
  lines.push("");
  lines.push(`export const ${varName} = {`);
  for (const [key, value] of entries) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  }
  lines.push(`} satisfies PartialMessages;`);
  lines.push("");
  return lines.join("\n");
}

function main(): void {
  const zhJsonPath = path.join(REPO_ROOT, "tmp/i18n/messages.zh-CN.json");
  const zhOutPath = path.join(REPO_ROOT, "src/i18n/messages/zh-CN.ts");

  if (!fs.existsSync(zhJsonPath)) {
    throw new Error(`Missing ${zhJsonPath}. Run 'npm run i18n:extract' first.`);
  }

  const zhAll = loadJson(zhJsonPath);
  const zhNonEmpty: Messages = {};

  for (const [key, value] of Object.entries(zhAll)) {
    const trimmed = value.trim();
    if (trimmed) zhNonEmpty[key] = trimmed;
  }

  const entries = toSortedEntries(zhNonEmpty);
  const tsOut = formatTsMessagesExport("zhCNMessages", entries);
  fs.writeFileSync(zhOutPath, tsOut, "utf8");

  console.log(`i18n: synced ${entries.length} zh-CN keys into src/i18n/messages/zh-CN.ts`);
}

main();

