# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Added test coverage script: `npm run test:coverage`
- Expanded README with option-by-option serialization examples

## 1.0.0 - 2026-03-02

- Initial public release of `smart-payload`
- Added framework-agnostic core serializer (`json`, `form-data`, `search-params`)
- Added `auto` payload detection based on binary values
- Added configurable key notation and array formats
- Added options for date, boolean, bigint, null, and undefined serialization
- Added `fetch` adapter and `axios` adapter helpers
- Added circular reference protection and max depth guard
- Added tests for core behavior and adapters
- Added ESLint, Prettier, and GitHub Actions CI
