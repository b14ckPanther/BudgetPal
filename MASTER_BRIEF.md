# BudgetPal — Complete Master Brief

## 0. Project Identity

### App Name

**BudgetPal**

### Official Project / Poster Title

**BudgetPal: Personal Budget Agent**

### One-Line Concept

BudgetPal is an **agent-first personal budgeting app** that lets users ask, speak, scan, or upload — and the agent understands the mission, updates the budget, analyzes spending, explains results, and guides the next financial decision.

### Core Promise

> Tell it, say it, scan it, or ask it — BudgetPal understands your budget and does the work for you.

---

# 1. Product Vision

BudgetPal should not feel like a normal expense tracker.

Most budgeting apps open with dashboards, charts, category bars, and manual forms. That makes the user do the thinking and the work.

BudgetPal should be different.

BudgetPal is not:

> A budgeting dashboard with an AI chat feature.

BudgetPal is:

> An AI budget agent with dashboards, reports, and controls when needed.

The app should feel like a personal money copilot that can:

* Understand natural messy user input
* Add expenses and income
* Scan receipts
* Understand voice input
* Analyze spending across months
* Modify budgets with confirmation
* Create categories and subcategories
* Explain spending behavior
* Warn about budget problems
* Give useful saving advice
* Generate reports
* Show visual proof with cards, summaries, and charts

The main identity of BudgetPal is:

> Agent-first. Dashboard-supported.

The agent is the front door. Dashboards are the evidence.

---

# 2. Product Philosophy

BudgetPal should feel:

* Smart
* Calm
* Premium
* Useful
* Human
* Trustworthy
* Action-oriented
* Not judgmental
* Not childish
* Not like a boring spreadsheet
* Not like a crypto/trading dashboard
* Not like a generic chatbot

The app should answer this question every time the user opens it:

> What should we handle in your budget today?

The user should not feel forced to manually enter everything.

The preferred interaction flow is:

```text
Open app
→ Agent appears first
→ User asks, speaks, scans, or uploads
→ Agent understands the mission
→ Agent performs or prepares the action
→ App shows result cards, warnings, charts, or confirmations
→ User can edit manually if needed
```

---

# 3. Main Problem

Many people fail to manage budgets because traditional budgeting apps require too much manual work.

Common problems:

* Users forget to enter expenses.
* Manual forms feel boring.
* Dashboards show numbers but do not explain what they mean.
* Users notice problems only after overspending.
* Category management becomes messy.
* Reports are hard to understand.
* People want guidance, not just charts.
* People are tired of seeing the same dashboard-first finance apps.

BudgetPal solves this by making the agent the main interface.

Instead of asking the user to search through screens, BudgetPal lets the user say what they want done.

---

# 4. Target Users

BudgetPal is useful for:

* Students
* Young adults
* Families
* Small household budgets
* People who dislike spreadsheets
* People who want simple financial guidance
* People who need help understanding spending patterns
* People who want an assistant, not just a tracker
* Non-technical users who want budgeting to feel easier

The app should be simple enough for a non-expert user but impressive enough for a final university project presentation.

---

# 5. Product Positioning

BudgetPal is a **Personal Budget Agent**.

It should not be positioned as only:

* Expense tracker
* Budget dashboard
* Finance chart app
* Receipt scanner
* AI chatbot

It is all of these combined around one central idea:

> The user gives BudgetPal a financial mission, and BudgetPal completes it or prepares it safely.

Examples of missions:

```text
Add what I just spent.
Scan this receipt.
Show me how much I spent on gas in the last 8 months.
How much did I spend on restaurants this semester?
Can I afford headphones for 300?
Summarize my month.
Move 200 from shopping to savings.
Increase my food budget by 100.
Generate a monthly report.
How can I save more this week?
```

---

# 6. Language Strategy

The first version is **English-only**.

Rules:

* English UI only.
* LTR layout only.
* No Hebrew UI in the first version.
* No RTL implementation in the first version.
* No Hebrew PDF/export requirement in the first version.
* The project must still be localization-ready for future languages.

Localization-ready means:

* Do not hardcode user-facing strings directly inside screens.
* Use centralized translation/localization files.
* Default language is `en`.
* Keep `preferred_language` in the profile database model.
* Keep future multilingual support possible.
* Future languages can include Hebrew, Arabic, or others.
* Future RTL support should be possible, but not active now.

Future multilingual support is a planned future feature.

---

# 7. Core Experience

## First Screen After Login

The first main screen should be the **Agent Command Center**, not a traditional dashboard.

The first thing the user should see:

