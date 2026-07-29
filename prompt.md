---


```text
You are the lead engineer responsible for implementing the Risal Contextual Messaging product specification.

The complete product specification is located at:

RISAL_CONTEXTUAL_MESSAGING.md

You MUST read that file completely before making any changes.

Your job is NOT to rewrite the application.

Your job is to evolve the existing messaging application into Risal — Contextual Messaging — through controlled, incremental implementation phases.

==================================================
CORE RULE
==================================================

DO NOT start coding immediately.

First inspect the repository and understand the existing architecture.

You must preserve working functionality.

The existing messaging application is the foundation.

The contextual system must be added incrementally on top of it.

Do not replace working architecture unless there is a concrete technical reason.

Do not introduce unnecessary dependencies.

Do not create duplicate systems when existing infrastructure can be reused.

==================================================
PHASE 0 — REPOSITORY AUDIT
==================================================

Before modifying anything, inspect:

- frontend architecture
- backend architecture
- database
- database models
- authentication
- conversation model
- message model
- users
- groups
- stories
- navigation
- state management
- API client
- API routes
- WebSocket implementation
- notification system
- validation
- reusable UI components
- styling system
- test setup
- build configuration

Search the repository instead of guessing.

Identify the exact files that will need modification.

Create an implementation plan based on the actual repository.

DO NOT implement features yet.

Verification:

- Repository structure documented
- Existing conversation flow identified
- Existing message flow identified
- Existing database model identified
- Existing API flow identified
- Existing navigation identified
- Existing tests/build commands identified

Run the existing validation commands if available.

At minimum attempt:

- typecheck
- lint
- tests
- build

Record the baseline status.

Do not proceed until you understand the existing system.

==================================================
PHASE 1 — DOMAIN MODEL
==================================================

Implement the contextual conversation model.

Support:

- chat
- plan
- event
- decision
- study
- project

First inspect the existing Conversation model.

Extend it rather than replacing it.

The system must remain backward compatible.

Existing conversations must continue working.

Implement only the minimum required fields.

Potential conceptual structure:

contextType
context
status
expiresAt

Adapt this to the actual project's architecture.

Do not blindly copy the specification's interfaces.

Verification:

1. TypeScript passes.
2. Database schema is valid.
3. Database migration succeeds.
4. Existing conversation records remain readable.
5. Existing messaging still works.
6. New contextual conversations can be persisted.
7. No existing API contract is unnecessarily broken.

If database tests exist, run them.

If no database tests exist, create focused tests for the new behavior.

STOP if verification fails.

==================================================
PHASE 2 — CONTEXT CREATION
==================================================

Implement the new conversation creation flow.

The user should be able to choose:

- Just Talk
- Make a Plan
- Organize an Event
- Make a Decision
- Study Together
- Work on a Project

The normal chat flow must remain available.

Context-specific forms should only request relevant data.

Do not create an overcomplicated form.

Implement:

- context type selection
- context metadata input
- validation
- API integration
- persistence
- error handling
- loading states
- success behavior

Reuse existing components and patterns.

Verification:

For every context type:

1. User can open creation flow.
2. User can select the context.
3. User can enter valid metadata.
4. Invalid data is rejected correctly.
5. Data reaches the backend.
6. Data is persisted.
7. Conversation is created.
8. User is navigated to the conversation.
9. Existing normal chat creation still works.

Run:

- typecheck
- lint
- tests
- build

STOP if verification fails.

==================================================
PHASE 3 — CONTEXTUAL CONVERSATION HEADER
==================================================

Modify the conversation screen.

Do NOT redesign the entire messaging UI.

The existing message list, composer, attachments, voice messages, reactions, etc. should remain intact.

Add a compact contextual header.

Examples:

Database Exam
Tomorrow · 10:00 AM
3 participants

Weekend Trip
Aug 2 · Ramallah
4 participants

The header should:

- display context type
- display title
- display useful metadata
- support normal chat without context
- optionally expand to show details
- not consume excessive screen space

Verification:

1. Normal chat displays correctly.
2. Contextual chat displays correct context.
3. Plan displays correct data.
4. Event displays correct data.
5. Study displays correct data.
6. Project displays correct data.
7. Decision displays correct data.
8. Missing optional fields do not break UI.
9. Existing messaging UI remains functional.
10. Navigation remains functional.

Run all available validation commands.

STOP if verification fails.

==================================================
PHASE 4 — CONTEXT CARDS ON HOME SCREEN
==================================================

Update the conversation list/home screen.

Contextual conversations should be visually distinguishable from normal chats.

Use the existing design system.

Do not create an unrelated visual language.

Cards should display useful context.

Example:

Database Exam
Tomorrow · 10:00 AM
Latest message

Weekend Trip
Aug 2 · Ramallah
Latest message

Normal chats should still look like normal chats.

Verification:

1. Contextual conversations appear correctly.
2. Normal conversations remain visible.
3. Latest message remains correct.
4. Context metadata is correct.
5. Tapping a card opens the correct conversation.
6. Loading state works.
7. Empty state works.
8. Long titles/messages do not break layout.
9. Different context types render correctly.

Run validation.

STOP if verification fails.

==================================================
PHASE 5 — CONTEXT STATUS
==================================================

Implement:

active
completed
archived

Contexts must NOT be deleted when completed.

Implement the appropriate backend and frontend behavior.

Support completion/archiving through the appropriate UX.

Verification:

1. Active context displays as active.
2. Context can become completed.
3. Completed context remains accessible.
4. Archived context remains accessible if the existing product architecture supports this.
5. Status persists after refresh.
6. Status is correctly reflected in UI.
7. Normal chats are unaffected.

Run validation.

STOP if verification fails.

==================================================
PHASE 6 — DECISION SYSTEM
==================================================

Implement the first contextual artifact: Decisions.

A user should be able to create a decision inside a conversation.

Example:

Where should we eat?

Options:

- Pizza House
- Burger Lab
- Jasmine Restaurant

Implement:

- decision creation
- question
- options
- voting
- changing vote
- result calculation
- closing decision
- decision display inside conversation

The decision should be persisted.

Do not implement AI.

Do not over-engineer permissions unless required by the existing architecture.

Verification:

1. Decision can be created.
2. Question persists.
3. Options persist.
4. Participants can vote.
5. Vote persists.
6. User cannot accidentally create duplicate votes unless changing the vote is intended.
7. Vote changes correctly.
8. Results are correct.
9. Closed decision cannot be modified incorrectly.
10. Multiple users can interact with the same decision.
11. Existing messaging remains functional.

Test both frontend and backend behavior.

Run all validation.

STOP if verification fails.

==================================================
PHASE 7 — CONVERSATION → CONTEXT
==================================================

Implement the ability to convert an existing normal conversation into a contextual conversation.

Example:

Normal conversation:

"Let's meet tomorrow."

"5 PM?"

"Yes."

"At PTUK?"

Then user chooses:

Convert to Plan

The application creates/updates the conversation context.

Support the appropriate conversion types based on the current architecture.

The first implementation should be manual.

Do NOT implement AI extraction.

Verification:

1. Existing normal conversation can be converted.
2. Context metadata can be entered.
3. Existing messages remain untouched.
4. Participants remain unchanged.
5. Conversation ID remains stable unless the architecture absolutely requires otherwise.
6. Context is persisted.
7. UI immediately reflects the new context.
8. Reopening the conversation preserves the context.
9. Existing normal chats still work.

Run validation.

STOP if verification fails.

==================================================
PHASE 8 — CONTEXT-AWARE NOTIFICATIONS
==================================================

If the existing notification infrastructure supports this cleanly, modify notifications so contextual messages include context information.

Example:

Before:

Ahmad:
Did you finish the project?

After:

Graduation Project
Ahmad:
Did you finish the project?

Do not rebuild the notification infrastructure.

Reuse existing notification mechanisms.

Verification:

1. Normal chat notifications remain unchanged.
2. Contextual notifications include context information.
3. Notification payload is correct.
4. Deep links open the correct conversation.
5. No notification regression occurs.

Run validation.

STOP if verification fails.

==================================================
PHASE 9 — REGRESSION TEST
==================================================

Now test the entire application as a messaging application.

Verify:

- authentication
- user profiles
- one-to-one messaging
- conversation creation
- message sending
- message receiving
- WebSocket behavior
- stories
- reactions
- attachments
- voice messages if already implemented
- groups if already implemented
- notifications if already implemented
- navigation
- logout/login
- existing data
- contextual conversations
- decisions
- status changes
- conversion

Do not assume old functionality still works because TypeScript compiles.

Perform actual runtime verification where possible.

Fix regressions before continuing.

==================================================
PHASE 10 — UI/UX QUALITY PASS
==================================================

Review the implementation as a Product Manager and UX engineer.

The application must still feel like a messaging app.

Avoid turning it into:

- Jira
- Trello
- Notion
- Google Calendar
- project management software

The hierarchy must remain:

Messaging first.
Context second.
Structure only when useful.

Check:

- spacing
- typography
- hierarchy
- empty states
- loading states
- error states
- long content
- small screens
- keyboard behavior
- navigation
- accessibility
- touch targets
- visual consistency

Reuse the existing design system.

Make only changes necessary to create a coherent product identity.

==================================================
PHASE 11 — FINAL TECHNICAL VERIFICATION
==================================================

Run all available:

- typecheck
- lint
- unit tests
- integration tests
- database tests
- build

Fix all errors.

Do not ignore warnings that indicate actual bugs.

Verify database migrations.

Verify API compatibility.

Verify frontend/backend communication.

Verify no debug code remains.

Verify no mock production data remains.

Verify no hardcoded context data remains.

Verify no unnecessary dependency was added.

==================================================
PHASE 12 — FINAL PRODUCT VERIFICATION
==================================================

Perform a final end-to-end scenario.

Scenario:

1. Create a new Plan.
2. Add participants.
3. Add date.
4. Add location.
5. Open the conversation.
6. Send messages.
7. Verify contextual header.
8. Create a Decision.
9. Add options.
10. Vote.
11. Verify results.
12. Convert/update context if applicable.
13. Complete the context.
14. Verify it remains accessible.
15. Return to home.
16. Verify the contextual card.
17. Open a normal conversation.
18. Verify normal messaging remains unchanged.

The implementation is only complete if this entire flow works.

==================================================
REQUIRED REPORT AFTER EACH PHASE
==================================================

After each phase, report:

PHASE:
<phase number and name>

IMPLEMENTED:
- ...
- ...

FILES CHANGED:
- ...
- ...

DATABASE CHANGES:
- ...

API CHANGES:
- ...

UI CHANGES:
- ...

TESTS RUN:
- ...

RESULT:
PASS / FAIL

VERIFICATION:
- [x] ...
- [x] ...
- [ ] ...

ISSUES:
- ...

NEXT PHASE:
...

Do not report PASS unless the verification actually succeeded.

==================================================
IMPORTANT AGENT RULES
==================================================

1. Never skip repository inspection.
2. Never assume the architecture.
3. Never rewrite working messaging functionality unnecessarily.
4. Never implement all phases in one uncontrolled change.
5. Complete one phase at a time.
6. Verify each phase before starting the next.
7. If a phase fails, fix it before continuing.
8. Keep changes small and reviewable.
9. Reuse existing components and infrastructure.
10. Preserve backward compatibility.
11. Do not add AI unless explicitly requested by a later task.
12. Do not add unnecessary dependencies.
13. Do not create fake/mock production behavior.
14. Do not mark a feature complete because it compiles.
15. Runtime behavior must be verified where possible.
16. Existing messaging must remain the primary experience.
17. Context is an enhancement, not a replacement for messaging.
18. Prefer simple implementations over feature-heavy implementations.
19. Do not move to the next phase until the current phase passes verification.
20. At the end, provide a concise list of all files changed and all validation commands executed.

START WITH PHASE 0 ONLY.

Do not implement Phase 1 until Phase 0 has been completed and verified.
```
