# HextaUI CLI

A command-line tool for adding customizable UI components to Next.js projects.

[![npm version](https://badge.fury.io/js/hextaui.svg)](https://badge.fury.io/js/hextaui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Initialize HextaUI
npx hextaui@latest init

# Add components
npx hextaui add Button Card Input

# Interactive mode
npx hextaui add
```

## 📦 Installation

Run without installation using npx:

```bash
npx hextaui@latest init
```

## 🛠️ Usage

### Initialize Project

```bash
npx hextaui init
```

Creates:

- `src/components/ui/` for components
- `src/lib/utils.ts` for utilities
- Configures project for HextaUI

### Add Components

```bash
# Add specific components
npx hextaui add Button Card

# Interactive selection
npx hextaui add
```

Options:

- `--deps`: Auto-install dependencies
- `--no-deps`: Skip dependency installation
- `--fast`: Manual dependency copying

### List Components

```bash
npx hextaui list
```

## 🎨 Components

- Button
- Card
- Input
- Label
- Avatar
- Separator
- Tooltip
- Breadcrumb
- Kbd
- Accordion
- Alert
- Badge
- Calendar
- Checkbox
- Chip
- ColorPicker
- CommandMenu
- DatePicker
- Drawer
- DropdownMenu
- FileUpload
- InputOTP
- Loader
- MenuBar
- Modal
- Pagination
- Progress
- Radio
- ScrollArea

## ⚙️ Requirements

- Next.js 13+
- React 18+
- Tailwind CSS v4
- Node.js 16+

## 📁 Project Structure

```text
src/
├── components/
│   └── ui/
│       ├── button/
│       ├── card/
│       └── ...
└── lib/
    └── utils.ts
```

## 🔧 Commands

```bash
npx hextaui init              # Initialize project
npx hextaui add Button Card   # Add components
npx hextaui add --deps        # Auto-install dependencies
npx hextaui add --fast        # Fast mode
npx hextaui list              # List components
```

## 🌐 Links

- [Homepage](https://hextaui.com)
- [Documentation](https://docs.hextaui.com)
- [GitHub](https://github.com/preetsuthar17/cli)
- [Issues](https://github.com/preetsuthar17/cli/issues)

## 📄 License

MIT License

Built with ❤️ by [Preet Suthar](https://github.com/preetsuthar17)
