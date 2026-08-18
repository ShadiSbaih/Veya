You are working on an existing **React Native + Expo + TypeScript frontend** with an **Express + TypeScript + MongoDB backend** called **Risal**.

The application already contains working authentication, user profiles, real-time messaging, conversations/groups, WebSocket events, notifications, media messages, contextual conversations, and decision/poll functionality.

Your task is **NOT to build a new application from scratch**.

Your task is to **analyze the existing codebase and transform the current generic messaging application into a distinctive outcome-driven collaboration product while reusing as much stable infrastructure as possible.**

# Product Vision

Transform Risal from:

> A messaging app with contextual chat types.

Into:

> **Risal — Conversations That Produce Outcomes.**

Risal should help small teams, student groups, hackathon teams, project collaborators, and friends turn conversations into structured:

*   Decisions
*   Tasks
*   Agreements
*   Questions
*   Events
*   Resources
*   Action items
*   Final outcomes

The core problem Risal solves is:

> Important decisions, responsibilities, deadlines, files, and agreements become buried inside long group chats.

Risal should make those outcomes first-class objects rather than leaving them as ordinary messages.

---

# Core Product Principle

A conversation should follow this lifecycle:

**Discuss → Decide → Execute → Complete**

The chat is no longer the entire product.

Chat is simply the communication layer surrounding structured collaborative objects.

---

# 1\. Replace Contextual Conversation Types

The current application supports conversation types such as:

*   chat
*   plan
*   event
*   decision
*   study
*   project

Remove this concept as the main organizational model.

A project conversation can simultaneously contain a decision, task, event, file, and question, so forcing the whole conversation into one type is unnecessary.

Replace it with one main abstraction:

# Space

A Space represents a goal-oriented collaboration.

Examples:

*   Launch Portfolio V2
*   Build Hackathon Prototype
*   Plan Graduation Trip
*   Prepare Database Assignment
*   Organize Product Launch

Each Space contains:

*   Goal
*   Participants
*   Chat
*   Actions
*   Decisions
*   Questions
*   Resources
*   Events
*   Activity
*   Status
*   Progress
*   Final Outcome

Suggested statuses:

```
type SpaceStatus =
  | "discussing"
  | "deciding"
  | "executing"
  | "completed"
  | "archived";
```

Do not delete the underlying Conversation infrastructure unless necessary.

Prefer evolving Conversation into Space or introducing a domain layer around the existing conversation architecture.

---

# 2\. Space Goal

Every Space should have a clear purpose.

Example:

```
Space:
Gaza Education Device

Goal:
Create and submit a working prototype for the competition.

Deadline:
August 25

Status:
Executing
```

The goal should remain visibly available inside the Space so users always understand what the conversation is trying to accomplish.

---

# 3\. Messages Must Become Actionable Objects

This is one of the most important features.

Users should be able to long-press or open the actions menu for any message and convert it into:

*   Task
*   Decision
*   Agreement
*   Question
*   Event
*   Resource
*   Important Note

Example message:

```
I'll finish the API by Thursday.
```

User selects:

**Turn into Task**

Risal creates:

```
Task
Finish API

Owner: Ahmad
Due: Thursday
Source: Original message
Status: Todo
```

Keep a reference between the structured object and the original message.

Do not duplicate arbitrary message content without traceability.

---

# 4\. Actions / Task System

Introduce lightweight task management inside every Space.

Task fields should include at minimum:

```
{
  title
  description?
  assignee?
  creator
  status
  priority?
  dueDate?
  sourceMessageId?
  completedAt?
  createdAt
}
```

Statuses:

```
Todo
In Progress
Blocked
Done
```

Tasks should not turn Risal into Jira.

Keep the system intentionally lightweight and conversation-centered.

Users should be able to:

*   Create a task manually.
*   Convert a message into a task.
*   Assign it to a participant.
*   Add/change a deadline.
*   Change status.
*   Mark it completed.
*   Filter active/completed tasks.
*   Open the original source message.

Space progress can partially derive from task completion.

Example:

```
Progress
7 / 11 actions completed
64%
```

---

# 5\. Replace Simple Polls with a Decision Protocol

The current decision/poll functionality should evolve into a real collaborative decision system.

A Decision should contain:

```
{
  title
  description?
  proposedBy
  options?
  status
  sourceMessageId?
  votes
  objections
  outcome?
  rationale?
  closedAt?
  createdAt
}
```

Recommended statuses:

```
Proposed
Discussing
Resolved
Rejected
```

Participants should be able to respond with:

```
Agree
Object
Needs Discussion
```

Optional decisions may still use multiple-choice voting.

Once resolved, display something like:

```
DECISION LOCKED

Use PostgreSQL instead of MongoDB.

Proposed by: Shadi
Agreed by: 4 members
Resolved: Aug 18

Reason:
Better relational modeling for the project.
```

The decision should permanently remain searchable in the Space Decision History.

