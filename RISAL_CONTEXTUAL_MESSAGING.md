Below are two deliverables:

1. A **complete `RISAL_CONTEXTUAL_MESSAGING.md` specification** you can give directly to an AI coding agent.
2. A **phase-by-phase implementation prompt** that forces the agent to inspect, implement, test, verify, and only then continue.

## 1. `RISAL_CONTEXTUAL_MESSAGING.md`

````markdown
# Risal — Contextual Messaging

## Product Specification

**Product Name:** Risal  
**Product Category:** Contextual Messaging / Social Communication  
**Platform:** Mobile  
**Primary Stack:** React Native + Expo + TypeScript  
**Backend:** Node.js + TypeScript  
**Status:** Enhancement of an existing messaging application

---

# 1. Product Vision

Risal is a messaging application where conversations are not treated as simple streams of messages.

Instead, conversations can have a **purpose and context**.

Traditional messaging applications answer:

> "Who are you talking to?"

Risal answers:

> "What are you trying to accomplish together?"

A conversation can be:

- A normal conversation
- A plan
- An event
- A study session
- A project
- A decision
- A temporary conversation around a specific activity

The existing messaging functionality remains the foundation of the application.

The goal is **not to rebuild the messaging system**.

The goal is to add a contextual layer on top of the existing messaging system.

---

# 2. Product Thesis

Traditional messaging:

```text
Person
   ↓
Conversation
   ↓
Messages
````

Risal:

```text
People
   ↓
Context
   ↓
Conversation
   ↓
Actions
   ↓
Outcome
```

Example:

```text
People:
Shadi
Ahmad
Dana

Context:
Database Exam

Conversation:
"Did anyone finish the joins section?"

Actions:
- Share file
- Add reminder
- Create task
- Share location

Outcome:
Everyone prepares for the exam.
```

The product should make conversations more useful without making them complicated.

---

# 3. Core Product Principle

## Context First

Every conversation may optionally have a context.

A normal conversation is still completely valid.

The user must never be forced to create a structured context.

The application should support both:

```text
Normal Chat
```

and:

```text
Contextual Conversation
```

This preserves the familiar messaging experience while differentiating Risal from traditional messaging apps.

---

# 4. Existing Functionality Must Remain

The current application already contains or plans to contain standard messaging functionality.

These capabilities must remain available:

* One-to-one conversations
* Messages
* Conversation participants
* Stories
* Message reactions
* Read receipts
* Push notifications
* Voice messages
* Group conversations
* Message search
* Story replies
* End-to-end encryption architecture
* Video calls
* Message pinning
* Multi-device synchronization

The contextual system must be designed as an extension of these capabilities.

Do not replace the existing messaging architecture unless technically necessary.

Do not remove working functionality.

Do not rewrite working modules simply to introduce the new product concept.

---

# 5. Context Types

Risal initially supports six context types.

```ts
type ConversationContextType =
  | "chat"
  | "plan"
  | "event"
  | "decision"
  | "study"
  | "project";
```

## 5.1 Chat

Standard messaging.

Example:

```text
Ahmad

Hey, how are you?
```

No special contextual requirements.

---

## 5.2 Plan

Used when people are organizing something.

Examples:

* Weekend trip
* Restaurant visit
* Study session
* Shopping
* Meeting
* Hiking

Possible metadata:

```text
Title
Date
Time
Location
Participants
Description
Status
```

Example:

```text
Weekend Trip

Date:
August 2

Location:
Ramallah

Participants:
Shadi
Ahmad
Dana
```

Useful actions:

* Add date
* Add location
* Share location
* Create decision
* Add task
* Add reminder

---

# 5.3 Event

Used for a specific event.

Examples:

* Graduation
* Birthday
* Wedding
* Hackathon
* Conference
* University event
* Team event

Possible metadata:

```text
Title
Date
Time
Location
Description
Participants
Status
```

Example:

```text
Graduation Party

August 15
6:00 PM

PTUK

12 participants
```

Useful actions:

* Event details
* Schedule
* Location
* Participants
* Photos
* Shared media
* Add to calendar
* Event memories

---

# 5.4 Decision

Used when a group needs to choose something.

Examples:

```text
Where should we eat?

Pizza House
Burger Lab
Jasmine Restaurant
```

or:

```text
Which technology should we use?

Next.js
Angular
React
```

The conversation remains a normal chat.

A decision object can be created inside it.

Example:

```text
Decision:
Where should we eat?

Options:
- Pizza House
- Burger Lab
- Jasmine Restaurant

Voting:
Shadi → Burger Lab
Ahmad → Pizza House
Dana → Burger Lab

