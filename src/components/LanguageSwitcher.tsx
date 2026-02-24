import { Languages } from "lucide-react";

import {
  REGISTERED_LOCALES,
  isRegisteredLocaleCode,
  useI18n,
} from "../i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (isRegisteredLocaleCode(value)) setLocale(value);
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-[132px] gap-1.5 border-slate-200 bg-white"
        aria-label="Language"
      >
        <Languages className="h-4 w-4 text-slate-500" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {REGISTERED_LOCALES.map((option) => (
          <SelectItem key={option.code} value={option.code}>
            {option.switcherLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
