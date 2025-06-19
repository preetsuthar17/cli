# Changelog

All notable changes to HextaUI CLI will be documented in this file.

## [1.3.0] - 2024-06-19

### Added

- **Multi-framework support**: Added support for Vite and Astro projects alongside Next.js
- **Framework detection**: Automatic detection of project framework (Next.js, Vite, Astro)
- **Framework-specific configurations**: Components can now have different configurations per framework
- **Enhanced project setup**: Framework-specific setup instructions and configuration guidance
- **Flexible component paths**: Configurable component and utility paths based on framework
- **Enhanced CSS injection**: Framework-aware global CSS file detection and injection

### Changed

- **Improved initialization**: `hextaui init` now detects framework and provides tailored setup
- **Better error messages**: More descriptive error messages for unsupported projects
- **Enhanced dependency management**: Framework-specific dependency handling

### Technical

- Added `FrameworkConfig` interface for framework-specific settings
- Added `ProjectInfo` type for enhanced project detection
- Enhanced `Component` interface with `frameworkSpecific` configurations
- Updated all commands to be framework-aware
- Improved TypeScript types and error handling

## [1.2.3] - Previous

### Features

- Next.js project support
- Component installation and management
- Dependency handling
- CSS variable injection
- Interactive component selection

---

For the complete list of available components and detailed usage instructions, visit [HextaUI Documentation](https://docs.hextaui.com).