Result:
Burger Lab
```

The decision system should support:

* Creating a decision
* Adding options
* Voting
* Changing a vote
* Closing a decision
* Showing results
* Displaying the decision inside the conversation

---

# 5.5 Study

Used for collaborative learning.

Examples:

* Database exam
* Programming assignment
* Research project
* Study group
* Course revision

Possible metadata:

```text
Title
Course
Exam / deadline date
Participants
Description
```

Example:

```text
Database Exam

Course:
Database Systems

Exam:
August 5

Participants:
Shadi
Ahmad
Dana
```

Potential contextual actions:

* Share study material
* Pin important message
* Add task
* Add reminder
* Share file
* Create decision

The first implementation should remain simple.

Do not build a complete LMS.

---

# 5.6 Project

Used for collaborative work.

Examples:

* Graduation project
* Startup
* Open-source project
* Team assignment
* Research project

Possible metadata:

```text
Title
Description
Deadline
Participants
Status
```

Example:

```text
Graduation Project

Deadline:
September 1

Members:
Shadi
Ahmad
Dana
```

Potential actions:

* Tasks
* Decisions
* Files
* Important messages
* Project status

The initial implementation should not become a full project management system.

---

# 6. Context Data Model

The contextual layer should extend the existing conversation model.

Existing concept:

```ts
Conversation {
  id
  participants
  messages
}
```

New conceptual model:

```ts
Conversation {
  id
  participants
  messages

  contextType
  context
}
```

Example:

```ts
interface ConversationContext {
  type:
    | "chat"
    | "plan"
    | "event"
    | "decision"
    | "study"
    | "project";

  title?: string;

  description?: string;

  date?: string;

  time?: string;

  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };

  status?: "active" | "completed" | "archived";

  expiresAt?: string;
}
```

Do not blindly copy this interface into the existing codebase.

First inspect the current domain models and adapt the design to the existing architecture.

---

# 7. Backward Compatibility

Existing conversations must continue to work.

If an existing conversation has no context:

```ts
contextType = "chat"
```

or equivalent behavior should be used.

Existing conversations must not require migration to structured metadata unless technically required.

Existing users should see their conversations exactly as before.

The contextual features are additive.

---

# 8. Conversation Creation Flow

The primary UX change is the conversation creation flow.

Instead of immediately creating a chat, the user sees:

```text
New Conversation

What are you doing?

[ Just Talk ]

[ Make a Plan ]

[ Organize an Event ]

[ Make a Decision ]

[ Study Together ]

[ Work on a Project ]
```

The user can select:

```text
Just Talk
```

to create a standard chat.

Or select one of the contextual types.

---

# 9. Context Setup Flow

After selecting a contextual type, show only the fields relevant to that context.

Example:

```text
Make a Plan

Title
[ Weekend Trip ]

Date
[ August 2 ]

Time
[ 09:00 AM ]

Location
[ Ramallah ]

Description
[ Optional ]

[ Create Conversation ]
```

Do not overwhelm users with unnecessary fields.

Context creation should be progressive.

Only ask for information that is useful.

---

# 10. Contextual Conversation UI

A contextual conversation should still look and behave like a normal chat.

The main difference is the header.

Example:

```text
┌─────────────────────────────┐
│ ←  🏕 Weekend Trip          │
│    4 participants           │
│                             │
│    Aug 2 · Ramallah         │
└─────────────────────────────┘
```

The message list remains familiar.

Example:

```text
Ahmad:
What time should we leave?

Dana:
9 AM?

Shadi:
Works for me.
```

The context should never dominate the conversation.

It should provide useful information at a glance.

---

# 11. Context Header

Each contextual conversation should have a compact context header.

Example:

```text
📚 Database Exam

Tomorrow · 10:00 AM
3 participants
```

For an event:

```text
🎓 Graduation

August 15 · 6:00 PM
PTUK
12 participants
```

For a decision:

```text
🗳 Where should we eat?

3 options · 4 voters
```

The header can be expandable.

Collapsed:

```text
📚 Database Exam
Tomorrow · 10:00 AM
```

Expanded:

```text
📚 Database Exam

Course:
Database Systems

Date:
August 5

Participants:
Shadi
Ahmad
Dana
```

---

# 12. Contextual Actions

Each context can expose relevant actions.

Example:

```text
Context Actions

+--------------------+
| Add Date           |
| Add Location       |
| Create Decision    |
| Add Task           |
| Share Location     |
| View Details       |
+--------------------+
```

Actions should be context-aware.

Do not show every action for every context.

---

# 13. Conversation → Artifact

One of Risal's core concepts is that conversations can produce structured outcomes.

A conversation can be transformed into:

* Plan
* Event
* Decision
* Task
* Project

Example:

```text
Shadi:
Let's meet tomorrow.

Ahmad:
Sure.

Shadi:
5 PM?

Ahmad:
Yes.

Shadi:
At PTUK?

Ahmad:
Yes.
```

The user can select:

```text
Convert to Plan
```

The application creates:

```text
Plan

