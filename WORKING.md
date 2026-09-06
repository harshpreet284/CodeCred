# CodeCred — Engineering Handoff

> This document is the authoritative source for the **current working state** of the CodeCred project.
> It is intended for a new coding agent or engineer with zero prior conversation context.
> Read this document in full before touching any code.

---

## RULES FOR THE NEXT AGENT

These rules are non-negotiable. Read them before reading anything else.

1. Treat actual committed code and `git log` as the source of truth for **current implementation**.
2. Treat `docs/` as the source of truth for **locked product and architectural decisions**.
3. Read this WORKING.md in full before continuing.
4. Do not redo completed tasks (Tasks 1–9 are done and committed).
5. Do not redesign locked architecture. If something feels wrong, stop and ask.
6. Do not introduce unnecessary dependencies. Discuss before adding any.
7. Do not expand task scope. One task at a time.
8. Inspect existing code before modifying it.
9. Test after every meaningful change.
10. Do not commit without explicit user approval.
11. Keep commits clean and focused on one task.
12. Do not call application-service tests "unit tests". Use "application-service tests" or "controller tests".
13. Do not claim behavior that has not been directly verified.
14. Do not hide bugs or weaken tests to make them pass.
15. Preserve the evidence-first philosophy throughout.
16. Absence of evidence does not equal evidence of absence. Never phrase "not detected" as "does not exist".
17. Do not expose secrets in code, logs, or responses.
18. Do not expose raw repository source file contents through the API.
19. Do not allow AI to invent repository facts.
20. If a requirement conflicts with existing architecture, stop and document the conflict before proceeding.
21. After three failed implementation attempts, stop and reassess rather than continuing to patch.
22. Prefer small, reviewable changes.
23. Never commit automatically.

---

## Project Identity

**Name:** CodeCred
**Tagline:** "Know your code. Defend your work."
**Repository:** https://github.com/harshpreet284/CodeCred
**Branch:** `main`

**Problem:**
Developers often build GitHub projects for their resumes without fully understanding or being able to explain the technical decisions behind the implementation. During technical interviews, interviewers ask about architecture, APIs, databases, security, performance, testing, and implementation choices — not just features.

**Core product description:**
CodeCred helps developers analyze their GitHub projects and prepare to defend their actual implementation in technical interviews.

**Core product thesis:**
"Can I actually understand and defend the technical work represented by this repository?"

**Primary users:**
Students and junior/early-career developers preparing for technical interviews.

---

## Current Git State

Verified on 2026-09-06. Working tree is **clean**.

```
Branch:  main
Remote:  origin/main (up to date, pushed)

Recent commits (newest first):
0936d8a feat: add technical evidence report         <- Task 9 (current HEAD)
979368c feat: add project analysis workflow         <- Task 8
6727995 feat: add project analysis persistence      <- Task 7
189e289 feat: add deterministic repository analysis <- Task 6
bf0d0ed feat: add github repository retrieval       <- Task 5
01b7e89 feat: add github repository integration     <- Task 4
ca266e3 feat: establish express api foundation      <- Task 3
236f20c feat: establish CodeCred frontend visual system <- Task 2
5ed7df4 feat: establish CodeCred full-stack foundation  <- Task 1
628bc58 Initial CodeCred  baseline
```

Working tree: Clean — no uncommitted changes, no untracked files.
`git diff`: Empty — nothing uncommitted.

---

## Current Test State (verified 2026-09-06)

```
Backend test runner: Node.js --test (built-in)
Command: cd server && npm run test

Results:
  tests    46
  pass     46
  fail      0
  duration ~11s
```

Test file breakdown:

| File | Tests | Scope |
|---|---|---|
| `githubParser.test.js` | 14 | GitHub URL parsing — input validation |
| `fileSelectionService.test.js` | 4 | File selection algorithm |
| `githubContentService.test.js` | 2 | GitHub content retrieval (fetch mock) |
| `analysisOrchestrator.test.js` | 2 | Deterministic analysis orchestration |
| `projectAnalysisService.test.js` | 9 | Task 7 persistence round-trip + schema validation |
| `projectController.test.js` | 5 | Task 8/9 controller behavior |
| `projectWorkflowService.test.js` | 9 | Task 8/9 end-to-end workflow service |

Frontend build:

```
Command: cd client && npm run build
Result:  67 modules transformed, exit code 0
Output:  dist/assets/index-CAyw10IW.js (201.96 kB gzip: 65.81 kB)
```

---

## Repository Structure