```text
Good evening, Noor
What should we handle today?

[Ask, speak, scan, or upload...]

Quick actions:
- Voice expense
- Scan receipt
- Analyze spending
- Can I afford?
- Generate report
```

It should also include a small budget snapshot, but the snapshot should support the agent, not replace it.

Example mini context:

```text
Safe to spend today: ₪72
Food & Drinks: 82%
Shopping: 94%
AI Insight: Food spending is rising faster than usual.
```

The user should immediately understand:

* The agent can do things.
* The user can ask naturally.
* Manual entry is optional, not the main workflow.
* Visual budget info exists but does not dominate the experience.

---

# 8. Navigation

Recommended bottom tabs:

1. **Agent**
2. **Budget**
3. **Activity**
4. **Reports**
5. **Profile**

## Agent

Main command center. The first and most important screen.

## Budget

Category limits, budget cycle, budget structure, goals, safe-to-spend settings.

## Activity

Transactions, history, agent-created actions, receipts, voice entries, imports.

## Reports

Weekly/monthly/custom reports, AI summaries, PDF exports.

## Profile

User settings, account info, language, currency, budget style, privacy, notifications.

---

# 9. Core Features

## 9.1 Agent Command Center

The agent is the central experience.

It should support:

* Text commands
* Voice commands
* Receipt scanning
* Uploaded files/images later if needed
* Suggested prompt chips
* Result cards
* Confirmation cards
* Warning cards
* Analysis cards
* Report cards

The agent should be able to perform missions, not only answer questions.

---

## 9.2 Natural Text Input

BudgetPal must understand messy English financial input.

Examples:

```text
lunch 55
paid 120 for fuel yesterday
got 500 from my uncle
rent 2200
netflix 39.90
bus 6.5
spent 300 on car stuff last week
add 90 to restaurants
I paid 45 at Aroma
salary 5000
```

The app should infer:

* Type: expense/income/transfer
* Amount
* Currency
* Merchant/title
* Category
* Subcategory
* Date
* Confidence
* Whether confirmation is needed

The app must not rely on one repeated demo example. It should support a wide range of real inputs.

---

## 9.3 Voice Input

Voice input is a **core presentation-ready feature**, not a distant future feature.

Voice should support messy natural speech.

Examples:

```text
I paid around 120 for gas yesterday.
Add 45 shekels for lunch.
I got 500 from my uncle.
I spent 300 on car stuff last week.
I paid 90 at a restaurant today.
```

Voice flow:

```text
User taps microphone
→ User speaks naturally
→ Speech-to-text transcribes
→ Agent interprets the meaning
→ Agent shows action preview
→ User confirms, edits, or cancels
→ Transaction is saved
→ Budget updates
```

Voice result should show:

* Original transcription
* Interpreted action
* Amount
* Category
* Date
* Confidence
* Save/Edit/Cancel buttons

Voice should not just transcribe. It must connect to the same agent/action system.

---

## 9.4 Receipt Scanning

Receipt scanning is also a **core presentation-ready feature**.

Receipt flow:

```text
User scans or uploads receipt
→ Image is processed
→ Agent extracts merchant, date, total, and items if possible
→ Agent suggests category/subcategory
→ App checks for duplicates
→ User reviews preview
→ User confirms or edits
→ Transaction is saved
→ Budget updates
```

Receipt preview should include:

* Merchant
* Date
* Total amount
* Currency
* Suggested category
* Suggested subcategory if relevant
* Extracted items if available
* Confidence score
* Duplicate warning if relevant
* Save/Edit/Cancel actions

Receipt scanning does not need to be perfect item-by-item at first, but it must be usable and demo-ready.

---

## 9.5 Manual Entry

Manual entry still exists, but it is not the main identity of the app.

Manual entry is for:

* Corrections
* Edge cases
* Users who prefer full control
* Editing agent results
* Adding details the AI missed

Manual transaction fields:

* Amount
* Type: expense/income/transfer
* Merchant/title
* Category
* Subcategory
* Date
* Note
* Source
* Confidence/status if AI-assisted

Manual UI should be clean, fast, and secondary to the agent workflow.

---

## 9.6 Spending Analysis

The agent must answer real spending questions using actual data.

Examples:

```text
Show me how much I spent on gas in the last 8 months.
How much did I spend on restaurants this semester?
What did I spend most on this month?
Compare my food spending this month to last month.
How much did I spend on car-related things this year?
Show all subscriptions I paid for recently.
What category grew the most?
Which merchants cost me the most?
```

The agent should:

* Understand the category/merchant concept
* Understand date ranges
* Query actual transactions
* Group data
* Calculate totals
* Show charts/cards
* Explain trends
* Suggest action if useful