Title:
Project Meeting

Date:
Tomorrow

Time:
5 PM

Location:
PTUK
```

This should initially be a manual user action.

Do not implement AI extraction in the first version.

---

# 14. Decision System

The first version should provide a lightweight decision system.

Flow:

```text
Conversation
    ↓
Create Decision
    ↓
Question
    ↓
Options
    ↓
Participants Vote
    ↓
Results
    ↓
Close Decision
```

Example:

```text
🗳 Where should we eat?

○ Pizza House
○ Burger Lab
○ Jasmine Restaurant

[Vote]
```

After voting:

```text
Results

Burger Lab       4 votes
Pizza House      2 votes
Jasmine          1 vote
```

Closed state:

```text
Decision Closed

Winner:
Burger Lab
```

---

# 15. Temporary Contexts

Some conversations naturally have a lifecycle.

For example:

```text
Hackathon

Starts:
August 1

Ends:
August 3
```

The context can optionally contain:

```ts
expiresAt
```

When the context expires, the conversation should not be deleted.

Instead, its state changes:

```text
active
→
completed
```

or:

```text
active
→
archived
```

The history remains accessible.

---

# 16. Home Screen

The home screen should visually distinguish contextual conversations.

Example:

```text
Risal

Today

📚 Database Exam
Tomorrow · 10:00 AM
Shadi, Ahmad, Dana

🏕 Weekend Trip
Aug 2 · Ramallah
4 participants

💼 Graduation Project
Deadline Sep 1
5 participants

──────────────

Messages

Ahmad
Hey, are you free?
```

The goal is to make the user's active contexts visible.

---

# 17. Context Status

Contexts can have a status:

```ts
type ContextStatus =
  | "active"
  | "completed"
  | "archived";
```

Active:

```text
● Active
```

Completed:

```text
✓ Completed
```

Archived:

```text
Archived
```

Completed conversations remain readable.

---

# 18. Context Cards

Contextual conversations can use cards in lists.

Example:

```text
┌──────────────────────────────┐
│ 📚 Database Exam             │
│                              │
│ Tomorrow · 10:00 AM          │
│ 3 participants               │
│                              │
│ "Did anyone finish joins?"   │
└──────────────────────────────┘
```

The latest message should remain visible so the card still feels like a messaging item.

---

# 19. Notifications

Notifications must preserve the context.

Instead of:

```text
Ahmad:
Did you finish the project?
```

Use:

```text
📚 Database Exam
Ahmad:
Did you finish the joins section?
```

For events:

```text
🎓 Graduation
Dana:
Are we still meeting at 6?
```

This provides useful context even when the user sees the notification outside the app.

---

# 20. Stories

Stories remain part of the application.

Do not remove or redesign the existing story system unless necessary.

Potential future integration:

```text
Story
   ↓
Reply
   ↓
Contextual Conversation
```

Example:

A user posts a graduation story.

Another user replies.

The reply can create or connect to:

```text
🎓 Graduation
```

This is optional for the first implementation.

---

# 21. Search

Existing message search should remain.

Future contextual search can support:

```text
Search:

"graduation"

Results:

🎓 Graduation Event
💼 Graduation Project
📸 Graduation Memories
```

This is not required for the initial MVP.

---

# 22. Design Direction

The application should feel modern but not visually overloaded.

The design language should communicate:

* Context
* Clarity
* Organization
* Communication
* Lightweight productivity

Avoid making it look like:

* A corporate project management application
* A calendar application
* A task management application
* A complicated productivity dashboard

Risal is still primarily a messaging application.

The context layer is secondary.

---

# 23. UX Principle

The user should always feel:

> "I'm chatting with people."

Not:

> "I'm managing a project."

This distinction is critical.

The product should remain:

```text
Messaging first
Context second
Productivity third
```

---

# 24. MVP Scope

The first release should implement only:

## Required

* Context types
* Context creation
* Context metadata
* Contextual conversation header
* Contextual conversation cards
* Context status
* Context-aware notifications where infrastructure already exists
* Decision creation
* Decision voting
* Decision results
* Basic conversation → context conversion
* Backward compatibility with existing chats

## Not Required Initially

* AI message analysis
* Automatic context detection
* AI-generated summaries
* Calendar synchronization
* Advanced task management
* Full project management
* Location tracking
* Live location
* Video calls
* End-to-end encryption implementation
* Multi-device synchronization
* Complex analytics

These features can be future roadmap items.

---

# 25. Future AI Layer

AI should not be part of the first implementation.

Later, Risal can introduce:

## Automatic Context Detection

Example:

```text
Shadi:
Let's meet Friday at 5 at the university.
```

Risal detects:

```text
Possible plan detected.

Friday
5:00 PM
University

[Create Plan]
[Ignore]
```

The AI must suggest rather than silently change the conversation.

---

# 26. Future Conversation Summary

A contextual conversation could eventually have:

```text
Summary

