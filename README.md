# HextaUI CLI

[![npm version](https://badge.fury.io/js/hextaui.svg)](https://badge.fury.io/js/hextaui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful command-line interface for installing beautiful, customizable UI components in your Next.js projects. Build stunning websites effortlessly with HextaUI's collection of modern React components.

## 🚀 Quick Start

```bash
# Initialize HextaUI in your project
npx hextaui@latest init

# Add specific components
npx hextaui add Button Card Input

# Or browse and select interactively
npx hextaui add
```

## 📦 Installation

No installation required! Use npx to run the latest version:

```bash
npx hextaui@latest init
```

## 🛠️ Usage

### Initialize HextaUI in your project

```bash
npx hextaui init
```

This command will:

- ✅ Create `src/components/ui/` directory structure
- ✅ Add utility functions in `src/lib/utils.ts`
- ✅ Configure your project for HextaUI components

### Add components

#### Add specific components by name:

```bash
# Add single component
npx hextaui add Button

# Add multiple components
npx hextaui add Button Card Input Avatar

# Case-insensitive component names
npx hextaui add button CARD input
```

#### Interactive component selection:

```bash
npx hextaui add
```

This will:

- 📋 Show an interactive list of available components
- ✨ Allow you to select multiple components (press `a` to toggle all)
- 📥 Download and install selected components
- 🔧 Handle dependency installation (manual/automatic options)

#### Dependency installation options:

```bash
# Install dependencies automatically
npx hextaui add Button --deps

# Skip dependency installation
npx hextaui add Button --no-deps

# Fast mode (manual dependency copying)
npx hextaui add Button --fast
```

### List available components

```bash
npx hextaui list
# or
npx hextaui ls
```

View all available components with descriptions and usage examples.

## 🎨 Available Components

HextaUI provides a comprehensive collection of modern, accessible React components:

### Core Components

- **Button** - Customizable button with variants and states
- **Card** - Flexible content containers with headers and footers
- **Input** - Styled form inputs with validation states
- **Label** - Accessible form labels with proper associations
- **Avatar** - User profile avatars with fallback support
- **Separator** - Visual separators and dividers

### Interactive Components

- **Tooltip** - Hover information tooltips with positioning
- **Breadcrumb** - Navigation breadcrumbs for page hierarchy
- **Kbd** - Keyboard key display for shortcuts
- **Accordion** - Collapsible content sections
- **Alert** - Messages and notifications with variants
- **Badge** - Status and label indicators

### Advanced Components

- **Calendar** - Date selection calendar with ranges
- **Checkbox** - Custom styled checkboxes with states
- **Chip** - Interactive tags and selections
- **ColorPicker** - Color selection component with presets
- **CommandMenu** - Command palette with search
- **DatePicker** - Date picker with calendar integration
- **Drawer** - Slide-out drawer with backdrop
- **DropdownMenu** - Contextual action menus
- **FileUpload** - Drag & drop file upload with preview
- **InputOTP** - One-time password input with auto-focus
- **Loader** - Loading indicators and spinners
- **MenuBar** - Application menu bar with nested items
- **Modal** - Dialog modals with backdrop and focus trap
- **Pagination** - Navigation pagination with customizable layout
- **Progress** - Progress indicators with animations
- **Radio** - Radio button groups with proper selection
- **ScrollArea** - Custom scrollable areas with styled scrollbars

## ⚙️ Requirements

- **Next.js** project (13+ recommended)
- **React** 18+
- **Tailwind CSS** v4
- **Node.js** 16+

## 📁 Package Manager Support

The CLI automatically detects and uses your preferred package manager:

- **pnpm** (if `pnpm-lock.yaml` exists) - Recommended
- **yarn** (if `yarn.lock` exists)
- **npm** (fallback)

## 🏗️ Project Structure

After initialization, your project will have:

```text
src/
├── components/
│   └── ui/
│       ├── button/
│       │   ├── index.tsx
│       │   └── variants.ts
│       ├── card/
│       │   └── index.tsx
│       └── [other-components]/
└── lib/
    └── utils.ts
```

## 🚀 Features

- **🎯 Component-specific installation** - Install only what you need
- **📋 Manual/Automatic dependencies** - Choose your installation workflow
- **⚡ Fast mode** - Skip auto-installation for faster setup
- **🔄 Cross-platform clipboard** - Copy dependency commands easily
- **📊 Progress tracking** - Real-time installation progress
- **🛡️ Error handling** - Graceful fallbacks and timeout protection
- **🎨 Beautiful UI** - Interactive prompts with emojis and colors

## 🔧 Command Reference

### Global Options

```bash
--deps          # Automatically install dependencies
--no-deps       # Skip dependency installation
--fast          # Manual dependency copying (fastest)
```

### Examples

```bash
# Initialize new project
npx hextaui init

# Add components with auto-install
npx hextaui add Button Card --deps

# Add components without dependencies
npx hextaui add Input Avatar --no-deps

# Fast mode with manual dependency handling
npx hextaui add Modal Drawer --fast

# Interactive component selection
npx hextaui add

# List all available components
npx hextaui list
```

## 🌐 Links

- **Homepage**: [https://hextaui.com](https://hextaui.com)
- **Documentation**: [https://docs.hextaui.com](https://docs.hextaui.com)
- **GitHub**: [https://github.com/preetsuthar17/cli](https://github.com/preetsuthar17/cli)
- **Issues**: [Report bugs and request features](https://github.com/preetsuthar17/cli/issues)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test the CLI
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by [Preet Suthar](https://github.com/preetsuthar17)**
