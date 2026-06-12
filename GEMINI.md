<!-- GSD:project-start source:PROJECT.md -->

## Project

**AI Resume Analyzer and Skill Recommendation System**

A full-stack web application that allows users to upload their technical resumes, automatically analyzes them using Gemini 1.5 Flash, identifies skill gaps, offers career improvement recommendations, recommends next-step technologies and learning courses, and maintains a history of past scans. It features a premium dark theme with interactive glassmorphism elements.

**Core Value:** Empower developers to identify skill gaps and concrete steps to improve their resumes using generative AI, packaged in a visually stunning, responsive interface.

### Constraints

- **Tech Stack**: Must use Node.js, Mongoose, Express on backend, and React + Vite on frontend.
- **Styling**: Vanilla CSS for all styles, following a custom dark aesthetic. No TailwindCSS.
- **Model**: Must use Gemini 1.5 Flash for the AI analysis.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | ^20.0.0 | Server runtime | Standard runtime for backend applications with rich npm ecosystem. |
| Express.js | ^4.19.0 | Backend framework | Minimalist and fast web framework for building APIs. |
| MongoDB | ^7.0.0 | Database | NoSQL database perfect for storing flexible document schemas like resume JSON reports. |
| React (Vite) | ^18.3.0 | Frontend framework | Vite provides fast builds; React is industry standard for component-driven UI. |
| Gemini API | v1.5-flash | Large Language Model | Gemini 1.5 Flash is highly cost-effective, extremely fast, and supports structured JSON outputs. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @google/generative-ai | ^0.12.0 | Google Gen AI SDK | Use for connecting to Gemini API. |
| mongoose | ^8.4.0 | MongoDB ODM | Schema validation and simplified MongoDB interactions. |
| multer | ^1.4.5-lts.1 | File upload middleware | Parsing `multipart/form-data` uploads (resumes). |
| pdf-parse | ^1.1.1 | PDF text extraction | Parsing PDF file contents into plain text. |
| jsPDF | ^2.5.1 | Client-side PDF generation | Exporting the generated report to a downloadable PDF. |
| cors | ^2.8.5 | Cross-Origin Resource Sharing | Enabling React frontend to request Express backend safely. |
| dotenv | ^16.4.5 | Environment variable configuration | Loading config values from `.env` files. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| nodemon | Auto-restart backend server | Speeds up backend development. |
| concurrently | Run server and client together | Allows single command start for local development. |

## Installation

# Server directory setup & install

# Client directory setup & install

# Vite project initialization (React, JavaScript)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Gemini 1.5 Flash | OpenAI GPT-4o-mini | If OpenAI is preferred by client; however, Gemini 1.5 Flash offers a larger context window and excellent JSON output reliability. |
| pdf-parse | pdf2json | If coordinate-based text formatting is required; however, pdf-parse is faster and simpler for basic text dump extraction. |
| Plain CSS | Tailwind CSS | If rapid UI construction with utility classes is desired; vanilla CSS chosen here for custom cursor and detailed control over orb gradients. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| fs.readFileSync (for upload) | Blocking I/O on Express thread | Multer disk/memory storage engine |
| React Router | Overkill for a simple 3-state view app | React state-driven conditional views |

## Stack Patterns by Variant

- Multer memory storage is preferred so we don't clog the server disk.
- If we need local persistence of uploaded resumes, a clean-up cron job is required.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| mongoose@^8 | mongodb@^7 | Fully compatible standard configuration. |
| pdf-parse@^1.1.1 | Node 20 | Works perfectly, no deprecation issues. |

## Sources

- [Google Generative AI Documentation](https://ai.google.dev/) — Checked Gemini SDK syntax.
- [Mongoose Documentation](https://mongoosejs.com/) — Verified connection and Schema types.
- [pdf-parse npm page](https://www.npmjs.com/package/pdf-parse) — Confirmed text extraction API.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
