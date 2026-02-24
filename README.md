# BlockDL

![](banner.png)
**An easy visual way to design neural networks**

> Now Supports PyTorch!

BlockDL is a web-based visual editor for building deep learning models. Drag and drop layers, connect them visually, and generate Keras code automatically.

https://github.com/user-attachments/assets/dd797164-ea8e-41a1-9c29-1e95a17fb144


> This repository contains the code for the core code-generation interface and engine. The courses on htttps://blockdl.com are yet to be open-sourced.

## ✨ Features

- 🎨 **Visual Design**: Drag and drop neural network layers
- 🔗 **Smart Connections**: Automatic shape validation, so you catch problems early.
- 🐍 **Code Generation**: Copy working Keras and Pytorch code instantly as you build your network
- 🚀 **No Installation**: Runs entirely in your browser

## 🚀 Quick Start

### Online (Recommended)
Visit https://blockdl.com to start designing neural networks immediately.

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aryagm/blockdl.git
   cd blockdl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🌐 Adding a Translation

BlockDL uses a small i18n system with:
- a locale registry (`src/i18n/locales.ts`)
- locale matching logic (`src/i18n/locale-matcher.ts`)
- message catalogs (`src/i18n/messages/*.ts`)
- runtime provider wiring (`src/i18n/I18nProvider.tsx`)

### Add a new language (example: `ja`)

1. **Register the locale**
   Add a new entry in `src/i18n/locales.ts` with:
   - `code` (e.g. `ja`)
   - `aliases` (browser/Accept-Language variants, e.g. `ja`, `ja-jp`)
   - `switcherLabel` (label shown in the language dropdown)

   The language switcher reads `REGISTERED_LOCALES` automatically, so it will appear in the UI without extra changes.

2. **Create the message catalog**
   Add a file like `src/i18n/messages/ja.ts` that exports:
   - `jaMessages`
   - typed as `PartialMessages`

   Follow the same pattern as `src/i18n/messages/zh-CN.ts`.

3. **Wire the catalog into the provider**
   Update `src/i18n/I18nProvider.tsx` and add the new locale catalog to `mergedCatalog`.

4. **Translate UI strings incrementally**
   Use `t()` / `useI18n()` in components and semantic keys from `src/i18n/keys.ts` where possible.

   Example patterns:
   - `t("ui.AppHeader.help", { defaultValue: "Help" })`
   - `t(layerNameKey(type), { defaultValue: type })`
   - `t(templateNameKey(template.id), { defaultValue: template.name })`

5. **Build and verify**
   ```bash
   npm run build
   ```
   Switch to the new language in the header dropdown and check:
   - palette cards / templates
   - layer editor labels and errors
   - code viewer UI and generated code comments
   - welcome/help dialogs

### Notes about extraction scripts

- The current extractor/sync workflow is set up for English source + `zh-CN` (`npm run i18n:extract` and `npm run i18n:sync`).
- To support a new generated translation workflow (e.g. `ja`), extend the scripts in `scripts/i18n/` using the existing `zh-CN` path as the template.
- You do **not** need to change `src/i18n/locale-matcher.ts` when adding a translation unless you want to change matching behavior itself.

## 📄 License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE.md](LICENSE.md) file for details.