```
CodeCred/
├── AGENTS.md                       # AI agent instructions (authoritative)
├── WORKING.md                      # This file
├── README.md
├── .gitignore
├── docs/
│   ├── PRODUCT_SPEC.md             # Locked product specification
│   ├── ARCHITECTURE.md             # Locked architecture decisions
│   ├── IMPLEMENTATION_PLAN.md      # Task sequence (Tasks 1-22)
│   └── AI_GUIDELINES.md            # Locked AI rules
├── client/                         # React + Vite + Tailwind frontend
│   ├── package.json
│   ├── vite.config.js              # Includes /api proxy to :5000
│   ├── tailwind.config.js          # Inter + JetBrains Mono, codecred.accent
│   ├── .eslintrc.cjs               # ESLint config (see Technical Debt section)
│   └── src/
│       ├── App.jsx                 # Routing: CodeCredLayout + Shell + EvidenceReport
│       ├── components/
│       │   ├── CodeCred/
│       │   │   ├── Shell.jsx           # Homepage: URL submission form
│       │   │   ├── CodeCredLayout.jsx  # Layout shell: header + Outlet
│       │   │   └── EvidenceReport.jsx  # Task 9: Evidence display
│       │   ├── ui/
│       │   │   ├── Badge.jsx
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   └── Panel.jsx
│       │   └── layout/ + repos/ + users/  # Legacy GitHub app components
│       ├── services/
│       │   └── projectService.js       # analyzeProject() + getProjectAnalysis()
│       ├── pages/                      # Legacy app pages
│       └── Context/                    # Legacy GitHub/Alert context providers
└── server/                         # Node.js + Express backend
    ├── package.json                # ESM, Node --test, dotenv + express + mongoose
    ├── .env.example                # PORT + MONGODB_URI placeholders
    ├── dev-server.js               # Dev helper: in-memory MongoDB via MongoMemoryServer
    ├── seed-analysis.js            # Dev helper: CLI seed script (requires MONGODB_URI)
    ├── tests/
    │   ├── githubParser.test.js
    │   ├── fileSelectionService.test.js
    │   ├── githubContentService.test.js
    │   ├── analysisOrchestrator.test.js
    │   ├── projectAnalysisService.test.js
    │   ├── projectController.test.js
    │   └── projectWorkflowService.test.js
    └── src/
        ├── server.js               # Entry: connectDB() then app.listen()
        ├── app.js                  # Express app: routes + middleware
        ├── config/
        │   ├── env.js              # config object; throws if MONGODB_URI missing
        │   └── db.js               # connectDB(): mongoose.connect() + process.exit(1) on fail
        ├── controllers/
        │   ├── healthController.js
        │   ├── githubController.js
        │   └── projectController.js  # analyzeProject + getProjectAnalysis
        ├── routes/
        │   ├── health.js           # GET /api/health
        │   ├── github.js           # POST /api/github/repository
        │   └── projects.js         # POST /api/projects/analyze, GET /api/projects/:analysisId
        ├── middleware/
        │   ├── notFound.js
        │   └── errorHandler.js
        ├── models/
        │   └── ProjectAnalysis.js  # Mongoose model (5 sub-schemas — see below)
        ├── services/
        │   ├── githubService.js           # getRepository()
        │   ├── githubContentService.js    # retrieveAndNormalizeRepositoryInput()
        │   ├── fileSelectionService.js    # selectRelevantFiles()
        │   ├── projectAnalysisService.js  # saveAnalysis() + getAnalysisById()
        │   ├── projectWorkflowService.js  # analyzeRepository() + getAnalysis() + createSafeDTO()
        │   └── analysis/
        │       ├── analysisOrchestrator.js  # runDeterministicAnalysis()
        │       ├── analyzers/
        │       │   ├── languageAnalyzer.js
        │       │   ├── structureAnalyzer.js
        │       │   ├── dependencyAnalyzer.js
        │       │   ├── frameworkAnalyzer.js
        │       │   ├── libraryAnalyzer.js
        │       │   ├── apiAnalyzer.js
        │       │   ├── databaseAnalyzer.js
        │       │   ├── securityAnalyzer.js
        │       │   ├── testingAnalyzer.js
        │       │   ├── documentationAnalyzer.js
        │       │   └── deploymentAnalyzer.js
        │       └── utils/
        │           └── evidenceBuilder.js  # createEvidence(type, path, field, detail)
        └── utils/
            ├── AppError.js         # AppError(message, statusCode, code)
            ├── apiResponse.js      # sendSuccess() + sendError()
            └── githubParser.js     # parseGitHubUrl() — strict SSRF-reducing validation
```

---

## Locked Technology Stack

Verified against actual `package.json` files. Do not add any technology without explicit discussion.

**Frontend (`client/`):**
- React 18.2.0
- React Router DOM 6.17.0
- Vite 7.3.1 (`@vitejs/plugin-react`)
- Tailwind CSS 3.3.3
- DaisyUI 3.9.3 (in devDependencies, used minimally in legacy sections)
- react-icons 4.11.0
- react-loader-spinner 5.4.5

**Backend (`server/`):**
- Node.js with ESM (`"type": "module"`)
- Express 5.2.1
- Mongoose 9.9.5
- dotenv 17.4.2
- mongodb-memory-server 11.2.0 (devDependency — tests and dev-server.js only)