The response should not only be text. It should include structured result cards.

---

## 9.7 Affordability Checks

The agent must answer questions like:

```text
Can I afford headphones for 300?
Can I go out tonight?
Can I spend 200 on clothes?
Is it okay if I buy this?
```

The answer should consider:

* Safe-to-spend amount
* Budget cycle
* Remaining days
* Category limits
* Upcoming bills if known
* Monthly income
* Savings goal
* Current spending pace

The answer should be useful, not generic.

Example:

```text
You can afford it, but it would reduce your safe-to-spend amount this week from ₪72/day to ₪38/day. A safer option is waiting until your phone bill clears.
```

---

## 9.8 Budget Modification

The agent must be able to modify budget data after confirmation.

Examples:

```text
Increase food budget by 100.
Move 200 from shopping to savings.
Set my transport budget to 600.
Change my budget cycle to start on the 10th.
Create a category for car maintenance.
Merge these two coffee categories.
```

Rules:

* Small safe actions can be prepared quickly.
* Risky/sensitive actions require confirmation.
* The agent must explain the impact.
* The user must be able to review changes.
* Delete/bulk/large changes must never happen silently.

---

## 9.9 Reports

Reports are part of the core product.

Report types:

* Weekly report
* Monthly report
* Custom period report
* Category report
* Merchant report
* Spending trend report

Reports should include:

* Date range
* Total income
* Total expenses
* Net savings
* Safe-to-spend summary
* Category breakdown
* Over-budget categories
* Largest transactions
* Top merchants
* Recurring payments/subscriptions if detectable
* AI summary
* AI recommendations
* Exportable PDF

The agent should be able to generate reports by request:

```text
Generate my monthly report.
Summarize my last 3 months.
Create a report about car spending.
Show me a food spending report.
```

---

## 9.10 In-App Warnings

BudgetPal should warn users in a helpful way.

Warnings should explain:

* What happened
* Why it matters
* What the user can do

Bad warning:

```text
You exceeded your budget.
```

Good warning:

```text
Food & Drinks is over budget by ₪40. If you keep spending at this pace, you may need to reduce shopping or increase your monthly budget.
```

Budget warning levels:

* 50% used: gentle progress notice
* 75% used: attention
* 85% used: strong warning
* 100%+ used: over-budget warning

Push notifications may be added if time allows, but in-app warnings must exist.

---

# 10. Agent Scope and Boundaries

The agent can be friendly and conversational, but it is not a random general chatbot.

## Allowed

The agent may answer:

```text
Hi
What can you do?
How do I add an expense?
Show me my spending.
Summarize my month.
How can I save more?
Can I afford this?
Scan this receipt.
Add this transaction.
Change my budget.
Generate a report.
Explain this warning.
How do I use the app?
```

## Redirect

The agent should politely redirect unrelated prompts like:

```text
What should I eat tonight?
Tell me a joke.
Write my homework.
Talk about random topics unrelated to the app.
```

Redirect example:

```text
I’m here to help with your budget and spending decisions. I can help you check restaurant spending, plan a food budget, or see what you can afford tonight.
```

The agent should avoid wasting tokens on unrelated conversations.

---

# 11. Agent Autonomy Rules

The agent has power, but the user stays in control.

## Can Auto-Handle

The agent may auto-handle or quickly execute:

* Clear small transactions with high confidence
* Spending summaries
* Category lookup
* Simple analysis
* App guidance
* Safe-to-spend explanations

## Needs Confirmation

The agent must ask confirmation for:

* Budget limit changes
* Budget cycle changes
* Large transactions
* Receipt imports
* Unclear categories
* Creating new categories if uncertain
* Deleting transactions
* Bulk updates
* Merging categories
* Importing many records
* Any action with low confidence

## Never Silent

The agent must never silently:

* Delete data
* Change budget cycle
* Modify many records
* Import many transactions
* Change financial settings
* Make risky assumptions

---

# 12. Budget Model

BudgetPal should support a flexible monthly budget model.

## User-Controlled Budget Cycle

The user controls the budget cycle start date.

Examples:

* Starts on the 1st of every month
* Starts on the 10th
* Starts on payday
* Custom monthly cycle

This is important because not everyone’s budget month starts on the 1st.

## Budget Inputs

User/profile budget settings:

* Monthly income
* Starting balance
* Budget cycle start day
* Currency
* Budget style
* Savings goal
* Category limits
* Notification/warning preference

## Budget Style

Budget style affects the agent tone and warning strength.

Options:

1. **Strict**
2. **Balanced**
3. **Chill**

