export function layerNameKey(layerType: string): string {
  return `layer.${layerType}.name`;
}

export function layerDescriptionKey(layerType: string): string {
  return `layer.${layerType}.description`;
}

export function layerParamLabelKey(layerType: string, paramKey: string): string {
  return `layer.${layerType}.param.${paramKey}.label`;
}

export function layerParamDescriptionKey(
  layerType: string,
  paramKey: string
): string {
  return `layer.${layerType}.param.${paramKey}.description`;
}

export function layerParamOptionLabelKey(
  layerType: string,
  paramKey: string,
  optionValue: string
): string {
  return `layer.${layerType}.param.${paramKey}.option.${optionValue}.label`;
}

export function layerParamOptionDescriptionKey(
  layerType: string,
  paramKey: string,
  optionValue: string
): string {
  return `layer.${layerType}.param.${paramKey}.option.${optionValue}.description`;
}

export function categoryNameKey(categoryKey: string): string {
  return `category.${categoryKey}.name`;
}

export function categoryDescriptionKey(categoryKey: string): string {
  return `category.${categoryKey}.description`;
}

export function templateCategoryNameKey(categoryKey: string): string {
  return `templateCategory.${categoryKey}.name`;
}

export function templateCategoryDescriptionKey(categoryKey: string): string {
  return `templateCategory.${categoryKey}.description`;
}

export function templateNameKey(templateId: string): string {
  return `template.${templateId}.name`;
}

export function templateDescriptionKey(templateId: string): string {
  return `template.${templateId}.description`;
}

export function tagKey(tag: string): string {
  return `tag.${tag}`;
}