**Testing:** Node.js built-in `--test` runner. No Jest, Mocha, or external test framework is installed.

**AI (not yet implemented):** Gemini API — server-side only, starting at Task 11.

---

## Locked Architecture

### High-level data flow

```
React (client :5173 dev / static prod)
        |
        | fetch('/api/...')  [Vite proxy to :5000 in dev]
        v
Express API (:5000)
        |
   +----+----------------+
   v                     v
GitHub REST API     MongoDB (Mongoose)
```

### Backend layer rules

```
routes -> controllers -> services -> (GitHub API / MongoDB / Gemini)
```

- Routes delegate to controllers only.
- Controllers coordinate services, call `sendSuccess()` or `next(error)`.
- Services contain all business logic and integrations.
- No asyncHandler wrapper — use manual try/catch(next) in controllers.
- `server.js` is 14 lines. `app.js` is 25 lines. Keep them small.

### Current API endpoints

| Method | Path | Controller | Purpose |
|---|---|---|---|
| GET | `/api/health` | healthController.js | Liveness check |
| POST | `/api/github/repository` | githubController.js | Direct GitHub repo fetch (internal/legacy) |
| POST | `/api/projects/analyze` | projectController.js | Full analysis workflow, returns 201 + DTO |
| GET | `/api/projects/:analysisId` | projectController.js | Read persisted analysis, returns 200 + DTO |

### Analysis and persistence data flow

```
POST /api/projects/analyze
        |
        | repositoryUrl (string from req.body)
        v
parseGitHubUrl()
  Validates: HTTPS only, github.com only, exactly owner/repo path, no query/fragment/port
        |
        v
getRepository()
  Calls: GET https://api.github.com/repos/{owner}/{repo}
  Handles: 404 -> NOT_FOUND, 429 -> RATE_LIMIT_EXCEEDED
        |
        v
retrieveAndNormalizeRepositoryInput()
  Fetches tree + up to 50 selected file contents
  Raw files exist in memory here only
        |
        v
runDeterministicAnalysis()
  Converts raw retrieval into structured evidence
  Raw file contents are consumed and dropped here
        |
        v
saveAnalysis()
  Persists ProjectAnalysis document to MongoDB
  No raw source content is stored
        |
        v
createSafeDTO()
  Explicit DTO boundary: no __v, no raw files, no raw ObjectId
        |
        v
sendSuccess(res, dto, 'Analysis completed successfully', 201)
```

```
GET /api/projects/:analysisId
        |
        v
getAnalysisById()
  MongoDB findById
  Throws ANALYSIS_NOT_FOUND (404) or INVALID_ID_FORMAT (400)
        |
        v
createSafeDTO()
  Same DTO boundary as write path
        |
        v
sendSuccess(res, dto, 'Analysis retrieved successfully', 200)
```

### Safe DTO shape

The `createSafeDTO()` function in `projectWorkflowService.js` produces:

```json
{
  "success": true,
  "data": {
    "analysisId": "<MongoDB _id as string>",
    "repository": {
      "owner": "...",
      "name": "...",
      "fullName": "owner/repo",
      "defaultBranch": "..."
    },
    "analysis": {
      "summary": { "languages": [], "frameworks": [], "libraries": [] },
      "structure": { "directories": [], "importantFiles": [], "entryPoints": [] },
      "dependencies": { "manifests": [], "packages": [] },
      "api": { "indicators": [] },
      "database": { "indicators": [] },
      "authentication": { "indicators": [] },
      "testing": { "indicators": [] },
      "documentation": { "indicators": [] },
      "deployment": { "indicators": [] },
      "analysisMetadata": { "analysisVersion": "1.0.0", "limitations": [] }
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

The DTO intentionally excludes: `__v`, `_id` (raw ObjectId), raw file contents, raw GitHub API responses.

---

## Critical Data Boundary

This boundary must never be violated.

```
Task 5: retrieveAndNormalizeRepositoryInput()
         (raw file content exists temporarily in memory only)
        |
        v
Task 6: runDeterministicAnalysis()
         (raw content consumed, dropped, deterministic evidence produced)
        |
        v
Task 7: saveAnalysis() -> MongoDB
         (only evidence is stored, never raw source content)
        |
        v
Task 9: getAnalysisById() -> createSafeDTO()
         (DTO exposes evidence, never raw content)
        |
        v
