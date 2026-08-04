# BudgetPal

> **AI-first personal finance platform that transforms budgeting into a natural conversation.**

BudgetPal is a cross-platform mobile application that combines conversational AI, voice interaction, receipt scanning, intelligent financial analysis, and real-time budgeting into a single experience.

Instead of navigating traditional budgeting dashboards and manually categorizing transactions, users simply talk to BudgetPal. The AI understands intent, prepares actions, explains financial impact, and keeps users in control through transparent confirmation workflows.

> **Final B.Sc. Capstone Project**

---

## Features

- AI-powered conversational budgeting
- Voice input and spoken responses
- Receipt scanning and transaction extraction
- Smart budgeting with category tracking
- Spending analytics and financial insights
- PDF report generation
- Notifications and reminders
- Localization support
- Supabase backend
- Cross-platform mobile application (Expo + React Native)

---

## Tech Stack

### Mobile
- React Native
- Expo
- TypeScript

### Backend
- Supabase
- API Routes
- PostgreSQL

### AI

- OpenAI
- Natural Language Processing
- Intelligent transaction parsing

### State Management

- TanStack React Query

### Tooling

- Expo Router
- Zod
- Git
- ESLint

---

## Architecture

```
                User
                  │
      ┌───────────▼───────────┐
      │ React Native / Expo   │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │ AI Conversation Layer │
      └───────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    OpenAI API         Supabase Backend
                            │
                            ▼
                     PostgreSQL Database
```

---

## Project Structure

```text
app/
components/
hooks/
services/
lib/
supabase/
assets/
scripts/
docs/
```

---

## Getting Started

```bash
git clone https://github.com/b14ckPanther/BudgetPal.git
cd BudgetPal
npm install
```

Create a `.env` file with your required environment variables (Supabase credentials, OpenAI API key, and any other project-specific configuration).

Run the development server:

```bash
npx expo start
```

---

## Design Philosophy

BudgetPal was designed around an **agent-first** interaction model.

Instead of asking users to learn the software, the software adapts to how users naturally communicate. Voice, text, and receipt images become structured financial actions while preserving transparency and user confirmation.

---

## Engineering Highlights

- Modular component architecture
- Reusable services layer
- Strong TypeScript usage
- Supabase-backed persistence
- AI-assisted financial workflows
- Automation scripts for demos and validation
- Mobile-first user experience

---

## Roadmap

- Multi-device synchronization
- Investment portfolio support
- Bank integrations
- Smarter financial planning agents
- Enhanced analytics dashboard

---

## License

This repository is provided for portfolio and educational purposes.
