import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { layerDefinitions } from "../../src/lib/layer-definitions.ts";
import { categories } from "../../src/lib/categories.ts";
import { templateCategories, templates } from "../../src/lib/templates/index.ts";

type InventorySource = {
  file: string;
  line: number;
  kind?: string;
};

type InventoryItem = {
  key: string;
  defaultMessage: string;
  sources: InventorySource[];
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const TMP_DIR = path.join(REPO_ROOT, "tmp/i18n");

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replaceAll(/['"“”‘’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
  return cleaned;
}

function toLineNumber(fileText: string, pos: number): number {
  const before = fileText.slice(0, Math.max(0, pos));
  return before.split("\n").length;
}

function stringifyTemplate(
  node: ts.Expression
): { message: string; placeholders: string[] } | null {
  if (ts.isStringLiteral(node)) {
    return { message: node.text, placeholders: [] };
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return { message: node.text, placeholders: [] };
  }
  if (ts.isTemplateExpression(node)) {
    const placeholders: string[] = [];
    let message = node.head.text;
    node.templateSpans.forEach((span, index) => {
      const expr = span.expression;
      let name = `expr${index}`;

      if (ts.isIdentifier(expr)) {
        name = expr.text;
      } else if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name)) {
        name = expr.name.text;
      }

      placeholders.push(name);
      message += `{${name}}${span.literal.text}`;
    });
    return { message, placeholders };
  }
  return null;
}

class MessageInventory {
  private readonly itemsByKey = new Map<string, InventoryItem>();

  add(
    keyBase: string,
    defaultMessage: string,
    source: InventorySource
  ): string {
    let key = keyBase;

    for (let attempt = 1; attempt < 1000; attempt += 1) {
      const existing = this.itemsByKey.get(key);

      if (!existing) {
        this.itemsByKey.set(key, {
          key,
          defaultMessage,
          sources: [source],
        });
        return key;
      }

      if (existing.defaultMessage === defaultMessage) {
        existing.sources.push(source);
        return key;
      }

      key = `${keyBase}_${attempt + 1}`;
    }

    throw new Error(`Could not allocate unique key for '${keyBase}'`);
  }

  toSortedArray(): InventoryItem[] {
    return Array.from(this.itemsByKey.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
  }

  toMessageMap(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const item of this.toSortedArray()) {
      out[item.key] = item.defaultMessage;
    }
    return out;
  }
}

function extractLayerMessages(inventory: MessageInventory): void {
  for (const [layerType, def] of Object.entries(layerDefinitions)) {
    inventory.add(`layer.${layerType}.name`, layerType, {
      file: "src/lib/layer-definitions.ts",
      line: 1,
      kind: "layer.name",
    });

    inventory.add(`layer.${layerType}.description`, def.metadata.description, {
      file: "src/lib/layer-definitions.ts",
      line: 1,
      kind: "layer.description",
    });

    def.parameters.forEach((param) => {
      inventory.add(`layer.${layerType}.param.${param.key}.label`, param.label, {
        file: "src/lib/layer-definitions.ts",
        line: 1,
        kind: "layer.param.label",
      });

      if (param.description) {
        inventory.add(
          `layer.${layerType}.param.${param.key}.description`,
          param.description,
          {
            file: "src/lib/layer-definitions.ts",
            line: 1,
            kind: "layer.param.description",
          }
        );
      }

      param.options?.forEach((opt) => {
        inventory.add(
          `layer.${layerType}.param.${param.key}.option.${opt.value}.label`,
          opt.label,
          {
            file: "src/lib/layer-definitions.ts",
            line: 1,
            kind: "layer.param.option.label",
          }
        );

        if (opt.description) {
          inventory.add(
            `layer.${layerType}.param.${param.key}.option.${opt.value}.description`,
            opt.description,
            {
              file: "src/lib/layer-definitions.ts",
              line: 1,
              kind: "layer.param.option.description",
            }
          );
        }
      });
    });
  }
}