Frontend EvidenceReport
```

The `ProjectAnalysis` Mongoose schema has no `files` or `content` fields. Mongoose silently strips unknown fields. A test in `projectAnalysisService.test.js` explicitly verifies this.

---

## Task 6: Analysis Contract

### Evidence structures (verified from actual analyzer code)

All analyzers call `createEvidence(type, path, field, detail)` from `analysis/utils/evidenceBuilder.js`.

**EvidenceLeaf** — the atomic evidence primitive:

```javascript
{
  type: String,           // e.g. 'repository_metadata', 'source_code_pattern'
  source: {
    path: String | null,  // file path where evidence was found
    field: String | null  // field within the file, or line reference
  },
  detail: String          // human-readable description of the finding
}
```

Five wrapper patterns appear in the analysis output:

**NamedItem** — language, framework, or library with a list of evidence:

```javascript
{ name: String, evidence: [EvidenceLeaf] }
// Produced by: languageAnalyzer, frameworkAnalyzer, libraryAnalyzer
// Stored in: summary.languages, summary.frameworks, summary.libraries
```

**PathItem** — a file or directory identified by path with one evidence leaf:

```javascript
{ path: String, evidence: EvidenceLeaf }
// Produced by: structureAnalyzer (directories, entryPoints), dependencyAnalyzer (manifests)
// Stored in: structure.directories, structure.entryPoints, structure.importantFiles,
//            dependencies.manifests
```

**PackageItem** — a declared dependency:

```javascript
{ name: String, version: String, evidence: EvidenceLeaf }
// Produced by: dependencyAnalyzer (packages)
// Stored in: dependencies.packages
```

**Indicator** — a typed finding with optional label and one evidence leaf:

```javascript
{ type: String, name: String | null, evidence: EvidenceLeaf }
// Produced by: apiAnalyzer, databaseAnalyzer, securityAnalyzer, testingAnalyzer,
//              documentationAnalyzer, deploymentAnalyzer
// Stored in: api.indicators, database.indicators, authentication.indicators,
//            testing.indicators, documentation.indicators, deployment.indicators
```

### Retrieval limits (from `server/src/config/env.js`)

```
maxFilesToFetch:      50
maxFileSize:          500 KB per file
maxTotalContentSize:  5 MB total
```

When limits are hit, the orchestrator records human-readable strings in `analysisMetadata.limitations[]`. The analysis still proceeds and persists — limitations are informational, not fatal.

### Absence-of-evidence principle

The analyzers detect signals from what was retrieved. A negative finding means no signal was found in the retrieved material — it does not mean the capability is absent from the full repository. The UI and any future AI output must use language like "No evidence detected in retrieved material" rather than "No X exists".

---

## Task 7: Persistence Model

### Schema reconciliation history

**Important:** The original Task 7 schema (`EvidenceItemSchema`) was a flat `{type, name, version, source, detail}` structure applied uniformly. End-to-end browser verification during Task 9 revealed this schema was **incompatible** with the actual nested output the Task 6 analyzers produce. Saving any real analysis caused a Mongoose `ValidationError`.

The schema was corrected during Task 9 verification to use five explicit sub-schemas. No `Mixed` type workaround was used. This correction is in commit `0936d8a`.

### Current schema (from `server/src/models/ProjectAnalysis.js`)

```
EvidenceLeafSchema    required: type, detail
                      fields:   source.path, source.field (both default null)
                      _id: false

NamedItemSchema       required: name
                      fields:   evidence: [EvidenceLeafSchema]
                      _id: false

PathItemSchema        required: path, evidence
                      fields:   evidence: EvidenceLeafSchema
                      _id: false

PackageItemSchema     required: name, evidence
                      fields:   version (default null), evidence: EvidenceLeafSchema
                      _id: false

IndicatorSchema       required: type, evidence
                      fields:   name (default null), evidence: EvidenceLeafSchema
                      _id: false
```

Full ProjectAnalysisSchema:

```
repository: {
  owner*:         String,
  name*:          String,
  fullName*:      String,
  defaultBranch*: String
}
summary: {
  languages:  [NamedItemSchema]
  frameworks: [NamedItemSchema]
  libraries:  [NamedItemSchema]
}
structure: {
  directories:   [PathItemSchema]
  importantFiles: [PathItemSchema]
  entryPoints:   [PathItemSchema]
}
dependencies: {
  manifests: [PathItemSchema]
  packages:  [PackageItemSchema]
}
api:            { indicators: [IndicatorSchema] }
database:       { indicators: [IndicatorSchema] }
authentication: { indicators: [IndicatorSchema] }
testing:        { indicators: [IndicatorSchema] }
documentation:  { indicators: [IndicatorSchema] }
deployment:     { indicators: [IndicatorSchema] }
analysisMetadata: {
  analysisVersion*: String,
  limitations:      [String]
}

Options: { timestamps: true }    <- adds createdAt + updatedAt automatically