What was decided:
- Meeting is Friday
- Location is PTUK
- Ahmad will bring the documents

Open items:
- Dana hasn't confirmed
```

Again, this is future functionality.

---

# 27. Future Smart Artifacts

Long-term:

```text
Conversation
     ↓
AI detects useful information
     ↓
Suggested Artifact
     ↓
User confirms
     ↓
Structured Object
```

Possible artifacts:

* Event
* Plan
* Decision
* Task
* Reminder
* Location
* Summary

The user must remain in control.

---

# 28. Product Differentiation

Risal should not compete by having more messaging features than WhatsApp or Telegram.

Instead, its differentiator is:

> **Contextual communication.**

Traditional:

```text
Message → Message → Message
```

Risal:

```text
Context
   ↓
Conversation
   ↓
Decision / Plan / Event
   ↓
Outcome
```

The product turns unstructured conversation into lightweight structured collaboration.

---

# 29. Example Use Cases

## University

```text
📚 Database Exam

Students discuss:
- Topics
- Files
- Questions
- Exam time

Decision:
Which chapter should we study first?
```

## Graduation Project

```text
💼 Graduation Project

Team:
5 students

Conversation:
Architecture discussion

Decision:
Which backend should we use?

Outcome:
NestJS selected
```

## Trip

```text
🏕 Weekend Trip

Date:
August 2

Location:
Ramallah

Decision:
Where should we eat?

Outcome:
Restaurant selected
```

## Event

```text
🎓 Graduation

Date:
August 15

Participants:
12

Conversation:
Planning

Artifacts:
- Schedule
- Location
- Decisions
- Photos
```

---

# 30. Success Criteria

The implementation is successful when:

1. Existing messaging continues working.
2. Existing conversations remain accessible.
3. Users can create normal conversations.
4. Users can create contextual conversations.
5. Context metadata is persisted correctly.
6. Context information appears in the conversation UI.
7. Context cards appear on the home screen.
8. Context status works.
9. Decisions can be created.
10. Participants can vote.
11. Results are displayed correctly.
12. Conversations can be converted into contextual objects.
13. No unrelated messaging functionality is broken.
14. The application remains primarily a messaging application.
15. The new functionality feels integrated rather than bolted on.

---

# 31. Technical Constraints

Before implementing anything:

1. Inspect the existing repository.
2. Identify the current frontend architecture.
3. Identify the current backend architecture.
4. Identify database models.
5. Identify API routes.
6. Identify WebSocket behavior.
7. Identify authentication.
8. Identify conversation/message models.
9. Identify current navigation.
10. Identify reusable UI components.

Do not assume the architecture.

Do not replace the current architecture without justification.

Prefer incremental modifications.

Reuse existing:

* Components
* Hooks
* Services
* API clients
* Validation
* Authentication
* WebSocket infrastructure
* Navigation
* Styling system
* Database patterns

---

# 32. Engineering Principles

Use:

* TypeScript
* Existing project conventions
* Existing validation mechanisms
* Existing API patterns
* Existing state management
* Existing error handling
* Existing authentication
* Existing database conventions

Avoid:

* Duplicated logic
* Unnecessary abstractions
* Large rewrites
* Breaking API changes
* Hardcoded data
* Mock data in production paths
* TypeScript `any` unless unavoidable
* New dependencies unless necessary

---

# 33. Definition of Done

A feature is not considered complete merely because the code compiles.

Each implementation stage must satisfy:

```text
Code
 ↓
Type Check
 ↓
Lint
 ↓
Unit Tests where applicable
 ↓
Integration Tests where applicable
 ↓
Build
 ↓
Runtime Verification
 ↓
Regression Verification
```

If a stage fails, fix the failure before continuing.

Do not mark a phase complete based only on static code inspection.

---

# 34. Product Success Definition

Risal succeeds when a user can open the application and immediately understand:

> "This is a messaging app, but conversations here have meaning and purpose."

The product must remain simple.

The innovation is not feature quantity.

The innovation is the contextual model around communication.

---

# 35. Product Identity

## Name

Risal

## Category

Contextual Messaging

## Positioning

A messaging application designed around conversations with purpose.

## Core Value Proposition

> **Turn conversations into context, decisions, and outcomes.**

## Product Philosophy

```text
Messaging first.
Context second.
Structure only when useful.
```

## Core Differentiator

> **Risal understands that not every conversation is just a conversation.**

```text
Audit
  ↓
Verify baseline
  ↓
Domain Model
  ↓
Verify
  ↓
Creation Flow
  ↓
Verify
  ↓
Context UI
  ↓
Verify
  ↓
Decisions
  ↓
Verify
  ↓
Conversion
  ↓
Verify
  ↓
Regression
  ↓
Final E2E
```