The goal is to answer:

> What did we decide?

> Who made the decision?

> Why?

> When?

without searching through hundreds of messages.

---

# 6\. Agreements

Introduce a lighter object than Decisions.

An Agreement represents something the team agreed to without needing a formal poll.

Example:

```
Agreement

Weekly meeting will happen every Monday at 7 PM.

Agreed:
Aug 18
```

Users should be able to create an Agreement from a message.

---

# 7\. Open Questions

Allow messages to become tracked questions.

Example:

```
OPEN QUESTION

Which battery architecture should we use?

Created by Shadi
2 responses
Status: Open
```

Question states:

```
Open
Answered
Resolved
```

This prevents important unanswered questions from disappearing inside chat history.

---

# 8\. Resources

Spaces should maintain a Resource collection.

Resources may originate from:

*   Uploaded images
*   Videos
*   Documents
*   Links
*   Important messages

Example:

```
Resources

architecture.pdf
network-diagram.png
competition-rules.pdf
prototype-video.mp4
```

Do not implement a complex Google Drive clone.

The feature should primarily organize files already shared through conversation.

---

# 9\. Space Structure

A Space should conceptually provide access to:

```
Overview
Chat
Actions
Decisions
Resources
```

Do not blindly create unnecessary navigation screens.

Study the existing navigation and choose the simplest mobile interaction model.

The **Overview** should provide a high-level summary such as:

```
Gaza Education Device

Goal
Build and submit the prototype.

Status
Executing

Progress
64%

Due
Aug 25

5 Open Tasks
2 Open Questions
4 Decisions
8 Resources
```

---

# 10\. Outcome Board

Every Space should have an Outcome Board summarizing what emerged from the discussion.

Example:

```
OUTCOME BOARD

Decisions
• Use AODV
• Use Linux
• Use Wi-Fi Direct

Actions
• Build networking prototype — Shadi
• Calculate hardware cost — Ahmad
• Prepare pitch — Sara

Open Questions
• Battery architecture?
• Screen supplier?

Resources
• architecture.pdf
• prototype.png

Upcoming
• Prototype deadline — Aug 21
```

The Outcome Board should become one of Risal's strongest product differentiators.

---

# 11\. Space Lifecycle

Spaces should move through meaningful stages.

Example:

```
Discussing
↓
Deciding
↓
Executing
↓
Completed
```

Users should be able to change the stage manually.

Certain system events may suggest a stage change, but do not automatically change important states without user control.

---

# 12\. Final Outcome

When a Space is completed, generate a persistent summary from its structured data.

Example:

```
FINAL OUTCOME

Gaza Education Device

Goal
Submit a working prototype.

Result
Completed

Participants
4

Decisions
5

Tasks
12 / 12 completed

Resources
7

Key Decisions
• Linux-based architecture
• AODV routing
• Wi-Fi Direct communication

Completed
August 25
```

This becomes a permanent outcome record.

Users should be able to reopen the discussion history if needed.

---

# 13\. Activity History

Important structural events should appear in a timeline.

Examples:

```
Shadi created the Space.

Ahmad converted a message into a task.

Sara completed "Prepare slides".

Decision "Use PostgreSQL" was resolved.

Shadi changed Space status to Executing.
```

Do NOT turn ordinary messages into timeline activity.

Only track meaningful collaboration events.

---

# 14\. Search

Upgrade search beyond finding users.

Inside a Space, users should eventually be able to find:

*   Messages
*   Tasks
*   Decisions
*   Questions
*   Resources

Structure the backend and domain models so this can be added cleanly even if the first implementation uses simple filtering.

---

# 15\. Remove Low-Value Social Features

Remove **Stories** from Risal.

Delete or safely retire:

*   StoriesBar
*   StoryViewer
*   Stories-related UI
*   Stories-related navigation
*   Stories backend logic if it becomes unused

Stories conflict with Risal's new product identity.

Do not remove generic infrastructure such as notifications, user profiles, online presence, or messaging simply because they are not differentiators.

They remain supporting features.

---

# 16\. Keep Existing Infrastructure Where Appropriate

Preserve and reuse working implementations for:

*   Clerk authentication
*   User profiles
*   MongoDB database
*   Express API
*   Expo Router
*   React Native
*   WebSocket/realtime communication
*   Conversation participants
*   Message delivery
*   Image/video uploads
*   Notifications
*   Typing state
*   Online status
*   Existing security middleware

Do not rewrite stable functionality merely to make the architecture look different.

Refactor only when needed to support the new domain.

---

# 17\. Data Model Refactor

Review the existing:

```
Conversation
Message
Notification
User
```

models and determine the safest migration strategy.

Introduce appropriate models such as:

```
Space
Task
Decision
Question
Resource
Agreement
Activity
```

or embed selected lightweight objects where it makes architectural sense.

Avoid creating one giant MongoDB document containing unlimited messages, tasks, files, decisions, and activities.