* = required field
```

### Persistence behavior

- `repository.fullName` is NOT unique — multiple snapshots of the same repository are allowed.
- Each `saveAnalysis()` call creates a new document with a new MongoDB ObjectId.
- No upsert behavior. No automatic re-analysis on read.
- `getAnalysisById()` retrieves a specific snapshot by its `_id`.
- `__v` (Mongoose version key) is present in the raw document but stripped by `createSafeDTO()`.
- Unknown fields (e.g. `files`, `content`) are silently dropped by Mongoose.

---

## Task 9: Technical Evidence Report — Current State

### What was implemented (commit `0936d8a`)

Backend:
- `GET /api/projects/:analysisId` route in `server/src/routes/projects.js`
- `getProjectAnalysis` controller in `server/src/controllers/projectController.js`
- `getAnalysis(analysisId)` in `server/src/services/projectWorkflowService.js`
- Shared `createSafeDTO()` used by both analyze and read paths

Frontend:
- `client/src/components/CodeCred/EvidenceReport.jsx` — full evidence report component
- `client/src/components/CodeCred/CodeCredLayout.jsx` — shared layout (sticky header + Outlet)
- `client/src/services/projectService.js` — `analyzeProject()` + `getProjectAnalysis()`
- `client/src/App.jsx` — CodeCredLayout wraps both `/` (Shell) and `/projects/:analysisId` (EvidenceReport)
- `client/vite.config.js` — `/api` proxy to `http://localhost:5000`

Dev tools (committed, not for production):
- `server/dev-server.js` — starts in-memory MongoDB and Express. Supports `--seed` flag.
- `server/seed-analysis.js` — standalone seed script (requires MONGODB_URI in env).

### Frontend routing

```
/ (BrowserRouter)
├── / -> CodeCredLayout (sticky header + main content area)
│   ├── index -> Shell.jsx           (repository URL submission form)
│   └── /projects/:analysisId -> EvidenceReport.jsx
└── /legacy/* -> LegacyApp (old GitHub profile browser — preserved, not removed)
```

`EvidenceReport` uses `useParams()` to get `analysisId`, then calls `getProjectAnalysis(analysisId)`. It never calls GitHub, re-runs analysis, or invokes Gemini. It is a pure read of the persisted document.

### EvidenceReport sections

| Section | Data source in DTO |
|---|---|
| Repository header + language badges | `repository`, `analysis.summary.languages[].name` |
| Retrieval Limitations block (amber) | `analysis.analysisMetadata.limitations[]` |
| Ecosystem — Frameworks and Libraries | `analysis.summary.frameworks[].name`, `analysis.summary.libraries[].name` |
| Ecosystem — Dependency Manifests | `analysis.dependencies.manifests[].path` |
| Structure | `analysis.structure.entryPoints[].path`, `analysis.structure.directories[].path` |
| Systems and Data | `analysis.database.indicators`, `analysis.api.indicators` |
| Quality and Security | `analysis.authentication.indicators`, `analysis.testing.indicators` |
| Deployment and Docs | `analysis.deployment.indicators`, `analysis.documentation.indicators` |
| Analysis ID footer | `data.analysisId`, `analysis.analysisMetadata.analysisVersion` |

### UI states

- **Loading:** Spinner shown while `getProjectAnalysis()` is in flight.
- **Not Found / Error:** "Report Not Found" card with "Submit a new repository" link to `/`.
- **Success:** Full evidence report rendered from DTO fields.

### Bugs discovered and fixed during Task 9

**Bug 1 — Missing Vite dev proxy**

The frontend called `/api/projects/analyze` which reached Vite's dev server (port 5173), not Express (port 5000). Fixed by adding proxy configuration to `client/vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```

**Bug 2 — Task 7 schema / Task 6 analyzer shape mismatch**

The original `EvidenceItemSchema` required `type` and `detail` at the top level of every array element. The Task 6 analyzers produce wrapper objects (`{name, evidence: [...]}`, `{path, evidence: {...}}`, `{type, name?, evidence: {...}}`) with an `evidence` sub-object. Saving any real analysis caused a Mongoose `ValidationError`. Fixed by replacing the flat schema with five precise sub-schemas. Tests in `projectAnalysisService.test.js` verify that real shapes pass and that missing required fields are rejected.

---

## Locked Visual System

**Feel:** GitHub Developer Tool x Modern IDE x Technical Assessment Platform