### Strict

* Earlier warnings
* More direct advice
* Stronger focus on limits

### Balanced

* Practical and calm
* Default recommendation

### Chill

* Fewer warnings
* More flexible tone
* Warns mostly on important issues

---

# 13. Safe-to-Spend Logic

The app should calculate a simple but useful safe-to-spend amount.

Basic idea:

```text
Safe to spend today =
remaining planned spend / remaining days in current budget cycle
```

Better version considers:

* Remaining budget
* Remaining days
* Upcoming known bills
* Savings goal
* Current spending pace
* Over-budget categories
* Flexible vs fixed categories

The safe-to-spend number should appear in the Agent screen as context, not as the whole app identity.

---

# 14. Categories and Subcategories

BudgetPal should use parent categories and optional subcategories.

Default categories:

* Food & Drinks
* Transport
* Shopping
* Bills
* Subscriptions
* Health
* Education
* Entertainment
* Car
* Income
* Savings
* Other

Subcategory examples:

```text
Food & Drinks
- Groceries
- Restaurants
- Delivery
- Coffee

Transport
- Bus
- Taxi
- Fuel
- Train

Car
- Fuel
- Maintenance
- Parking
- Insurance
- Washing

Bills
- Rent
- Phone
- Electricity
- Water
- Internet

Subscriptions
- Streaming
- Software
- Apps
- Cloud services

Income
- Salary
- Gift
- Refund
- Side income
```

## Category Intelligence

The agent must understand broad user terms.

Examples:

```text
gas → Transport/Fuel or Car/Fuel
car → Car + Fuel + Maintenance + Parking + Insurance
food → Groceries + Restaurants + Delivery + Coffee
restaurants → Food & Drinks/Restaurants
phone → Bills/Phone or Shopping/Phone depending context
```

The agent should use existing categories first.

Rules:

* Match existing category if reasonable.
* Use existing parent category when possible.
* Create subcategory when useful.
* Create parent category only when clearly needed.
* Avoid duplicate messy categories.
* Suggest merging similar categories later.

AI-created categories should be marked as `ai_created = true`.

---

# 15. Time Understanding

The agent must understand flexible time ranges.

Examples:

```text
today
yesterday
this week
last week
this month
last month
last 3 months
last 8 months
this semester
this year
between March and May
since I started using the app
from June 1 to June 15
```

For vague ranges like “this semester,” the agent should either:

* Ask for clarification, or
* Use a reasonable default and explain it

Example:

```text
I’ll treat “this semester” as the last 4 months. You can change the range if needed.
```

---

# 16. Agent Result UI

Agent responses should not be only plain text.

The agent should return structured result components.

Types of result UI:

* Text answer
* Transaction confirmation card
* Receipt preview card
* Voice interpretation card
* Category breakdown card
* Spending chart card
* Warning card
* Budget update confirmation card
* Affordability card
* Report card
* Suggested actions
* Follow-up prompt chips

Example mission:

```text
Show me gas spending for the last 8 months.
```

Good result:

* Short text summary
* Total amount
* Monthly breakdown chart
* Top merchants
* Trend: increasing/decreasing
* Suggested action
* Option to generate report

---

# 17. Main Screens

## 17.1 Auth Screens

* Login
* Signup
* Forgot password if needed

Signup fields:

* First name
* Last name
* Date of birth
* Email
* Password
* Confirm password

Validation:

* First name required
* Last name required
* Date of birth required
* Date of birth cannot be in the future
* Email valid
* Password valid
* Confirm password matches

---

## 17.2 Onboarding

Onboarding should not duplicate signup fields unnecessarily.

Onboarding collects:

* Currency
* Monthly income estimate
* Starting balance
* Budget cycle start day
* Budget style
* Main financial goal
* Notification/warning preference
* Starting category limits

At the end:

```text
onboarding_completed = true
```

---

## 17.3 Agent Screen

The Agent screen is the main screen.

It includes:

* Greeting
* Agent prompt
* Text input
* Voice button
* Scan receipt button
* Upload button if needed
* Quick action chips
* Safe-to-spend snapshot
* Recent mission/result
* AI insight
* Recent warnings

---

## 17.4 Budget Screen

Budget screen includes:

* Budget cycle date
* Monthly income
* Starting balance
* Savings goal
* Category limits
* Category progress
* Edit category
* Add category
* Move budget between categories
* Over-budget categories
* AI recommendations

---

## 17.5 Activity Screen

Activity screen includes:

* Transactions list
* Filters
* Search
* Source labels: manual/text/voice/receipt/agent
* Pending confirmations
* Receipt history
* Edited transactions
* Deleted/canceled actions if logged
* Transaction details

