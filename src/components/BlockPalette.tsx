import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Layers, Grid3X3 } from "lucide-react";
import { Input } from "./ui/input";
import { getLayerTypes } from "../lib/layer-definitions";
import { categories as layerCategoryDefs, getLayerCategories } from "../lib/categories";
import {
  getAllTemplates,
  templateCategories,
  getTemplateCategoryColors,
  type NetworkTemplate,
} from "../lib/templates";
import {
  useI18n,
  categoryDescriptionKey,
  categoryNameKey,
  layerDescriptionKey,
  layerNameKey,
  tagKey,
  templateCategoryDescriptionKey,
  templateCategoryNameKey,
  templateDescriptionKey,
  templateNameKey,
} from "../i18n";
import { zhText } from "../i18n/localize";

const CONFIG = {
  POLLING_INTERVAL: 100,
  DRAG_CURSOR: { GRAB: "grab", GRABBING: "grabbing" },
  TABS: { LAYERS: "layers", TEMPLATES: "templates" },
} as const;

type LayerType = {
  type: string;
  icon: string;
  description: string;
};

type CategoryType = {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  layerTypes: string[];
};

type TemplatesByCategory = {
  [key: string]: {
    category: string;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    hoverColor: string;
    description: string;
    icon: string;
    templates: Array<
      NetworkTemplate & {
        displayName: string;
        displayDescription: string;
        displayTags: string[];
      }
    >;
  };
};

interface BlockPaletteProps {
  className?: string;
}