function extractCategoryMessages(inventory: MessageInventory): void {
  for (const [categoryKey, def] of Object.entries(categories)) {
    inventory.add(`category.${categoryKey}.name`, def.name, {
      file: "src/lib/categories.ts",
      line: 1,
      kind: "category.name",
    });
    inventory.add(`category.${categoryKey}.description`, def.description, {
      file: "src/lib/categories.ts",
      line: 1,
      kind: "category.description",
    });
  }
}

function extractTemplateMessages(inventory: MessageInventory): void {
  for (const [categoryKey, def] of Object.entries(templateCategories)) {
    inventory.add(`templateCategory.${categoryKey}.name`, def.name, {
      file: "src/lib/templates/index.ts",
      line: 1,
      kind: "templateCategory.name",
    });
    inventory.add(`templateCategory.${categoryKey}.description`, def.description, {
      file: "src/lib/templates/index.ts",
      line: 1,
      kind: "templateCategory.description",
    });
  }

  for (const tmpl of templates) {
    inventory.add(`template.${tmpl.id}.name`, tmpl.name, {
      file: "src/lib/templates/index.ts",
      line: 1,
      kind: "template.name",
    });
    inventory.add(`template.${tmpl.id}.description`, tmpl.description, {
      file: "src/lib/templates/index.ts",
      line: 1,
      kind: "template.description",
    });

    tmpl.tags.forEach((tag) => {
      inventory.add(`tag.${tag}`, tag, {
        file: "src/lib/templates/index.ts",
        line: 1,
        kind: "template.tag",
      });
    });
  }
}

function findVariableInitializer(
  sourceFile: ts.SourceFile,
  varName: string
): ts.Expression | null {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      if (decl.name.text !== varName) continue;
      return decl.initializer ?? null;
    }
  }
  return null;
}

function getPropNameText(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name)) return name.text;
  return null;
}

function findObjectProperty(
  obj: ts.ObjectLiteralExpression,
  propName: string
): ts.PropertyAssignment | null {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!prop.name) continue;
    const nameText = getPropNameText(prop.name);
    if (nameText === propName) return prop;
  }
  return null;
}

function extractLayerValidationMessages(inventory: MessageInventory): void {
  const fileRel = "src/lib/layer-definitions.ts";
  const filePath = path.join(REPO_ROOT, fileRel);
  const fileText = fs.readFileSync(filePath, "utf8");

  const sourceFile = ts.createSourceFile(
    fileRel,
    fileText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const initializer = findVariableInitializer(sourceFile, "layerDefinitions");
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) return;

  for (const layerProp of initializer.properties) {
    if (!ts.isPropertyAssignment(layerProp)) continue;
    if (!layerProp.name) continue;
    const layerType = getPropNameText(layerProp.name);
    if (!layerType) continue;
    if (!layerProp.initializer || !ts.isObjectLiteralExpression(layerProp.initializer))
      continue;

    const validateProp = findObjectProperty(layerProp.initializer, "validateInputs");
    if (!validateProp) continue;

    const validateNode = validateProp.initializer;
    const messages: Array<{ message: string; pos: number }> = [];

    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node)) {
        for (const prop of node.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const propName = prop.name ? getPropNameText(prop.name) : null;
          if (propName !== "errorMessage") continue;
          if (!prop.initializer) continue;

          const str = stringifyTemplate(prop.initializer);
          if (!str || !str.message.trim()) continue;

          messages.push({ message: str.message, pos: prop.initializer.getStart(sourceFile) });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(validateNode);

    for (const { message, pos } of messages) {
      const slug = slugify(message) || "message";
      const keyBase = `layer.${layerType}.validation.${slug.slice(0, 60)}`;
      inventory.add(keyBase, message, {
        file: fileRel,
        line: toLineNumber(fileText, pos),
        kind: "layer.validation.errorMessage",
      });
    }
  }
}