---

## 17.6 Reports Screen

Reports screen includes:

* Generate report
* Weekly summary
* Monthly summary
* Custom date range
* Category report
* Merchant report
* Export PDF
* Report history

---

## 17.7 Profile Screen

Profile screen includes:

* First name
* Last name
* Date of birth
* Email
* Currency
* Preferred language: English by default
* Budget style
* Budget cycle settings
* Privacy
* Data export
* Notification settings
* Logout

---

# 18. UI/UX Direction

## Main Style

BudgetPal uses a **dark premium fintech** visual identity.

The app should feel like:

* A calm money command center
* A premium AI assistant
* A serious but friendly financial tool
* Modern and impressive for presentation
* Clean enough for daily use

Avoid:

* Too much neon
* Too many random gradients
* Too many charts on the first screen
* Overloaded dashboard UI
* Childish icons
* Crypto/trading app feel
* Generic bank app feel

---

# 19. Color Palette

Use one main theme: **Premium Fintech Mint**.

No light mode is required for the first version.

## Color Tokens

```ts
export const colors = {
  // Base
  background: '#080B12',
  backgroundSoft: '#0B1020',
  surface: '#101827',
  surfaceElevated: '#172033',
  surfaceGlass: 'rgba(255, 255, 255, 0.06)',
  border: '#263247',
  borderSoft: '#1D2638',

  // Text
  textPrimary: '#F7F9FC',
  textSecondary: '#AAB4C3',
  textMuted: '#6F7A8C',
  textInverse: '#071018',

  // Brand / Money
  primary: '#4ADEB2',
  primaryHover: '#35C99D',
  primarySoft: '#123C33',
  primaryGlow: 'rgba(74, 222, 178, 0.28)',

  // AI / Agent
  ai: '#6C8CFF',
  aiSoft: '#18224A',
  aiGlow: 'rgba(108, 140, 255, 0.28)',

  // Semantic
  success: '#35D399',
  successSoft: '#11392E',
  warning: '#F5B84C',
  warningSoft: '#3B2B10',
  risk: '#FF8A5C',
  riskSoft: '#3A2117',
  danger: '#FF5F6D',
  dangerSoft: '#3B171C',
  info: '#67B7FF',
  infoSoft: '#102C44',

  // Charts
  chart1: '#4ADEB2',
  chart2: '#6C8CFF',
  chart3: '#F5B84C',
  chart4: '#FF8A5C',
  chart5: '#B084FF',
  chart6: '#67D8FF',

  // Gradients
  heroGradientStart: '#10243A',
  heroGradientMiddle: '#102D2A',
  heroGradientEnd: '#080B12',
};
```

## Color Usage

### Mint / Primary

Use for:

* Main action buttons
* Safe-to-spend
* Positive budget status
* Confirmed success
* Healthy progress

### AI Blue

Use for:

* Agent messages
* Analysis cards
* Smart suggestions
* Agent status
* AI insights

### Amber

Use for:

* Warning
* Near limit
* Attention states

### Orange / Risk

Use for:

* Almost over budget
* Risky trend
* Strong warning

### Coral / Danger

Use for:

* Over budget
* Failed actions
* Critical financial issue

---

# 20. Typography

Use **Ubuntu by Dalton Maag** for all first-version app text.

Rules:

* Load with `expo-font`.
* Use theme typography tokens.
* Do not hardcode font family in random screens.
* Shared Text component should use the theme font.
* Use strong typography for money amounts and headlines.
* Keep text readable and calm.

Suggested typography tokens:

```ts
export const typography = {
  fontFamily: {
    regular: 'Ubuntu-Regular',
    medium: 'Ubuntu-Medium',
    bold: 'Ubuntu-Bold',
  },

  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 40,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    display: 46,
  },

  weight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
};
```

Future Hebrew support may use Heebo, but not now.

---

# 21. Tech Stack

## Mobile App

Use:

* React Native
* Expo SDK 54
* Expo Router
* TypeScript strict mode
* TanStack Query
* Supabase client
* Expo SecureStore
* Expo Font
* Expo Image Picker / Camera support for receipt scanning
* Expo Audio or SDK-compatible recording package for voice recording
* Reusable design system
* Centralized localization file
* Premium Fintech Mint theme

## Backend

Use:

* Next.js API backend
* TypeScript
* Zod validation
* Supabase server client
* AI SDK
* OpenAI or compatible model provider
* Server-side receipt/vision processing
* Server-side STT processing
* Server-side PDF generation

## Database/Auth/Storage

Use:

