import { useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import {
  useI18n,
  layerNameKey,
  layerParamLabelKey,
  layerParamOptionLabelKey,
} from "../i18n";
import {
  localizeLayerChip,
  localizeRuntimeMessage,
  zhText,
} from "../i18n/localize";
import { getDefaultParams, getLayerFormSpec } from "../lib/layers/parameters";
import { getLayerCategoryColors } from "../lib/categories";
import { getLayerIcon } from "../lib/layer-definitions";
import {
  getParameterDisplayValues,
  getTotalParameterCount,
} from "../lib/layer-display";
import type { LayerParamValue } from "../lib/layers/parameters";
import type { LayerFormField } from "../lib/layers/parameters";

interface LayerNodeData {
  type: string;
  params: Record<string, LayerParamValue>;
  hasShapeError?: boolean;
  shapeErrorMessage?: string;
}

interface LayerNodeProps {
  id: string;
  data: LayerNodeData;
}

export function LayerNode({ id, data }: LayerNodeProps) {
  const { t, locale } = useI18n();
  const {
    type,
    params = getDefaultParams(data.type),
    hasShapeError,
    shapeErrorMessage,
  } = data;
  const [isOpen, setIsOpen] = useState(false);
  const [editParams, setEditParams] = useState(params);
  const { updateNodeData, deleteElements } = useReactFlow();

  const formSpec = getLayerFormSpec(type);
  const icon = getLayerIcon(type);
  const categoryColors = getLayerCategoryColors(type);
  const visibleParams = getParameterDisplayValues(type, params);
  const localizedVisibleParams = visibleParams.map((param) =>
    localizeLayerChip(locale, param)
  );
  const totalParams = getTotalParameterCount(type);
  const showMoreIndicator = type !== "Input" && totalParams > 3;
  const localizedTypeName = t(layerNameKey(type), { defaultValue: type });
  const localizedShapeErrorMessage = shapeErrorMessage
    ? localizeRuntimeMessage(locale, t, shapeErrorMessage, { layerType: type })
    : undefined;
  const shapeErrorTitle = localizedShapeErrorMessage
    ? t("ui.LayerNode.shape_error_shapeerrormessage", {
        defaultValue: "Shape Error: {shapeErrorMessage}",
        params: { shapeErrorMessage: localizedShapeErrorMessage },
      })
    : null;

  const handleDoubleClick = () => {
    setIsOpen(true);
    setEditParams({ ...params });
  };

  const handleSave = () => {
    updateNodeData(id, { ...data, params: editParams });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditParams({ ...params });
    setIsOpen(false);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const renderParamEditor = (field: LayerFormField) => {
    const { key, label, type: fieldType, options, min, max, step, show } = field;

    if (show && !show(editParams)) return null;

    const localizedLabel = t(layerParamLabelKey(type, key), {
      defaultValue: label,
    });

    const updateParam = (newValue: string | number) => {
      setEditParams((prev) => ({ ...prev, [key]: newValue }));
    };

    if (fieldType === "select") {
      const currentValue = editParams[key]?.toString() || "";
      const selectValue =
        currentValue === "" && key === "activation" ? "none" : currentValue;
      const placeholderExpr =
        locale === "zh-CN" ? localizedLabel : localizedLabel.toLowerCase();

      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key} className="text-xs">
            {localizedLabel}
          </Label>
          <Select value={selectValue} onValueChange={updateParam}>
            <SelectTrigger className="h-8">
              <SelectValue
                placeholder={t("ui.LayerNode.select_expr0", {
                  defaultValue: "Select {expr0}",
                  params: { expr0: placeholderExpr },
                })}
              />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(layerParamOptionLabelKey(type, key, option.value), {
                    defaultValue: option.label,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1">
        <Label htmlFor={key} className="text-xs">
          {localizedLabel}
        </Label>
        <Input
          id={key}
          type={fieldType}
          value={editParams[key]?.toString() || ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const value =
              fieldType === "number" && e.target.value !== ""
                ? Number(e.target.value)
                : e.target.value;
            updateParam(value);
          }}
          className="h-8"
        />
      </div>
    );
  };

  const getNodeClasses = () => {
    const base =
      "flex flex-col px-4 py-3 rounded-xl shadow-md border-2 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] min-w-[160px] max-w-[280px]";

    if (hasShapeError) {
      return `${base} border-red-500 hover:border-red-600 hover:shadow-red-200/50 bg-red-50`;
    }

    return `${base} ${categoryColors.border} ${categoryColors.hover} ${categoryColors.bg}`;
  };

  const getHandleClasses = (isError: boolean, color: string) =>
    `w-4 h-4 border-2 border-white shadow-sm ${
      isError ? "!bg-red-500" : color
    }`;

  return (
    <div className="layer-node">
      {type !== "Input" && (
        <Handle
          type="target"
          position={Position.Top}
          className={getHandleClasses(!!hasShapeError, "!bg-blue-500")}
        />
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDelete();
              }}
              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg hover:shadow-xl hover:scale-110"
              title={t("ui.LayerNode.delete_this_block", {
                defaultValue: "Delete this block",
              })}
            >
              <Trash2 className="h-3 w-3" />
            </button>

            <div
              className={getNodeClasses()}
              onDoubleClick={handleDoubleClick}
              title={
                hasShapeError
                  ? (shapeErrorTitle ?? undefined)
                  : `${localizedTypeName} - ${zhText(
                      locale,
                      "Double click to edit",
                      "双击编辑"
                    )}`
              }
            >
              <div
                className={`flex items-center gap-2 ${
                  visibleParams.length === 0 && !hasShapeError
                    ? "justify-center"
                    : ""
                }`}
              >
                <span className="text-base group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                  {icon}
                </span>
                <span
                  className={`font-semibold text-sm truncate ${
                    hasShapeError ? "text-red-700" : "text-slate-700"
                  }`}
                >
                  {localizedTypeName}
                </span>
                {params.multiplier && Number(params.multiplier) > 1 && (
                  <span
                    className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    title={t("ui.LayerNode.this_layer_will_be_repeated_multiplier_times", {
                      defaultValue: "This layer will be repeated {multiplier} times",
                      params: { multiplier: Number(params.multiplier) },
                    })}
                  >
                    {t("ui.LayerNode.msg", { defaultValue: "×" })}
                    {params.multiplier}
                  </span>
                )}
                {hasShapeError && (
                  <span
                    className="text-red-500 text-sm font-bold flex-shrink-0"
                    title={shapeErrorTitle ?? undefined}
                  >
                    {t("ui.LayerNode.msg_2", { defaultValue: "⚠️" })}
                  </span>
                )}
              </div>

              {localizedVisibleParams.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-hidden">
                  <div className="flex gap-1 flex-1 min-w-0">
                    {localizedVisibleParams
                      .slice(0, showMoreIndicator ? 2 : 3)
                      .map((param, index) => (
                        <span
                          key={index}
                          className="text-xs text-slate-600 bg-white/70 px-2 py-0.5 rounded-md truncate flex-shrink-0 max-w-[80px]"
                          title={param}
                        >
                          {param}
                        </span>
                      ))}
                  </div>
                  {showMoreIndicator && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium flex-shrink-0">
                      {t("ui.LayerNode.msg_3", { defaultValue: "+" })}
                      {totalParams - 2}{" "}
                      {t("ui.LayerNode.more", { defaultValue: "more" })}
                    </span>
                  )}
                </div>
              )}

              {hasShapeError && localizedShapeErrorMessage && (
                <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-md border border-red-200 mt-2">
                  {localizedShapeErrorMessage}
                </div>
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80" side="right" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span>{icon}</span>
                {t("ui.LayerNode.edit", { defaultValue: "Edit" })}{" "}
                {localizedTypeName}{" "}
                {t("ui.LayerNode.layer", { defaultValue: "Layer" })}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("ui.LayerNode.configure_the_parameters_for_this_layer", {
                  defaultValue: "Configure the parameters for this layer.",
                })}
              </p>
            </div>

            <div className="space-y-3">{formSpec.map(renderParamEditor)}</div>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                {t("ui.LayerNode.save", { defaultValue: "Save" })}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {t("ui.LayerNode.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {type !== "Output" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={getHandleClasses(!!hasShapeError, "!bg-green-500")}
        />
      )}
    </div>
  );
}
