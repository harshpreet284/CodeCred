# CodeCred — AI Coding Agent Instructions

## 1. Project identity

CodeCred is a full-stack developer interview-readiness platform.

Core problem:
Developers often build projects for their resumes without fully understanding or being able to explain the technical decisions behind the implementation. CodeCred analyzes a GitHub repository, extracts technical evidence, generates implementation-grounded interview questions, evaluates answers against repository evidence, and identifies areas that need improvement.

Primary users:
- Students
- Junior developers
- Early-career developers preparing for technical interviews

## 2. Product boundary

V1 analyzes ONE public GitHub repository at a time.

Core workflow:
1. User submits a public GitHub repository URL.
2. Backend retrieves relevant repository information.
3. Backend performs deterministic technical analysis.
4. CodeCred presents technical evidence.
5. AI generates questions grounded in the evidence.
6. User answers questions.
7. AI evaluates the answer against the question and repository evidence.
8. CodeCred identifies weak areas, inconsistencies, and recommended study topics.
9. Interview/analysis data can be persisted and revisited.

Do not expand the product into a generic career platform.

## 3. Technology stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- External API: GitHub REST API
- AI: Gemini API, accessed from the backend only
- Testing: choose appropriate mainstream tools during implementation

Do not add technologies such as Redis, PostgreSQL, Kubernetes, microservices, vector databases, or LangChain unless a concrete requirement is identified and explicitly approved.

## 4. Architecture rules

Use a clear separation of concerns:

Frontend
→ Express REST API
→ services
→ GitHub / MongoDB / AI

Backend layers should remain modular. Avoid a giant server file or giant service file.

Routes should delegate to controllers.
Controllers should coordinate services.
Services should contain business logic and integrations.
Database access should be isolated appropriately.

The backend is the trusted boundary for:
- GitHub API communication
- analysis
- persistence
- AI calls
- validation
- security-sensitive operations

The frontend must never contain Gemini API credentials or other server-only secrets.

## 5. AI rules

AI is NOT the source of truth for objective repository facts.

Deterministic code should establish facts such as:
- repository metadata
- file/folder structure
- languages
- dependencies
- detectable frameworks/libraries
- API integrations
- database indicators
- authentication/security indicators
- tests
- documentation
- deployment/configuration signals

AI is responsible for interpretation such as:
- project-specific interview questions
- semantic explanation of findings
- answer evaluation
- identifying understanding gaps
- study recommendations

AI must not invent technologies, features, or architectural decisions that repository evidence does not support.

Prefer structured AI output and validate it before using it in the application.

## 6. Coding workflow

Implement ONE task at a time.

For every task:
1. Read the relevant project documentation.
2. Inspect existing code before changing it.
3. Make the smallest coherent change.
4. Add/update tests for the changed behavior.
5. Run relevant tests and checks.
6. Report what changed and what was verified.
7. Do not start future tasks automatically.

Do not modify unrelated files.

If an architectural decision is unclear, stop and explain the options instead of guessing.

If an implementation fails repeatedly, diagnose the root cause rather than layering patches.

## 7. Testing

Tests are part of implementation, not an afterthought.

For meaningful features:
- add unit tests for important business logic
- add API/integration tests for important backend behavior
- add frontend tests where behavior warrants them
- maintain a critical end-to-end user journey before release

When a bug is found:
1. reproduce it
2. add a regression test where practical
3. fix the underlying cause
4. rerun relevant tests

## 8. Security

Never hardcode:
- API keys
- passwords
- tokens
- credentials
- private configuration

Use environment variables for secrets.

Never expose Gemini credentials to the browser.

Validate user input, especially GitHub repository URLs and AI-related request payloads.

Do not trust AI output blindly.

Before deployment, perform a security review covering secrets, authentication/authorization if implemented, input validation, API abuse/rate limiting, dependency risks, and production configuration.

## 9. Git workflow

Start features from a clean Git state.

After a successful task:
- run tests/checks
- inspect the diff
- commit the completed work

Use clear commit messages describing what changed.

Do not use AI-native revert mechanisms as a replacement for Git.

## 10. Refactoring

Do not allow files or modules to grow indefinitely.

After major phases, review for:
- duplicated logic
- oversized files
- unclear responsibilities
- dead code
- unnecessary dependencies
- inconsistent patterns
- performance problems

Refactor deliberately and test after refactoring.

## 11. Visual design

CodeCred must have a distinct visual identity from the previous project.

It should feel like a serious developer/technical assessment tool, not a generic AI SaaS template.

Avoid:
- excessive gradients
- purple/blue AI clichés
- glassmorphism
- glowing decorative backgrounds
- excessive rounded cards
- excessive animation
- generic AI badges
- dashboard clutter

Prefer:
- strong typography
- restrained palette
- one distinctive accent
- clear hierarchy
- deliberate spacing
- subtle borders
- moderate radius
- purposeful interactions

Do not independently invent a new visual system on each task. Follow the approved design documentation.

## 12. Scope control

V1 does NOT include:
- resume parsing
- job-description matching
- full GitHub profile analysis
- multi-project portfolio scoring
- generic AI chatbot
- AI code generation
- automated code fixing
- social/community features
- microservices
- complex infrastructure
- fake developer-quality scoring

Do not add these unless the product specification is deliberately revised.

## 13. Definition of done

A task is not complete merely because code was written.

A task is complete when:
- intended behavior works
- relevant tests pass
- errors are handled appropriately
- no unrelated behavior was broken
- implementation follows project architecture
- secrets remain protected
- the working tree/diff is reviewed
- the result is ready for the next task