Foundation:    zinc-950 background, zinc-900 panels, zinc-800 borders
Accent:        emerald-500 (#10b981) — emerald-600 (#059669) on hover
Typography:    Inter (sans-serif), JetBrains Mono (monospace)
Radius:        moderate — rounded-md, rounded-lg — not pill-shaped
Spacing:       deliberate, information-dense — not airy or card-heavy
Animation:     minimal — only purposeful transitions

Tailwind tokens in `client/tailwind.config.js`:

```javascript
fontFamily: { sans: ['Inter', ...], mono: ['JetBrains Mono', ...] }
colors: { codecred: { accent: '#10b981', accentHover: '#059669' } }
```

Explicitly prohibited in CodeCred UI:
- Purple/blue AI gradient palettes
- Glassmorphism (backdrop-blur on content cards)
- Glowing background effects
- Giant gradient headings
- Excessive rounded cards (rounded-3xl, pill shapes on panels)
- Excessive animation (parallax, floating, etc.)
- Generic AI SaaS appearance
- Dashboard widget clutter

Do not invent a second visual system. All new pages must use `CodeCredLayout` and extend the existing zinc/emerald system.

---

## Environment Configuration

### Server environment variables

Required (from `server/src/config/env.js`):

```
PORT         = 5000
MONGODB_URI  = mongodb://localhost:27017/codecred
```

Optional (currently used with null fallback):

```
GITHUB_TOKEN = <GitHub PAT with read:repo scope>
```

Future (not yet used — required starting at Task 11):

```
GEMINI_API_KEY = <Gemini API key — server-side only>
```

Template file: `server/.env.example`

Note: The committed `.env.example` has UTF-16 null byte encoding (BOM artifact). The variable names are correct but the file may display strangely in some editors. See Technical Debt section.

### Secret handling rules

- Secrets live in `server/.env` (local only, gitignored).
- `server/.env` must never be committed. Verify with: `git ls-files server/.env` — must return nothing.
- `server/.env.example` is committed as the template.
- `GITHUB_TOKEN` and `GEMINI_API_KEY` are server-side only.
- The React frontend must never receive any secret API key.
- Never hardcode credentials in source.

### Development without a MongoDB daemon

```bash
cd server
node dev-server.js           # starts Express on :5000 with in-memory Mongo
node dev-server.js --seed    # same, plus inserts a demo analysis document
```

The seeded document's `_id` is printed to stdout. Navigate to `/projects/<id>` in the browser to verify the Evidence Report without a live GitHub API call.

---

## Completed Task History

### Task 1 — Full-Stack Foundation
**Commit:** `5ed7df4`

Established repository structure, project documentation, Vite+React frontend scaffold, Express backend scaffold, AGENTS.md, and README.md. No product logic — pure structural setup.

Key files created:
- `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/AI_GUIDELINES.md`
- `AGENTS.md`
- Basic `client/` Vite+React scaffold
- Basic `server/` Express scaffold

---

### Task 2 — CodeCred Visual System
**Commit:** `236f20c`

Established the CodeCred design system: zinc dark palette, emerald accent, Inter + JetBrains Mono fonts, primitive UI components.

Key files:
- `client/tailwind.config.js` — design tokens
- `client/src/components/ui/Button.jsx`, `Badge.jsx`, `Input.jsx`, `Panel.jsx`
- `client/src/components/CodeCred/Shell.jsx` — homepage submission form

---

### Task 3 — Express API Foundation
**Commit:** `ca266e3`

Built Express backend foundation: structured error handling, API response utilities, config management, health endpoint.

Key files:
- `server/src/app.js` — Express app factory
- `server/src/server.js` — entry point
- `server/src/config/env.js` — config object, fails fast if MONGODB_URI missing
- `server/src/utils/AppError.js` — `AppError(message, statusCode, code)`, `isOperational: true`
- `server/src/utils/apiResponse.js` — `sendSuccess()` + `sendError()`
- `server/src/middleware/errorHandler.js`, `notFound.js`
- `GET /api/health`

---

### Task 4 — GitHub Repository Integration
**Commit:** `01b7e89`

Implemented GitHub URL validation (SSRF-reducing) and GitHub metadata retrieval service.

Key decisions:
- `parseGitHubUrl()` enforces HTTPS, `github.com` hostname only, exactly two path segments (owner/repo), no query strings, no fragments, no non-standard ports. Rejects path traversal via regex character class.
- `getRepository()` calls `GET https://api.github.com/repos/{owner}/{repo}`. Uses GITHUB_TOKEN if available. Distinguishes 404 (NOT_FOUND), 429 (RATE_LIMIT_EXCEEDED), and other errors into typed AppErrors.

Tests: 14 URL parsing tests in `githubParser.test.js`.

---

### Task 5 — GitHub Repository Retrieval
**Commit:** `bf0d0ed`

Implemented repository tree retrieval, file selection, and content fetching.

Key decisions:
- `retrieveAndNormalizeRepositoryInput()` fetches the tree from `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1`, selects up to 50 relevant files, then fetches each file's content via `/repos/{owner}/{repo}/contents/{path}`.
- File selection excludes binaries, `node_modules/`, `.git/`, `dist/`, `build/`; prefers shallower source files; respects `maxFilesToFetch`, `maxFileSize`, `maxTotalContentSize` limits.
- Content is base64-decoded. Files exceeding individual size limits get `contentStatus: 'skipped_size_limit'`.
- Raw retrieval output is transient and never persisted.

Tests: `fileSelectionService.test.js` (4), `githubContentService.test.js` (2).

---

### Task 6 — Deterministic Technical Analysis
**Commit:** `189e289`

Implemented the deterministic analysis engine: 11 analyzers + orchestrator.

Analyzers and their output structures:

| Analyzer | Output field | Shape |
|---|---|---|
| languageAnalyzer | summary.languages | NamedItem[] |
| frameworkAnalyzer | summary.frameworks | NamedItem[] |
| libraryAnalyzer | summary.libraries | NamedItem[] |
| structureAnalyzer | structure.{directories,entryPoints} | PathItem[] |
| dependencyAnalyzer | dependencies.{manifests,packages} | PathItem[], PackageItem[] |
| apiAnalyzer | api.indicators | Indicator[] |
| databaseAnalyzer | database.indicators | Indicator[] |
| securityAnalyzer | authentication.indicators | Indicator[] |
| testingAnalyzer | testing.indicators | Indicator[] |
| documentationAnalyzer | documentation.indicators | Indicator[] |
| deploymentAnalyzer | deployment.indicators | Indicator[] |

`analysisVersion` is hardcoded to `'1.0.0'` in `analysisOrchestrator.js`.

Tests: `analysisOrchestrator.test.js` (2).

---

### Task 7 — MongoDB Persistence
**Commit:** `6727995` (original) + schema correction in `0936d8a`

Implemented MongoDB connection and the `ProjectAnalysis` model.

Key decisions:
- `connectDB()` calls `mongoose.connect()` and `process.exit(1)` on failure.
- `saveAnalysis()` creates a new document on every call (no upsert). Each analysis is an independent snapshot.
- `getAnalysisById()` uses `findById`. Returns typed AppErrors on not-found or invalid ID.
- Schema correction: the original flat EvidenceItemSchema was replaced with five structured sub-schemas during Task 9 verification.

Tests: `projectAnalysisService.test.js` (9) — includes round-trip, three schema rejection cases, raw-source-not-persisted verification.

---

### Task 8 — End-to-End Analysis Workflow
**Commit:** `979368c`

Wired all services into the `POST /api/projects/analyze` workflow. Added projectWorkflowService and minimal frontend submission flow.

Key decisions:
- `analyzeRepository(url)` composes Tasks 4 through 7 in sequence, then returns a safe DTO.
- `createSafeDTO()` is a deliberate boundary that explicitly whitelists response fields.
- Frontend `Shell.jsx` posts to `/api/projects/analyze` and navigates to `/projects/:analysisId` on success.
- No asyncHandler wrapper — consistent manual try/catch(next) in all controllers.

Tests: `projectController.test.js` (5), `projectWorkflowService.test.js` (9).

---

### Task 9 — Technical Evidence Report
**Commit:** `0936d8a`

Built the read path and frontend Evidence Report. Fixed two bugs discovered during end-to-end verification.

Key decisions:
- `GET /api/projects/:analysisId` uses the same `createSafeDTO()` as the write path — single source of truth for the DTO shape.
- `EvidenceReport.jsx` reads from `data.analysis.*` — not from `data.*` directly.
- `CodeCredLayout.jsx` wraps both routes using React Router Outlet — no duplicate navigation or layout.
- The Evidence Report is a read-only presentation layer.
- `dev-server.js` is a development convenience and must not be used in production.

---

## Known Technical Debt

Verified from actual code inspection. No speculative items.

### 1. ESLint rules disabled in client

`client/.eslintrc.cjs` has these rules set to 'off':

```javascript
'react/prop-types': 'off',
'no-unused-vars': 'off',
'react/no-unescaped-entities': 'off',
'no-undef': 'off',
'react-hooks/exhaustive-deps': 'off',
```

These were disabled to allow the legacy GitHub profile browser and CodeCred components to coexist without lint failures during incremental development. The `react-hooks/exhaustive-deps` rule would flag `useEffect` dependencies in CodeCred components. These rules should be re-enabled and proper fixes applied during a refactoring checkpoint.

`npm run lint` passes with `--max-warnings 0` because these rules are 'off', not warnings.

### 2. Legacy app coexists with CodeCred

`client/src/App.jsx` contains a `LegacyApp` function (the original GitHub profile browser) mounted at `/legacy/*`. It uses different context providers (GithubProvider, AlertProvider), its own Navbar/Footer, and its own page components. This is intentionally preserved but separate from the CodeCred product. It should be removed or clearly isolated during a refactoring checkpoint.

### 3. `server/.env.example` encoding

The committed `server/.env.example` file contains UTF-16 null bytes (BOM artifact from the editor used to create it). The variable names (`PORT`, `MONGODB_URI`) are correct but the file may display strangely in some editors. Should be recreated as plain UTF-8 but is not blocking.

### 4. GITHUB_TOKEN is optional

`server/src/config/env.js` sets `githubToken: process.env.GITHUB_TOKEN || null`. Unauthenticated GitHub API requests are limited to 60 requests/hour per IP. A GITHUB_TOKEN (PAT with read-only repo scope) must be configured before any production use.

### 5. analysisVersion is hardcoded

`analysisOrchestrator.js` hardcodes `analysisVersion: '1.0.0'`. This should eventually be read from package.json or a config constant to prevent stale version strings after analyzer changes.

### 6. No rate limiting on expensive endpoints

`POST /api/projects/analyze` triggers multiple GitHub API calls per submission. There is no rate limiting, request queuing, or abuse protection. This must be addressed before any public deployment.

### 7. client/package.json name is "github-api"

The `client/package.json` has `"name": "github-api"` — a leftover from the initial scaffold. Cosmetically incorrect but does not affect functionality.

---

## Locked V1 Product Scope

### The complete intended workflow (steps 1-10)

1. User submits a public GitHub repository URL.
2. Backend retrieves relevant repository information.
3. Backend performs deterministic technical analysis.
4. CodeCred presents technical evidence.        <- Tasks 8 and 9 implement up to here
5. AI generates interview questions grounded in repository evidence.
6. User answers questions.
7. AI evaluates the answer against the question and repository evidence.
8. CodeCred identifies weak understanding and unsupported claims.
9. CodeCred provides improvement and study recommendations.
10. Analysis/interview session is persisted.

Steps 5-10 are NOT yet implemented. Tasks 10-15 cover the interview session UI, AI integration, answer evaluation, and session persistence.

### V1 explicit non-goals

Do not build any of the following:
- Resume parsing or job-description matching
- Full GitHub profile analysis or multi-repository scoring
- Generic AI chatbot
- AI code generation or automated code fixing
- Social or community features
- Microservices or complex infrastructure
- Fake developer-quality scores
- Unnecessary dashboards or metrics

Core filter: If a feature does not directly help the developer answer "Can I understand and defend the technical work in this repository?", do not build it.

---

## Locked AI Rules (for future Tasks 11-14)

The Gemini AI integration has not been implemented yet. When it is, these rules apply without exception.

**Deterministic code is the source of truth for objective facts:**
- languages, frameworks, libraries
- file structure, entry points
- dependencies
- API usage patterns
- database, authentication, testing, documentation, deployment indicators

**AI is responsible for interpretation only:**
- Generating project-specific interview questions grounded in evidence
- Semantically evaluating user answers against evidence
- Identifying knowledge gaps and weak areas
- Producing study recommendations

**AI must not:**
- Invent repository facts not supported by the deterministic evidence
- Label an answer wrong if evidence is insufficient to determine correctness
- Present an unverified claim as a fact

**Structured output:** Prefer JSON/schema-constrained Gemini responses. Validate all model output before storing or displaying it. Never trust a response is valid merely because the API returned HTTP 200.

**Prompt safety:** Repository file content (READMEs, comments, code strings) is untrusted data. It must not override system/developer instructions in AI prompts.

**Gemini API key:** Server-side only, in `server/.env`. Never in the frontend, never in committed source.

**AI failure handling:** If Gemini is unavailable or returns invalid output, return a clear error and preserve the existing analysis. Do not fabricate a response.

---

## Next Step

The project is ready for **Task 10: Interview Session Interface**.

### Before starting Task 10, the new agent MUST:

1. Read `WORKING.md` (this file) in full.
2. Read `AGENTS.md` in full.
3. Read `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/AI_GUIDELINES.md`.
4. Run `git status` and `git log --oneline -5` to confirm Task 9 is committed and the working tree is clean.
5. Run `cd server && npm run test` and confirm 46/46 pass.
6. Run `cd client && npm run build` and confirm exit code 0.
7. Inspect the existing code before modifying anything.
8. Propose a Task 10 implementation plan and wait for explicit user approval before writing any code.

### What Task 10 is expected to cover

Per `docs/IMPLEMENTATION_PLAN.md` Phase 3 Task 10: "Build interview session interface."

This will involve:
- A UI where the user can begin an interview for a given analysisId
- Navigation from the Evidence Report to the interview interface
- Displaying questions (initially placeholder — Gemini is not integrated until Task 12)
- Potentially an InterviewSession data model

Task 10 does NOT include AI. AI question generation is Task 12. Task 10 is the interface scaffold.

The exact scope of Task 10 must be agreed with the user through a plan before implementation begins. Do not assume. Do not expand scope.

---

## Discrepancies Found During Handoff Preparation

| Item | Documentation says | Code says | Authoritative source |
|---|---|---|---|
| Task 7 schema | Not described post-correction | 5 explicit sub-schemas in ProjectAnalysis.js | Code — docs predate the Task 9 correction |
| .env.example encoding | Should be plain UTF-8 | File has UTF-16 null bytes (BOM artifact) | Code — known defect |
| GitHub token | Listed as optional in ARCHITECTURE.md | `config.githubToken = null` if missing | Code — consistent, token is optional but recommended for production |
| Analysis version | Not specified in docs | Hardcoded as '1.0.0' in orchestrator | Code — docs are intentionally silent on this detail |

No substantive conflicts between AGENTS.md / docs/ architectural decisions and the actual implementation were found. The architecture, layer separation, API shape, data boundary, and visual system are all consistent between documentation and code.