* Supabase Auth
* Supabase Postgres
* Supabase Row Level Security
* Supabase Storage for receipts/reports/uploads
* Generated Supabase TypeScript types

## AI

Use:

* AI SDK for structured outputs and agent orchestration
* OpenAI or compatible model provider for chat/action planning
* Speech-to-text for voice input
* Vision-capable model for receipts
* Structured output schemas for actions

Important:

* No AI API keys in the mobile app.
* AI calls go through backend.
* AI output must be validated before database writes.

---

# 22. Environment Variables

## Mobile `.env.local`

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=
```

## Backend `.env.local`

```env
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:

* Do not put backend secrets in the mobile app.
* Service role key must only exist on backend if needed.
* Mobile uses anon key only.
* Backend derives user ID from authenticated JWT.

---

# 23. Database Model

Use Supabase Postgres.

Core tables:

* profiles
* categories
* budgets
* budget_category_limits
* transactions
* receipts
* voice_entries
* agent_messages
* agent_actions
* reports
* notifications or warnings
* audit_logs / budget_events

---

## 23.1 Profiles

Fields:

```text
id
email
first_name
last_name
display_name
date_of_birth
preferred_language default 'en'
currency default 'ILS'
budget_style default 'balanced'
monthly_income
starting_balance
budget_cycle_start_day
main_financial_goal
onboarding_completed
notifications_enabled
created_at
updated_at
```

---

## 23.2 Categories

Fields:

```text
id
user_id
name
type
parent_category_id
monthly_limit
ai_created
is_default
created_at
updated_at
```

Category type examples:

```text
expense
income
savings
transfer
```

---

## 23.3 Budgets

Fields:

```text
id
user_id
name
currency
monthly_income
starting_balance
cycle_start_day
savings_goal
budget_style
is_active
created_at
updated_at
```

---

## 23.4 Transactions

Fields:

```text
id
user_id
amount
currency
type
merchant
title
description
category_id
subcategory_id
date
source
confidence
status
receipt_id
voice_entry_id
note
created_at
updated_at
```

Source examples:

```text
manual
text
voice
receipt
agent
import
```

Status examples:

```text
pending_review
confirmed
rejected
duplicate
deleted
```

---

## 23.5 Receipts

Fields:

```text
id
user_id
file_url
merchant
receipt_date
total_amount
currency
extracted_items
confidence
status
created_at
updated_at
```

---

## 23.6 Voice Entries

Fields:

```text
id
user_id
audio_url
transcription
interpreted_payload
confidence
status
created_at
updated_at
```

---

## 23.7 Agent Messages

Fields:

```text
id
user_id
role
content
intent
confidence
metadata
created_at
```

---

## 23.8 Agent Actions

Fields:

```text
id
user_id
message_id
action_type
payload
status
confidence
requires_confirmation
executed_at
created_at
```

Action statuses:

```text
proposed
confirmed
executed
cancelled
failed
```

---

## 23.9 Reports

Fields:

```text
id
user_id
title
type
date_from
date_to
summary
metrics
file_url
created_at
updated_at
```

---

# 24. Security Rules

Rules:

* Enable RLS on every user-owned table.
* Users can only access their own data.
* Backend derives `user_id` from JWT.
* Never trust `user_id` sent from client.
* Never expose service role key in mobile.
* Validate all API inputs with Zod.
* Validate AI outputs before writing to database.
* Use confirmation for risky changes.
* Store receipt/audio only when necessary.
* Allow users to delete their data.

---

# 25. Backend API

Recommended routes:

```text
GET    /api/health

GET    /api/profile
PATCH  /api/profile

GET    /api/budgets/current
PATCH  /api/budgets/current

GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id

GET    /api/transactions
POST   /api/transactions
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

POST   /api/agent/message
POST   /api/agent/confirm-action

POST   /api/voice/transcribe
POST   /api/receipts/scan

POST   /api/reports/generate
GET    /api/reports

POST   /api/warnings/preview
```

Every route should:

* Authenticate user
* Validate body/query params
* Derive user ID from token
* Return typed response
* Return typed errors
* Avoid leaking secrets

---

# 26. AI Agent Architecture

Agent backend flow:

```text
Receive message / voice transcription / receipt result
→ Authenticate user
→ Load user profile
→ Load relevant budget context
→ Classify intent / mission
→ Choose handler/tool
→ Produce structured action or answer
→ Validate result
→ Execute safe action or ask confirmation
→ Log agent message and action
→ Return message + cards + warnings + suggested actions
```

The agent should use structured outputs.

It must not directly write arbitrary database data.

Correct:

```text
AI proposes action
Backend validates
Backend saves
```