function extractUiMessagesFromTsxFile(
  inventory: MessageInventory,
  fileRel: string,
  namespace: string
): void {
  const filePath = path.join(REPO_ROOT, fileRel);
  const fileText = fs.readFileSync(filePath, "utf8");

  const sourceFile = ts.createSourceFile(
    fileRel,
    fileText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const extracted: Array<{ message: string; pos: number; kind: string }> = [];

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const value = node.text.replaceAll(/\s+/g, " ").trim();
      if (value) {
        extracted.push({
          message: value,
          pos: node.getStart(sourceFile),
          kind: "jsx.text",
        });
      }
    }

    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.text;
      const allowed = attrName === "placeholder" || attrName === "title";
      if (allowed && node.initializer) {
        let message: string | null = null;
        if (ts.isStringLiteral(node.initializer)) message = node.initializer.text;
        if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expr = node.initializer.expression;
          const str = stringifyTemplate(expr);
          message = str?.message ?? null;
        }

        if (message && message.trim()) {
          extracted.push({
            message: message.trim(),
            pos: node.initializer.getStart(sourceFile),
            kind: `jsx.attr.${attrName}`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  extracted.forEach(({ message, pos, kind }) => {
    const slug = slugify(message);
    const keyBase =
      slug.length > 0 ? `${namespace}.${slug.slice(0, 60)}` : `${namespace}.msg`;
    inventory.add(keyBase, message, {
      file: fileRel,
      line: toLineNumber(fileText, pos),
      kind,
    });
  });

  const errorMessages = extractNamedConstObjectStrings(
    sourceFile,
    fileText,
    "ERROR_MESSAGES"
  );
  errorMessages.forEach(({ key, message, pos }) => {
    const slug = slugify(message) || key.toLowerCase();
    inventory.add(`${namespace}.error.${slug.slice(0, 60)}`, message, {
      file: fileRel,
      line: toLineNumber(fileText, pos),
      kind: `const.ERROR_MESSAGES.${key}`,
    });
  });
}

function extractNamedConstObjectStrings(
  sourceFile: ts.SourceFile,
  fileText: string,
  constName: string
): Array<{ key: string; message: string; pos: number }> {
  const initializer = findVariableInitializer(sourceFile, constName);
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) return [];

  const results: Array<{ key: string; message: string; pos: number }> = [];

  for (const prop of initializer.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!prop.name || !prop.initializer) continue;
    const key = getPropNameText(prop.name);
    if (!key) continue;
    const str = stringifyTemplate(prop.initializer);
    if (!str || !str.message.trim()) continue;

    results.push({
      key,
      message: str.message.trim(),
      pos: prop.initializer.getStart(sourceFile),
    });
  }

  return results;
}

function extractEngineMessages(
  inventory: MessageInventory,
  fileRel: string,
  namespace: string
): void {
  const filePath = path.join(REPO_ROOT, fileRel);
  const fileText = fs.readFileSync(filePath, "utf8");

  const sourceFile = ts.createSourceFile(
    fileRel,
    fileText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateExpression(node)
    ) {
      const str = stringifyTemplate(node as ts.Expression);
      const message = str?.message?.trim();
      if (!message) {
        ts.forEachChild(node, visit);
        return;
      }

      const looksUserFacing =
        /[A-Za-z]/.test(message) && (message.includes(" ") || message.length > 10);
      if (looksUserFacing) {
        const slug = slugify(message) || "message";
        inventory.add(`${namespace}.${slug.slice(0, 60)}`, message, {
          file: fileRel,
          line: toLineNumber(fileText, node.getStart(sourceFile)),
          kind: "engine.string",
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

function writeJsonFile(filePath: string, data: unknown): void {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, content, "utf8");
}

function loadJsonRecord(filePath: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeAgentDocs(inventory: MessageInventory): void {
  const inventoryItems = inventory.toSortedArray();
  const total = inventoryItems.length;

  const agentTasks = `# BlockDL i18n Agent Pack

Generated files:
- \`tmp/i18n/messages.en.json\`: source (English) catalog
- \`tmp/i18n/messages.zh-CN.json\`: zh-CN catalog (fill in values)
- \`tmp/i18n/inventory.json\`: keys + source locations

Rules for translators/agents:
- Keep placeholders like \`{dim}\`, \`{type}\` intact.
- Keep framework names (Keras / PyTorch / TensorFlow) as-is unless you explicitly want them translated.
- Prefer Simplified Chinese (zh-CN).

Counts:
- Total keys: ${total}
`;

  const keyScheme = `# Key Scheme

This repo uses a flat key/value catalog. The extractor generates keys with these prefixes:

- \`ui.*\`: UI strings extracted from TSX (auto-generated from English text)
- \`layer.<LayerType>.name\`: Layer type label (defaults to the layer type ID, e.g. "Dense")
- \`layer.<LayerType>.description\`: Layer description (palette)
- \`layer.<LayerType>.param.<paramKey>.label\`: Parameter label (layer editor)
- \`layer.<LayerType>.param.<paramKey>.option.<value>.label\`: Select option label
- \`layer.<LayerType>.validation.*\`: Layer input validation errors (\`errorMessage\`)
- \`category.<categoryKey>.*\`: Layer category name/description
- \`templateCategory.<categoryKey>.*\`: Template category name/description
- \`template.<templateId>.*\`: Template name/description
- \`tag.<tag>\`: Template tags (shown as chips)
- \`engine.*\`: DAG/shape computation errors

Notes:
- \`ui.*\` keys are meant as a starting point; you can rename to more semantic keys as you refactor.
- Prefer using stable IDs (layerType, paramKey, templateId) in computed keys when possible.
`;

  const playbook = `# i18n Playbook (Vibe Coding)

## 1) Regenerate catalogs
\`npm run i18n:extract\`

## 2) Translate
Edit \`tmp/i18n/messages.zh-CN.json\` and fill in values. Leave keys intact.

## 3) Wire translations into the app
Run \`npm run i18n:sync\` to copy all non-empty zh-CN translations into
\`src/i18n/messages/zh-CN.ts\`.

## 4) Replace UI strings incrementally
Use the \`t()\` helper from \`src/i18n/I18nProvider.tsx\`:

- Static UI string:
  - \`t("ui.AppHeader.clear_all", { defaultValue: "Clear All" })\`
- Computed layer label:
  - \`t(\`layer.\${type}.name\`, { defaultValue: type })\`
- Param label:
  - \`t(\`layer.\${type}.param.\${field.key}.label\`, { defaultValue: field.label })\`

## 5) Validate
Run \`npm run build\` and do a quick UI pass for missing keys/placeholders.
`;

  fs.writeFileSync(path.join(TMP_DIR, "AGENT_TASKS.md"), agentTasks, "utf8");
  fs.writeFileSync(path.join(TMP_DIR, "KEY_SCHEME.md"), keyScheme, "utf8");
  fs.writeFileSync(path.join(TMP_DIR, "PLAYBOOK.md"), playbook, "utf8");
}

function main(): void {
  ensureDir(TMP_DIR);

  const inventory = new MessageInventory();

  extractLayerMessages(inventory);
  extractLayerValidationMessages(inventory);
  extractCategoryMessages(inventory);
  extractTemplateMessages(inventory);

  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/AppHeader.tsx",
    "ui.AppHeader"
  );
  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/BlockPalette.tsx",
    "ui.BlockPalette"
  );
  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/CodeViewer.tsx",
    "ui.CodeViewer"
  );
  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/WelcomeModal.tsx",
    "ui.WelcomeModal"
  );
  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/LayerNode.tsx",
    "ui.LayerNode"
  );
  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/UndoRedoControls.tsx",
    "ui.UndoRedoControls"
  );
  extractUiMessagesFromTsxFile(
    inventory,
    "src/components/ui/dialog.tsx",
    "ui.Dialog"
  );

  extractEngineMessages(
    inventory,
    "src/lib/dag-parser.ts",
    "engine.dag"
  );
  extractEngineMessages(
    inventory,
    "src/lib/shape-computation.ts",
    "engine.shape"
  );

  const en = inventory.toMessageMap();
  writeJsonFile(path.join(TMP_DIR, "messages.en.json"), en);

  const zhPath = path.join(TMP_DIR, "messages.zh-CN.json");
  const existingZh = loadJsonRecord(zhPath);

  const zhOut: Record<string, string> = {};
  Object.keys(en)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      zhOut[key] = existingZh[key] ?? "";
    });
  writeJsonFile(zhPath, zhOut);

  writeJsonFile(path.join(TMP_DIR, "inventory.json"), inventory.toSortedArray());
  writeAgentDocs(inventory);

  console.log(`i18n: extracted ${Object.keys(en).length} keys into tmp/i18n`);
}

main();
