import type { Locale, TranslateParams } from "./i18n";

type TranslateOptions = {
  defaultValue?: string;
  params?: TranslateParams;
};

export type TranslateFn = (key: string, options?: TranslateOptions) => string;

export function isChineseLocale(locale: Locale): boolean {
  return locale === "zh-CN";
}

export function zhText(locale: Locale, en: string, zh: string): string {
  return isChineseLocale(locale) ? zh : en;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function layerValidationKey(layerType: string, message: string): string {
  const slug = slugify(message) || "message";
  return `layer.${layerType}.validation.${slug.slice(0, 60)}`;
}

export function localizeRuntimeMessage(
  locale: Locale,
  t: TranslateFn,
  message: string,
  options?: { layerType?: string }
): string {
  if (!isChineseLocale(locale)) return message;

  const exactEngineKeys: Record<string, string> = {
    "Network contains cycles - DAG structure required":
      "engine.dag.network_contains_cycles_dag_structure_required",
    "Network must have at least one Input layer":
      "engine.dag.network_must_have_at_least_one_input_layer",
    "Network must have at least one layer":
      "engine.dag.network_must_have_at_least_one_layer",
    "Network must have at least one Output layer":
      "engine.dag.network_must_have_at_least_one_output_layer",
    "Input layer definition not found": "engine.shape.input_layer_definition_not_found",
    "Unknown error": "engine.shape.unknown_error",
  };

  const exactEngineKey = exactEngineKeys[message];
  if (exactEngineKey) {
    return t(exactEngineKey, { defaultValue: message });
  }

  let match = message.match(/^Unknown layer type: (.+)$/);
  if (match) {
    return t("engine.shape.unknown_layer_type_type", {
      defaultValue: "Unknown layer type: {type}",
      params: { type: match[1] },
    });
  }

  match = message.match(/^Invalid input for (.+)$/);
  if (match) {
    return t("engine.shape.invalid_input_for_type", {
      defaultValue: "Invalid input for {type}",
      params: { type: match[1] },
    });
  }

  match = message.match(/^Invalid input shape: (.+)$/);
  if (match) {
    return t("engine.shape.invalid_input_shape_inputshape", {
      defaultValue: "Invalid input shape: {inputShape}",
      params: { inputShape: match[1] },
    });
  }

  match = message.match(/^Could not compute output shape for (.+)$/);
  if (match) {
    return t("engine.shape.could_not_compute_output_shape_for_type", {
      defaultValue: "Could not compute output shape for {type}",
      params: { type: match[1] },
    });
  }

  match = message.match(/^Could not determine input shapes for (.+)$/);
  if (match) {
    return t("engine.shape.could_not_determine_input_shapes_for_type", {
      defaultValue: "Could not determine input shapes for {type}",
      params: { type: match[1] },
    });
  }

  match = message.match(/^Error computing shape: (.+)$/);
  if (match) {
    return t("engine.shape.error_computing_shape_expr0", {
      defaultValue: "Error computing shape: {expr0}",
      params: { expr0: match[1] },
    });
  }

  match = message.match(/^(.+) has no input connections$/);
  if (match) {
    return t("engine.shape.type_has_no_input_connections", {
      defaultValue: "{type} has no input connections",
      params: { type: match[1] },
    });
  }

  match = message.match(/^Node '(.+)' not found$/);
  if (match) {
    return t("engine.dag.node_nodeid_not_found", {
      defaultValue: "Node '{nodeId}' not found",
      params: { nodeId: match[1] },
    });
  }

  match = message.match(
    /^Dimension (\d+) must match across all inputs for concatenation$/
  );
  if (match) {
    return t(
      "layer.Merge.validation.dimension_dim_must_match_across_all_inputs_for_concatenation",
      {
        defaultValue:
          "Dimension {dim} must match across all inputs for concatenation",
        params: { dim: Number(match[1]) },
      }
    );
  }

  if (options?.layerType) {
    const key = layerValidationKey(options.layerType, message);
    const translated = t(key, { defaultValue: message });
    if (translated !== key) return translated;
  }

  return message;
}

export function localizeLayerChip(locale: Locale, chip: string): string {
  if (!isChineseLocale(locale)) return chip;

  const exact: Record<string, string> = {
    Grayscale: "灰度",
    Color: "彩色",
    "Custom Image": "自定义图像",
    Flattened: "展平",
    Sequence: "序列",
    "Token Indices": "Token 索引",
    Concatenate: "拼接",
    Add: "加和",
    Multiply: "乘法",
    Average: "平均",
    Maximum: "最大值",
    "Multi-class": "多分类",
    Binary: "二分类",
    Regression: "回归",
    "Multi-label": "多标签",
  };

  if (chip in exact) return exact[chip];

  const replacements: Array<[RegExp, string]> = [
    [/^shape: (.+)$/, "形状: $1"],
    [/^pool: (.+)$/, "池化: $1"],
    [/^kernel: (.+)$/, "卷积核: $1"],
    [/^rate: (.+)$/, "比率: $1"],
    [/^size: (.+)$/, "大小: $1"],
    [/^(\d+) filters$/, "$1 个过滤器"],
    [/^(\d+) units$/, "$1 个单元"],
    [/^(\d+) classes$/, "$1 类"],
    [/^(\d+) labels$/, "$1 个标签"],
    [/^1 unit$/, "1 个单元"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(chip)) return chip.replace(pattern, replacement);
  }

  return chip;
}

function localizeCodeCommentLine(locale: Locale, line: string): string {
  if (!isChineseLocale(locale)) return line;
  if (!line.trimStart().startsWith("#")) return line;

  let out = line;

  const exact: Record<string, string> = {
    "# Error: Invalid network structure": "# 错误：网络结构无效",
    "# Invalid DAG structure - cannot generate code": "# DAG 结构无效，无法生成代码",
    "# No layers to generate code for": "# 没有可生成代码的层",
    "# Create the model": "# 创建模型",
    "# Compile the model": "# 编译模型",
    "# Display model summary": "# 显示模型摘要",
    "# Create model instance": "# 创建模型实例",
    "# Print model summary": "# 打印模型摘要",
    "# Layer not supported": "# 暂不支持该层",
    "# Cropping2D - invalid format": "# Cropping2D - 格式无效",
    "# Use torch.flatten(x, 1) in forward method":
      "# 在 forward 方法中使用 torch.flatten(x, 1)",
  };

  if (exact[out]) return exact[out];

  const rules: Array<[RegExp, string]> = [
    [/^# Error: Could not generate code for (.+)$/, "# 错误：无法为 $1 生成代码"],
    [/^# Warning: (.+) has no inputs$/, "# 警告：$1 没有输入"],
    [/^# Repeated (\d+) times$/, "# 重复 $1 次"],
    [/^# Unknown layer type: (.+)$/, "# 未知层类型：$1"],
    [/^# (keras|pytorch) not yet supported for (.+)$/, "# $1 暂不支持 $2"],
    [/^# Input shape: (.+) - channels first$/, "# 输入形状：$1（channels first）"],
    [/^# Input shape: (.+)$/, "# 输入形状：$1"],
    [/^# Cropping2D: (.+)$/, "# Cropping2D：$1"],
    [/^# Reshape: (.+)$/, "# Reshape：$1"],
    [/^# Permute: (.+)$/, "# Permute：$1"],
    [/^# Merge (.+): (.+)$/, "# Merge $1：$2"],
    [/^# Gaussian Noise: (.+)$/, "# 高斯噪声：$1"],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(out)) {
      out = out.replace(pattern, replacement);
      break;
    }
  }

  out = out.replace(" across time dimension", "（跨时间维度应用）");
  out = out.replace(" in forward method", "（在 forward 方法中）");

  return out;
}

export function localizeGeneratedPythonCode(locale: Locale, code: string): string {
  if (!isChineseLocale(locale) || !code) return code;
  return code.split("\n").map((line) => localizeCodeCommentLine(locale, line)).join("\n");
}