Wrong:

```text
AI directly writes random DB data
```

---

# 27. Agent Intents

Supported intents:

```text
casual_greeting
app_guidance
add_transaction
update_transaction
delete_transaction
scan_receipt
voice_transaction
ask_budget_summary
ask_spending_analysis
ask_saving_advice
ask_affordability
update_budget_limit
update_budget_cycle
create_category
merge_categories
generate_report
explain_warning
unclear
out_of_scope
```

The agent should classify first, then act.

Do not run transaction parsing on every message.

---

# 28. Agent Response Schema

Example:

```ts
type AgentResponse = {
  message: string;
  intent: AgentIntent;
  confidence: number;
  cards?: AgentCard[];
  actions?: AgentAction[];
  suggestedPrompts?: string[];
  warnings?: Warning[];
  requiresUserChoice?: boolean;
};
```

Agent cards:

```ts
type AgentCard =
  | TransactionPreviewCard
  | ReceiptPreviewCard
  | VoicePreviewCard
  | SpendingAnalysisCard
  | BudgetWarningCard
  | AffordabilityCard
  | ReportCard
  | ConfirmationCard;
```

Agent actions:

```ts
type AgentAction =
  | 'CREATE_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'DELETE_TRANSACTION'
  | 'CREATE_CATEGORY'
  | 'MERGE_CATEGORIES'
  | 'UPDATE_BUDGET_LIMIT'
  | 'UPDATE_BUDGET_CYCLE'
  | 'GENERATE_REPORT'
  | 'SCAN_RECEIPT'
  | 'TRANSCRIBE_VOICE'
  | 'CREATE_WARNING';
```

---

# 29. File Structure

Recommended structure:

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
    login.tsx
    signup.tsx
    onboarding.tsx
  (tabs)/
    agent.tsx
    budget.tsx
    activity.tsx
    reports.tsx
    profile.tsx
  transaction/
    new.tsx
    [id].tsx
  category/
    [id].tsx
  reports/
    [id].tsx

src/
  components/
    ui/
    cards/
    agent/
    charts/
    forms/
  features/
    auth/
    onboarding/
    agent/
    transactions/
    budgets/
    categories/
    receipts/
    voice/
    reports/
    warnings/
    profile/
  hooks/
  lib/
    supabase.ts
    apiClient.ts
    i18n.ts
    currency.ts
    dates.ts
  services/
    agent/
    voice/
    receipts/
    reports/
    warnings/
  theme/
    colors.ts
    typography.ts
    spacing.ts
    radius.ts
    ThemeProvider.tsx
  locales/
    en.json
  types/
    database.ts
    api.ts
    agent.ts

backend/
  app/
    api/
  lib/
    supabaseServer.ts
    ai.ts
    auth.ts
    validation.ts
  services/
    agent/
    receipts/
    voice/
    reports/

supabase/
  migrations/
  README.md

tests/
  fixtures/
    agent-inputs.json
    receipt-samples.json