Consider query patterns, indexing, growth, and maintainability.

Define explicit TypeScript interfaces instead of relying on `any`.

---

# 18\. Message Model

Extend the message system so messages may reference structured objects.

For example:

```
type MessageEntityType =
  | "task"
  | "decision"
  | "agreement"
  | "question"
  | "event"
  | "resource";
```

A message may contain/reference an entity rather than duplicating the complete entity state.

Existing ordinary text/media messages must continue to work.

---

# 19\. UX Principles

Do not redesign Risal into:

*   Slack
*   Discord
*   WhatsApp
*   Jira
*   Notion
*   Trello

Borrow interaction patterns where useful, but maintain a unique identity.

The product should feel:

*   Focused
*   Calm
*   Collaborative
*   Purposeful
*   Lightweight
*   Mobile-first
*   Outcome-oriented

Avoid:

*   Excessive dashboards
*   Enterprise complexity
*   Feature overload
*   Gamification
*   AI everywhere
*   Glassmorphism
*   Excessive gradients
*   Glowing UI
*   Generic AI-generated layouts

The interface should make structured information feel like a natural extension of chatting.

---

# 20\. Notifications

Expand notification types where useful.

Examples:

```
You were assigned a task.

A task is due tomorrow.

Someone objected to your proposal.

A decision was resolved.

A Space deadline is approaching.

Someone mentioned you.
```

Do not notify users for trivial activity.

---

# 21\. Product Identity

Every implementation decision should support this positioning:

> **Risal turns group conversations into decisions, actions, and outcomes so important work never gets buried in chat.**

If a feature does not support this value proposition, question whether it belongs in the product.

---

# 22\. Implementation Strategy

Before changing code:

1.  Analyze the entire current frontend/backend architecture.
2.  Identify existing features that can be reused.
3.  Identify obsolete contextual-chat assumptions.
4.  Map current models/routes/components to the new domain.
5.  Identify migration risks.
6.  Create an implementation plan.
7.  Then execute the refactor incrementally.

Use phases.

## Phase 1 — Domain Foundation

Implement:

*   Space model
*   Goal
*   Space status/lifecycle
*   Existing conversation compatibility
*   Updated TypeScript types
*   Required APIs

## Phase 2 — Actions

Implement:

*   Tasks
*   Task creation
*   Message → Task
*   Assignment
*   Due dates
*   Status management
*   Progress calculation

## Phase 3 — Decisions

Implement:

*   Proposals
*   Agreement/Object/Discuss responses
*   Resolution
*   Decision history
*   Message → Decision

Migrate useful parts of the current poll system rather than discarding working code unnecessarily.

## Phase 4 — Knowledge Objects

Implement:

*   Questions
*   Agreements
*   Resources
*   Message conversions

## Phase 5 — Outcome Board

Implement:

*   Space overview
*   Structured summaries
*   Progress
*   Open items
*   Upcoming items

## Phase 6 — Completion

Implement:

*   Final Outcome
*   Completed Space behavior
*   Activity history
*   Archiving

## Phase 7 — Cleanup

Remove:

*   Stories
*   Legacy contextual-conversation UI
*   obsolete models
*   duplicate utilities
*   dead code
*   unused styles
*   unused routes

---

# 23\. Code Quality Requirements

While implementing:

*   Keep TypeScript strict.
*   Eliminate avoidable `any`.
*   Avoid giant screen components.
*   Extract domain logic into hooks/services where appropriate.
*   Keep API access organized.
*   Add proper error handling.
*   Avoid infinite retry loops.
*   Avoid duplicated frontend/server domain definitions where possible.
*   Preserve realtime consistency.
*   Validate backend inputs.
*   Verify authorization for every Space/entity mutation.
*   Ensure only Space participants can access its content.
*   Use indexes where necessary.
*   Keep model relationships explicit.
*   Keep business logic out of UI components.

Do not perform unrelated large-scale rewrites.

---

# 24\. Important Requirement

Do NOT simply rename:

```
Conversation → Space
Context → Outcome
Poll → Decision
```

and consider the task complete.

The application's **behavior must fundamentally change** so that structured outcomes become the center of the product.

A successful implementation should make the user feel:

> "This isn't another chat app. This is where our conversations become actual work and decisions."

---

# Deliverables

Produce and execute:

1.  Current architecture assessment.
2.  Feature reuse/removal matrix.
3.  Proposed domain architecture.
4.  Database/model changes.
5.  API changes.
6.  Frontend state changes.
7.  Navigation/UX changes.
8.  Migration plan.
9.  Phased implementation plan.
10.  Actual implementation.
11.  Cleanup of obsolete features.
12.  Final verification against the Risal product vision.

When conflicts arise, prioritize:

**Product coherence → data integrity → maintainability → UX simplicity → backward compatibility.**

Do not stop after providing recommendations.

After analyzing the current codebase, proceed with implementing the transformation phase-by-phase.