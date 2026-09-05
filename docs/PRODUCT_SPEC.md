# CodeCred — Product Specification

## Product

**Name:** CodeCred

**Working tagline:** Know your code. Defend your work.

## Problem

Developers often build projects for their resumes without fully understanding or being able to explain the technical decisions behind the implementation. During technical interviews, interviewers can go beyond features and ask about architecture, APIs, databases, security, performance, testing, and implementation choices.

CodeCred addresses the gap between building a project and being able to technically defend it.

## Primary users

Students and junior/early-career developers preparing for technical interviews who have built GitHub projects but are not confident they can explain and defend the implementation.

## Core product promise

CodeCred helps a developer answer:

> Can I actually understand and defend the technical work represented by this repository?

## V1 input

One public GitHub repository URL.

Private repositories are outside the initial V1 scope unless explicitly added later.

## Core workflow

1. Submit repository URL.
2. Retrieve repository data through the backend.
3. Analyze the repository deterministically.
4. Present technical evidence.
5. Generate project-specific interview questions.
6. Let the developer answer.
7. Evaluate the answer against repository evidence.
8. Identify weak understanding or unsupported claims.
9. Recommend specific areas to study.
10. Persist the analysis/interview session.

## MVP features

### 1. Repository ingestion
- Public GitHub repository URL
- Backend retrieval
- Invalid/unavailable repository handling

### 2. Technical repository analysis
Analyze detectable signals including:
- languages
- project structure
- dependencies
- frameworks/libraries
- API usage
- database indicators
- authentication/security indicators
- testing
- documentation
- deployment/configuration signals

### 3. Technical Evidence Report

The report should answer:
> What does this repository actually demonstrate?

Evidence must be traceable to repository facts where practical.

Avoid presenting a single arbitrary “developer quality score.”

### 4. AI-generated interview

Questions must be grounded in detected repository evidence.

Avoid generic textbook questions unless they are clearly connected to an implementation detail.

### 5. Answer evaluation

Evaluate:
- technical correctness
- completeness
- understanding
- consistency with repository evidence

### 6. Gap report

Identify:
- weak technical areas
- misunderstandings
- unsupported claims
- recommended study topics
- priority where useful

### 7. Session persistence

Persist the information required to revisit an analysis/interview session.

## AI boundary

Deterministic code is the source of truth for objective facts.

AI interprets evidence and produces:
- questions
- explanations
- answer evaluation
- learning recommendations

The system must not allow an AI response to silently overwrite repository facts.

## Product non-goals

V1 does not include:
- resume parsing
- job matching
- multi-repository portfolio analysis
- generic career coaching
- generic chatbot
- AI code generation
- automated code fixing
- social features
- microservices
- unnecessary infrastructure

## UX principles

CodeCred should feel:
- focused
- technical
- credible
- useful
- easy to understand

The interface should emphasize evidence and assessment rather than AI decoration.

## Success

A user should be able to take one real repository, see what it objectively demonstrates, practice questions derived from that implementation, receive evidence-based feedback, and leave with a concrete list of topics they need to understand better before defending the project in an interview.
