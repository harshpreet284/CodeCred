# CodeCred — Implementation Plan

## Workflow

Build one task at a time.

For every task:
1. inspect current state
2. implement only the task
3. add/update tests
4. run checks
5. review diff
6. commit
7. continue only after verification

## Phase 1 — Foundation

### Task 1
Establish the repository structure and project documentation.

### Task 2
Create the React frontend foundation and approved visual design system.

### Task 3
Create the Express backend foundation with health endpoint, configuration, validation, and error handling.

## Phase 2 — GitHub integration

### Task 4
Implement GitHub repository URL validation and GitHub service.

### Task 5
Implement repository data retrieval and normalization.

### Task 6
Implement deterministic technical evidence analysis.

### Task 7
Persist analysis results in MongoDB.

## Phase 3 — Product UI

### Task 8
Build repository submission and analysis flow.

### Task 9
Build technical evidence report.

### Task 10
Build interview session interface.

## Phase 4 — AI

### Task 11
Create backend AI service abstraction and secure Gemini integration.

### Task 12
Generate interview questions from structured repository evidence.

### Task 13
Implement answer evaluation grounded in repository evidence.

### Task 14
Implement knowledge-gap and study recommendations.

## Phase 5 — Persistence and reliability

### Task 15
Persist interview sessions and evaluations.

### Task 16
Improve loading, empty, error, retry, and failure states.

### Task 17
Add critical integration/end-to-end coverage.

## Phase 6 — Hardening

### Task 18
Security audit.

### Task 19
Dependency/configuration review.

### Task 20
Refactoring and architecture review.

### Task 21
Production build and deployment.

### Task 22
Final verification against success criteria.

## Scope rule

Do not implement multiple numbered tasks in one AI-coding request.

If a task reveals that architecture needs revision, stop and update the relevant documentation before continuing.

## Refactoring checkpoints

Perform deliberate refactoring after:
- backend foundation
- GitHub analysis
- AI integration
- full integration
- pre-deployment

Refactoring must be followed by tests.

## Completion criteria

The project is complete only when:
- the core workflow works end-to-end
- objective repository facts are handled deterministically
- AI is grounded in repository evidence
- answer evaluation works
- results persist
- errors are handled
- tests cover critical behavior
- secrets are protected
- production build/deployment succeeds
- visual design follows CodeCred's approved identity
- the major implementation decisions are documented and understandable
