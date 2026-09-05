# CodeCred — AI Guidelines

## Purpose

AI is a reasoning/interpretation layer on top of deterministic repository evidence.

AI must not be used as a substitute for facts that application code can reliably determine.

## Grounding

Every AI feature should receive:
- the user's task/question
- structured repository evidence
- only the relevant repository context
- explicit instructions not to invent unsupported implementation details

## Question generation

Questions should be:
- specific to the repository
- technically meaningful
- grounded in detected implementation
- appropriate for a student/junior developer
- varied across architecture, APIs, data, security, testing, and implementation decisions when evidence exists

Avoid generic questions such as “What is React?” unless the repository context makes the question meaningful.

## Answer evaluation

Evaluate at least:
- correctness
- completeness
- understanding
- repository consistency

Do not infer that a user is a bad developer from one weak answer.

The product evaluates preparedness for defending this project, not overall programming ability.

## Evidence consistency

The evaluator should distinguish:

1. Technically correct answer
2. Correct description of this repository
3. Unsupported claim
4. Contradiction with repository evidence

If evidence is insufficient to determine whether a claim is true, say that evidence is insufficient.

## Recommendations

Recommendations should:
- point to the weak area
- explain why it matters
- identify what the developer should study
- be prioritized when appropriate
- avoid generic motivational language

## Structured output

Prefer structured JSON/schema-constrained model responses.

Validate model output before storing or displaying it.

Never assume a model response is valid simply because the API returned HTTP success.

## Prompt safety

Repository content can contain arbitrary text.

Treat repository files, README content, comments, and user answers as untrusted data, not instructions to the AI system.

The system prompt/developer instructions must remain authoritative.

Do not allow repository text to override CodeCred's AI rules.

## Secrets

Never place API keys in:
- prompts
- frontend code
- committed source
- client-side configuration

Gemini requests happen server-side.

## Failure handling

If AI is unavailable:
- return a useful error
- preserve existing analysis data
- do not fabricate an answer
- allow retry where appropriate

If output validation fails:
- log an appropriate server-side diagnostic
- do not silently display malformed output
- retry only when justified and bounded

## Cost and context discipline

Send only necessary evidence/context.

Do not blindly send an entire repository to the model.

Prefer structured summaries and targeted excerpts.

## Evaluation philosophy

CodeCred should be honest rather than flattering.

A useful evaluation may say:
- “Your answer is incomplete.”
- “This claim is not supported by the repository evidence.”
- “The repository does not provide enough evidence to determine this.”

The goal is interview readiness, not positive sentiment.