```

---

# 30. Design System Components

Core components:

* Screen
* Text
* Button
* Input
* Card
* MoneyAmount
* ProgressBar
* IconButton
* Chip
* BottomSheet
* Modal
* WarningCard
* InsightCard
* AgentMessage
* AgentInputBar
* QuickActionChip
* TransactionCard
* TransactionPreviewCard
* ReceiptPreviewCard
* VoicePreviewCard
* SpendingAnalysisCard
* AffordabilityCard
* ReportCard
* CategoryBudgetCard
* ConfirmationCard

Rules:

* Use theme tokens.
* Use typography tokens.
* Use reusable components.
* Do not hardcode colors.
* Do not hardcode fonts.
* Do not hardcode user-facing strings.
* Keep UI premium and clean.

---

# 31. Presentation Demo Flow

The final presentation should show why BudgetPal is different.

Demo flow:

```text
1. Open app.
2. Agent-first screen appears: “What should we handle today?”
3. User speaks a messy expense.
4. BudgetPal transcribes and interprets it.
5. User confirms transaction.
6. Budget updates.
7. User scans a receipt.
8. BudgetPal extracts merchant, date, amount, category.
9. User confirms receipt import.
10. User asks: “Show me car spending for the last 8 months.”
11. BudgetPal shows total, monthly breakdown, and explanation.
12. User asks: “Can I afford headphones for 300?”
13. BudgetPal checks safe-to-spend and gives advice.
14. User asks: “Generate my monthly report.”
15. BudgetPal creates a report summary with charts and tips.
```

This demo proves:

* Agent-first interaction
* Voice understanding
* Receipt scanning
* Real analysis
* Real budget updates
* Smart advice
* Visual results

---

# 32. Future Features

Only these should be treated as future expansion:

* Multilingual support
* Widgets
* Shared/family budgets
* Push notifications if not completed in time

Voice input and receipt scanning are not future-only. They are part of the presentation-ready product.

---

# 33. Development Phases

## Phase 1 — Foundation and Agent-First Shell

Build:

* Expo SDK 54 app
* Expo Router
* TypeScript strict
* Premium Fintech Mint theme
* Ubuntu font
* Localization-ready English strings
* Auth screens
* Onboarding
* Agent-first tab layout
* Agent Command Center UI
* Basic Supabase client
* Basic backend skeleton
* Placeholder cards for agent results

## Phase 2 — Database and Core Budget Data

Build:

* Supabase schema
* RLS policies
* Profile table
* Budget table
* Categories
* Transactions
* Agent messages/actions
* Receipts
* Voice entries
* Reports
* Default categories
* Signup metadata
* Generated DB types

## Phase 3 — Transactions and Budget Engine

Build:

* Manual transaction CRUD
* Category matching
* Budget cycle logic
* Safe-to-spend calculation
* Category progress
* Warning levels
* Activity screen
* Budget screen

## Phase 4 — Agent Missions

Build:

* `/api/agent/message`
* Intent router
* Natural transaction input
* Spending analysis
* Saving advice
* Affordability checks
* Budget modifications with confirmation
* Category creation
* Agent result cards
* Agent action logging

## Phase 5 — Voice Input

Build:

* Mic UI
* Audio recording
* Backend STT
* Voice interpretation
* Voice preview card
* Confirm/edit/cancel flow
* Save transaction from voice

## Phase 6 — Receipt Scanning

Build:

* Camera/image upload
* Backend receipt extraction
* Merchant/date/total/category extraction
* Receipt preview card
* Duplicate detection
* Confirm/edit/cancel flow
* Save transaction from receipt

## Phase 7 — Reports

Build:

* Weekly report
* Monthly report
* Custom report
* AI summary
* Category breakdown
* Merchant breakdown
* PDF export

## Phase 8 — Polish and Demo Readiness

Build:

* Animations
* Loading states
* Empty states
* Error states
* Better charts
* Better confirmations
* Demo seed data
* Final UI polish
* Accessibility pass
* Performance pass

---

# 34. Quality Rules

The app must:

* Be agent-first
* Use Premium Fintech Mint theme
* Use Ubuntu typography
* Use Expo SDK 54
* Use TypeScript strict mode
* Use Supabase with RLS
* Use backend for AI calls
* Validate API inputs with Zod
* Validate AI outputs
* Never trust client user_id
* Never expose service role key in mobile
* Keep user in control for risky actions
* Support voice input
* Support receipt scanning
* Support spending analysis
* Support budget modification with confirmation
* Support reports
* Avoid unrelated chatbot behavior
* Avoid boring dashboard-first UX
* Avoid hardcoded UI strings
* Avoid hardcoded styling
* Be polished enough for a university final presentation

---

# 35. Implementation Instructions for Claude Code / Cursor / Antigravity

When implementing this project:

1. Read this entire brief first.
2. Treat this as a fresh project.
3. Build BudgetPal as an agent-first app.
4. Do not make the dashboard the main experience.
5. Use the official title: `BudgetPal: Personal Budget Agent`.
6. Use the Premium Fintech Mint color palette.
7. Use Ubuntu typography.
8. Use English only for now, but keep localization-ready structure.
9. Use React Native with Expo SDK 54.
10. Use Supabase for auth/database/storage.
11. Use a backend API for AI and sensitive logic.
12. Do not place AI keys or service role keys in the mobile app.
13. Build voice input and receipt scanning as presentation-ready features.
14. Keep future features limited to multilingual, widgets, shared/family budgets, and maybe push notifications.
15. Always validate AI actions before writing to database.
16. Ask confirmation before risky actions.
17. Stop after each phase and report:

    * files changed
    * commands to run
    * environment variables needed
    * manual test steps
    * blockers
18. Always run:

    * `npm install`
    * `npx expo install --fix`
    * `npx expo-doctor`
    * `npx tsc --noEmit`

---

# 36. Final Product Definition

BudgetPal should not be:

```text
A finance dashboard where users manually enter numbers and interpret charts alone.
```

BudgetPal should be:

```text
An agent-first personal budget app where users ask, speak, scan, or upload, and the agent understands, acts, updates, explains, and guides.
```

The final app should be impressive enough for a university final project presentation and practical enough for a real person to use daily.