// Drag-and-drop interface for React Flow
export default function BlockPalette({
  className = "",
}: BlockPaletteProps = {}) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<string>(CONFIG.TABS.LAYERS);
  const [layerTypes, setLayerTypes] = useState<LayerType[]>([]);
  const [layerCategories, setLayerCategories] = useState<CategoryType[]>([]);
  const [templates, setTemplates] = useState<NetworkTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const tt = (key: string, defaultValue: string) => t(key, { defaultValue });

  const updateData = useCallback(() => {
    const types = getLayerTypes();
    const categories = getLayerCategories();
    const allTemplates = getAllTemplates();

    console.log(
      `🔄 BlockPalette updateData: ${types.length} types, ${categories.length} categories, ${allTemplates.length} templates`
    );

    setLayerTypes(types);
    setLayerCategories(categories);
    setTemplates(allTemplates);
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, layerType: string) => {
      event.dataTransfer.setData("layerType", layerType);
      event.dataTransfer.setData("application/reactflow", "default");
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleTemplateDragStart = useCallback(
    (event: React.DragEvent, templateId: string) => {
      event.dataTransfer.setData("templateId", templateId);
      event.dataTransfer.setData("application/reactflow", "template");
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const clearSearch = useCallback(() => setSearchTerm(""), []);

  useEffect(() => {
    updateData();

    // Poll until data loads (YAML loading is async)
    const interval = setInterval(() => {
      const currentTypes = getLayerTypes();
      const currentCategories = getLayerCategories();
      const currentTemplates = getAllTemplates();

      if (
        currentTypes.length > 0 &&
        currentCategories.length > 0 &&
        currentTemplates.length > 0 &&
        (currentTypes.length !== layerTypes.length ||
          currentCategories.length !== layerCategories.length ||
          currentTemplates.length !== templates.length)
      ) {
        updateData();
        clearInterval(interval);
      }
    }, CONFIG.POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [layerTypes.length, layerCategories.length, templates.length, updateData]);

  const localizedLayerTypes = useMemo(
    () =>
      layerTypes.map((layer) => ({
        ...layer,
        displayName: t(layerNameKey(layer.type), { defaultValue: layer.type }),
        displayDescription: t(layerDescriptionKey(layer.type), {
          defaultValue: layer.description,
        }),
      })),
    [layerTypes, t]
  );

  const localizedLayerCategories = useMemo(
    () =>
      layerCategories.map((category) => {
        const categoryKey = Object.entries(layerCategoryDefs).find(
          ([, value]) => value.name === category.name
        )?.[0];

        return {
          ...category,
          name:
            categoryKey !== undefined
              ? t(categoryNameKey(categoryKey), { defaultValue: category.name })
              : category.name,
          description:
            categoryKey !== undefined
              ? t(categoryDescriptionKey(categoryKey), {
                  defaultValue: category.description,
                })
              : category.description,
        };
      }),
    [layerCategories, t]
  );

  const localizedTemplates = useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        displayName: t(templateNameKey(template.id), {
          defaultValue: template.name,
        }),
        displayDescription: t(templateDescriptionKey(template.id), {
          defaultValue: template.description,
        }),
        displayTags: template.tags.map((tag) =>
          t(tagKey(tag), { defaultValue: tag })
        ),
      })),
    [templates, t]
  );

  // Filter layers by search term
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = localizedLayerCategories
    .map((category) => {
      const matchingLayers = localizedLayerTypes.filter(
        (layer) =>
          category.layerTypes.includes(layer.type) &&
          (normalizedSearch === "" ||
            layer.type.toLowerCase().includes(normalizedSearch) ||
            layer.displayName.toLowerCase().includes(normalizedSearch) ||
            layer.description.toLowerCase().includes(normalizedSearch) ||
            layer.displayDescription.toLowerCase().includes(normalizedSearch))
      );

      return { ...category, layers: matchingLayers };
    })
    .filter((category) => category.layers.length > 0);

  // Group templates by category and filter by search term
  const templatesByCategory: TemplatesByCategory = {};

  Object.entries(templateCategories).forEach(([key, category]) => {
    const categoryTemplates = localizedTemplates.filter(
      (template) =>
        template.category === key &&
        (normalizedSearch === "" ||
          template.name.toLowerCase().includes(normalizedSearch) ||
          template.displayName.toLowerCase().includes(normalizedSearch) ||
          template.description.toLowerCase().includes(normalizedSearch) ||
          template.displayDescription.toLowerCase().includes(normalizedSearch) ||
          template.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
          template.displayTags.some((tag) => tag.toLowerCase().includes(normalizedSearch)))
    );

    if (categoryTemplates.length > 0) {
      const colors = getTemplateCategoryColors(key);
      templatesByCategory[key] = {
        category: key,
        name: t(templateCategoryNameKey(key), { defaultValue: category.name }),
        color: category.color,
        bgColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        hoverColor: colors.hover,
        description: t(templateCategoryDescriptionKey(key), {
          defaultValue: category.description,
        }),
        icon: category.icon,
        templates: categoryTemplates,
      };
    }
  });

  const hasNoResults =
    (activeTab === CONFIG.TABS.LAYERS
      ? filteredCategories.length === 0
      : Object.keys(templatesByCategory).length === 0) && searchTerm;

  return (
    <div
      className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}
    >
      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-white rounded-lg p-1 border border-slate-200">
        <button
          onClick={() => setActiveTab(CONFIG.TABS.LAYERS)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === CONFIG.TABS.LAYERS
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
          >
            <Layers className="h-4 w-4" />
          {tt("ui.BlockPalette.layers", "Layers")}
        </button>
        <button
          onClick={() => setActiveTab(CONFIG.TABS.TEMPLATES)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === CONFIG.TABS.TEMPLATES
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
          >
            <Grid3X3 className="h-4 w-4" />
          {tt("ui.BlockPalette.templates", "Templates")}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder={
            activeTab === CONFIG.TABS.LAYERS
              ? zhText(locale, "Search layers...", "搜索层...")
              : zhText(locale, "Search templates...", "搜索模板...")
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasNoResults ? (
        <div className="text-center py-8 text-slate-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>
            {tt("ui.BlockPalette.no", "No")}{" "}
            {(activeTab === CONFIG.TABS.LAYERS
              ? tt("ui.BlockPalette.layers", "Layers")
              : tt("ui.BlockPalette.templates", "Templates")
            ).toLowerCase()}{" "}
            {tt("ui.BlockPalette.found_matching", 'found matching "')}
            {searchTerm}
            {tt("ui.BlockPalette.msg", '"')}
          </p>
        </div>
      ) : (
          activeTab === CONFIG.TABS.LAYERS
            ? filteredCategories.length === 0
            : Object.keys(templatesByCategory).length === 0
        ) ? (
        <div className="text-center py-8 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
          <p>
            {tt("ui.BlockPalette.loading", "Loading")}{" "}
            {(activeTab === CONFIG.TABS.LAYERS
              ? tt("ui.BlockPalette.layers", "Layers")
              : tt("ui.BlockPalette.templates", "Templates")
            ).toLowerCase()}
            {tt("ui.BlockPalette.msg_2", "...")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === CONFIG.TABS.LAYERS
            ? // Layers View
              filteredCategories.map((category) => (
                <div key={category.name} className="space-y-3">
                  <h3
                    className={`text-sm font-medium ${category.textColor} border-b border-slate-200 pb-1`}
                  >
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.layers.map((layer) => (
                      <div
                        key={layer.type}
                        className={`cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${category.borderColor} ${category.bgColor} rounded-xl shadow-sm border-2 p-3`}
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(event, layer.type)
                        }
                        style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRABBING)
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRAB)
                        }
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 ${category.textColor}`}
                        >
                          <span className="text-base">{layer.icon}</span>
                          <span className="font-medium text-sm">
                            {layer.displayName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {layer.displayDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : // Templates View
              Object.values(templatesByCategory).map((categoryData) => (
                <div key={categoryData.category} className="space-y-3">
                  <h3
                    className={`text-sm font-medium ${categoryData.textColor} border-b border-slate-200 pb-1 flex items-center gap-2`}
                  >
                    <span>{categoryData.icon}</span>
                    {categoryData.name}
                  </h3>
                  <div className="space-y-2">
                    {categoryData.templates.map((template) => (
                      <div
                        key={template.id}
                        className={`cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${categoryData.borderColor} ${categoryData.bgColor} rounded-xl shadow-sm border-2 p-3`}
                        draggable
                        onDragStart={(event) =>
                          handleTemplateDragStart(event, template.id)
                        }
                        style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRABBING)
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRAB)
                        }
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 ${categoryData.textColor}`}
                        >
                          <span className="text-base">{template.icon}</span>
                          <span className="font-medium text-sm">
                            {template.displayName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">
                          {template.displayDescription}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {template.displayTags.slice(0, 3).map((tag, index) => (
                            <span
                              key={`${template.tags[index]}-${tag}`}
                              className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                              {tt("ui.BlockPalette.msg_3", "+")}
                              {template.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
