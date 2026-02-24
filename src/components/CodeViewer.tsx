import { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useI18n } from "../i18n";
import {
  localizeGeneratedPythonCode,
  localizeRuntimeMessage,
  zhText,
} from "../i18n/localize";
import { parseGraphToDAG, type DAGResult } from "../lib/dag-parser";
import {
  generateKerasCode,
  generateFunctionalKerasCode,
  generatePyTorchCode,
} from "../lib/code-generation";
import { useFlowStore } from "../lib/flow-store";
import { cn } from "../lib/utils";

const UI_CONFIG = {
  COPY_TIMEOUT: 2000,
  BUTTON_HEIGHT: "h-9",
  BORDER_RADIUS: "rounded-lg",
  SPACING: {
    CARD: "px-4 sm:px-6",
    PADDING: "p-4 sm:p-6",
  },
} as const;

// Helper functions
function checkIfFunctionalAPINeeded(dagResult: DAGResult): boolean {
  const hasMultipleInputs =
    dagResult.orderedNodes.filter((n) => n.type === "Input").length > 1;
  const hasMultipleOutputs =
    dagResult.orderedNodes.filter((n) => n.type === "Output").length > 1;
  const hasComplexStructure = Array.from(dagResult.edgeMap.values()).some(
    (targets) => targets.length > 1
  );
  const hasMergeLayer = dagResult.orderedNodes.some((n) => n.type === "Merge");

  return (
    hasMultipleInputs ||
    hasMultipleOutputs ||
    hasComplexStructure ||
    hasMergeLayer
  );
}

function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

// Sub-components
interface APIBadgeProps {
  codeType: "sequential" | "functional";
  localeLabel: {
    functional: string;
    sequential: string;
  };
}

function APIBadge({ codeType, localeLabel }: APIBadgeProps) {
  const isFunctional = codeType === "functional";

  return (
    <span
      className={cn(
        "text-xs px-3 py-1.5 rounded-full font-medium border",
        isFunctional
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-green-100 text-green-700 border-green-200"
      )}
    >
      {isFunctional ? localeLabel.functional : localeLabel.sequential}
    </span>
  );
}

function BetaBadge({ label }: { label: string }) {
  return (
    <span className="text-xs px-3 py-1.5 rounded-full font-medium border bg-orange-100 text-orange-700 border-orange-200">
      {label}
    </span>
  );
}

interface ActionButtonsProps {
  onDownload: () => void;
  onCopy: () => void;
  isDisabled: boolean;
  isCopied: boolean;
  labels: {
    download: string;
    copy: string;
    copied: string;
  };
}

function ActionButtons({
  onDownload,
  onCopy,
  isDisabled,
  isCopied,
  labels,
}: ActionButtonsProps) {
  const baseButtonClass = cn(
    UI_CONFIG.BUTTON_HEIGHT,
    "px-4",
    UI_CONFIG.BORDER_RADIUS,
    "transition-all duration-200 shadow-sm"
  );

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isDisabled}
          className={cn(
            baseButtonClass,
            "border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
          )}
        >
          <Download className="h-4 w-4 mr-2" />
          {labels.download}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={isDisabled}
          className={cn(
            baseButtonClass,
            isCopied
              ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 shadow-md"
              : "border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
          )}
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              {labels.copied}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              {labels.copy}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface CodeEditorProps {
  code: string;
}

function CodeEditor({ code }: CodeEditorProps) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-inner bg-slate-50/30 flex-1 min-h-0">
      <div className="w-full h-full overflow-auto">
        <CodeMirror
          value={code}
          height="100%"
          extensions={[python()]}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            highlightSelectionMatches: false,
            searchKeymap: false,
          }}
        />
      </div>
    </div>
  );
}

interface CodeViewerProps {
  className?: string;
}

