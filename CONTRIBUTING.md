# Contributing

This repository is a legacy research reference. Keep changes small, reviewable, and behavior-preserving unless an issue explicitly requests a functional change.

## Requirements

- Node.js 20 or newer
- npm
- Firefox when manually testing the extension

## Setup

```bash
cd Node
npm ci
```

## Quality checks

Run the full local quality gate from `Node/`:

```bash
npm run check
```

Individual checks are also available:

```bash
npm run check:syntax
npm run lint
npm run format:check
npm run webext:lint
```

Use `npm run lint:fix` and `npm run format` for mechanical cleanup.

## Scope

The repository contains two coupled components:

- `Firefox/`: a Firefox WebExtension that observes TikTok API responses and sends normalized records to localhost.
- `Node/`: an Express + SQLite backend that receives and stores those records.

Avoid moving these components or changing their data contract merely for style. Historical behavior is useful as a regression reference for newer LaclauGPT collectors.
