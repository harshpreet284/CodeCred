# CodeCred — Architecture

## High-level architecture

```text
React Frontend
      |
      | HTTPS / JSON
      v
Node.js + Express API
      |
      +-------------------+
      |                   |
      v                   v
GitHub Service       MongoDB/Mongoose
      |
      v
GitHub REST API

Express API
      |
      v
AI Service
      |
      v
Gemini API
```

The backend is the trusted boundary between the browser and external services.

## Responsibilities

### Frontend
Responsible for:
- repository submission
- analysis presentation
- interview interaction
- answer submission
- evaluation presentation
- session/history navigation

The frontend should not contain server-only secrets.

### Express backend
Responsible for:
- routing
- request validation
- orchestration
- GitHub API communication
- repository analysis
- AI calls
- persistence
- error handling
- security controls

### GitHub service
Responsible for retrieving only the repository information needed by the analyzer.

Do not clone entire repositories in V1 unless a later requirement demonstrates that deeper source analysis is necessary.

### Analysis engine
Transforms GitHub data into structured technical evidence.

Objective facts should be deterministic.

Example evidence:

```text
React → detected
Express → detected
MongoDB/Mongoose → detected
Test files → detected
GitHub Actions → detected
README → present
```

The analyzer should distinguish:
- detected
- not detected
- unknown/not enough evidence

Absence of evidence should not automatically be treated as proof that something does not exist.

### AI service
Responsible for:
- grounded interview-question generation
- semantic answer evaluation
- identifying knowledge gaps
- study recommendations

AI requests should receive structured evidence and only the repository context necessary for the task.

## Data model — initial direction

Use MongoDB with Mongoose.

Likely entities:

### User
Only required if authentication/session ownership is introduced.

### ProjectAnalysis
Contains:
- repository identity
- repository metadata
- analysis evidence
- timestamps
- analysis version

### InterviewSession
Contains:
- reference to project analysis
- generated questions
- user answers
- evaluations
- timestamps
- session status

The exact schema should be finalized during implementation planning rather than prematurely over-modeling.

## API direction

Initial endpoint candidates:

```text
POST /api/projects/analyze
GET  /api/projects/:analysisId
POST /api/interviews
GET  /api/interviews/:sessionId
POST /api/interviews/:sessionId/answers
```

These are candidates, not permission to implement all endpoints at once. Confirm against the implementation plan before coding.

## Request flow: analysis

```text
Browser
  |
  | repository URL
  v
POST /api/projects/analyze
  |
  v
Validate URL
  |
  v
GitHub service
  |
  v
GitHub API
  |
  v
Normalize relevant data
  |
  v
Analysis engine
  |
  v
Persist analysis
  |
  v
Return structured analysis
```

## Request flow: interview

```text
Analysis evidence
      |
      v
AI question generation
      |
      v
Question shown to user
      |
      v
User answer
      |
      v
AI evaluation + evidence
      |
      v
Structured evaluation
      |
      v
Persist session
```

## AI reliability

Do not rely on free-form model text for critical application state.

Prefer schema-constrained/structured output where supported.

Validate:
- required fields
- allowed enum values
- string lengths
- question/evaluation relationships
- evidence references where applicable

If the AI fails validation, handle the failure explicitly rather than displaying malformed data as trustworthy.

## Security architecture

Secrets stay server-side.

Expected environment configuration will include server-side values for external services.

Never expose:
- Gemini API key
- private tokens
- database credentials

Input validation and rate limiting should protect expensive endpoints, particularly AI generation/evaluation endpoints.

## Performance

Do not optimize prematurely.

First establish correctness.

Potential later optimizations:
- caching repeated GitHub requests
- minimizing GitHub API calls
- limiting repository data retrieved
- reusing stored analyses
- controlling AI context size

Caching should only be introduced when its behavior can be clearly explained and tested.

## Architecture constraints

V1 remains a single backend service.

No microservices.

No vector database.

No background job system unless a concrete performance requirement appears.