// Generates code from visual neural network graph
export function CodeViewer({ className = "" }: CodeViewerProps) {
  const { t, locale } = useI18n();
  const { nodes, edges } = useFlowStore();
  const [generatedCode, setGeneratedCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [codeType, setCodeType] = useState<"sequential" | "functional">(
    "sequential"
  );
  const [framework, setFramework] = useState<"keras" | "pytorch">("keras");
  const tt = (key: string, defaultValue: string) => t(key, { defaultValue });

  const resetCopyState = useCallback(() => {
    setTimeout(() => setIsCopied(false), UI_CONFIG.COPY_TIMEOUT);
  }, []);

  // Auto-generate code when graph changes
  useEffect(() => {
    const generateCode = async () => {
      const dagResult = parseGraphToDAG(nodes, edges);

      if (!dagResult.isValid) {
        const localizedErrors = dagResult.errors.map((error) =>
          localizeRuntimeMessage(locale, t, error)
        );
        setGeneratedCode(
          localizeGeneratedPythonCode(
            locale,
            `# Error: Invalid network structure\n# ${localizedErrors.join("\n# ")}`
          )
        );
        return;
      }

      if (framework === "pytorch") {
        setCodeType("sequential"); // PyTorch doesn't need functional distinction
        setGeneratedCode(
          localizeGeneratedPythonCode(
            locale,
            generatePyTorchCode(dagResult.orderedNodes)
          )
        );
      } else {
        const shouldUseFunctional = checkIfFunctionalAPINeeded(dagResult);

        if (shouldUseFunctional) {
          setCodeType("functional");
          const functionalCode = await generateFunctionalKerasCode(dagResult);
          setGeneratedCode(localizeGeneratedPythonCode(locale, functionalCode));
        } else {
          setCodeType("sequential");
          setGeneratedCode(
            localizeGeneratedPythonCode(
              locale,
              generateKerasCode(dagResult.orderedNodes)
            )
          );
        }
      }
    };

    generateCode();
  }, [nodes, edges, framework, locale, t]);

  const handleCopyCode = useCallback(async () => {
    if (!generatedCode.trim()) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      resetCopyState();
    } catch {
      // Fallback for older browsers
      fallbackCopyToClipboard(generatedCode);
      setIsCopied(true);
      resetCopyState();
    }
  }, [generatedCode, resetCopyState]);

  const handleDownloadCode = useCallback(() => {
    if (!generatedCode.trim()) return;

    const blob = new Blob([generatedCode], { type: "text/python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${framework}_model_${codeType}.py`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generatedCode, codeType, framework]);

  return (
    <div className={cn("h-full flex flex-col bg-slate-50/80", className)}>
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0",
          UI_CONFIG.SPACING.PADDING
        )}
      >
        <Card className="border-slate-200 bg-white shadow-sm rounded-xl flex-1 flex flex-col min-h-0">
          <CardHeader className={cn("flex-shrink-0", UI_CONFIG.SPACING.CARD)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐍</span>
                  <CardTitle className="text-xl text-slate-800 font-semibold">
                    {framework === "pytorch"
                      ? tt("ui.CodeViewer.pytorch", "PyTorch")
                      : tt("ui.CodeViewer.keras", "Keras")}{" "}
                    {tt("ui.CodeViewer.code", "Code")}
                  </CardTitle>
                </div>
                {framework === "keras" && (
                  <APIBadge
                    codeType={codeType}
                    localeLabel={{
                      functional: zhText(locale, "Functional API", "函数式 API"),
                      sequential: zhText(locale, "Sequential API", "顺序式 API"),
                    }}
                  />
                )}
                {framework === "pytorch" && (
                  <BetaBadge label={tt("ui.CodeViewer.beta", "Beta")} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={framework} onValueChange={(value: "keras" | "pytorch") => setFramework(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue
                      placeholder={tt("ui.CodeViewer.framework", "Framework")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keras">
                      {tt("ui.CodeViewer.keras", "Keras")}
                    </SelectItem>
                    <SelectItem value="pytorch">
                      {tt("ui.CodeViewer.pytorch", "PyTorch")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ActionButtons
              onDownload={handleDownloadCode}
              onCopy={handleCopyCode}
              isDisabled={!generatedCode.trim()}
              isCopied={isCopied}
              labels={{
                download: tt("ui.CodeViewer.download_py", "Download .py"),
                copy: tt("ui.CodeViewer.copy_code", "Copy Code"),
                copied: tt("ui.CodeViewer.copied", "Copied!"),
              }}
            />
          </CardHeader>
          <CardContent
            className={cn(
              "pt-0 flex-1 flex flex-col min-h-0",
              UI_CONFIG.SPACING.CARD
            )}
          >
            <CodeEditor code={generatedCode} />
          </CardContent>
          <div className="px-2 text-center">
            <div className="text-xs text-slate-500 font-semibold">
              {tt("ui.CodeViewer.made_with_by", "Made with ❤️ by")}{" "}
              <a
                href="https://aryagm.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bold"
              >
                {tt("ui.CodeViewer.aryagm", "@aryagm")}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
