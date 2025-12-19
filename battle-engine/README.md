This README focuses on the Motia architecture, the Steps, and the event logic.

# ⚙️ CodeBattle Engine (Backend)

**The Event-Driven Core of CodeBattle**
*Powered by Motia • Piston • MongoDB • Gemini*

This directory contains the server-side logic for CodeBattle. It utilizes **Motia** to replace a traditional microservices stack (API Gateway + Redis + Workers) with a unified "Steps" architecture.

---

## What is Motia?

Motia is an open-source, unified backend framework that eliminates runtime fragmentation by bringing **APIs, background jobs, queueing, streaming, state, workflows, AI agents, observability, scaling, and deployment** into one unified system using a single core primitive, the **Step**.

---

## 🏗️ Architecture

The backend is composed of discrete **Steps** that communicate via events.

<img width="1493" height="567" alt="Screenshot 2025-12-19 194848" src="https://github.com/user-attachments/assets/b169e1b1-a3e9-477b-99cd-83d53b186458" />

### 📂 File Structure Explained (`src/`)

Based on `src/steps` and `src/models`:

| Directory | File | Description |
| :--- | :--- | :--- |
| **📂 steps** | `match-api.step.ts` | **Entry Point:** HTTP API for creating/joining matches and submitting code. |
| | `game-engine.step.ts` | **The Brain:** Manages game state (`WAITING` → `RACING` → `FINISHED`) and determines winners. |
| | `code-runner.step.ts` | **The Worker:** Async listener that sends code to the Piston sandbox (Docker). |
| | `ai-referee.step.ts` | **The Intel:** Sends completed code to Google Gemini for O(N) complexity analysis. |
| | `match-timer.step.ts` | **The Clock:** Handles match duration and auto-expiration events. |
| | `match.stream.ts` | **The Broadcast:** Pushes real-time state updates to the frontend via WebSockets. |
| **📂 models** | `Match.ts` | MongoDB schema for match state, players, and winners. |
| | `Question.ts` | Database of algorithm problems and test cases. |
| **📂 utils** | `lang.ts` | Mappings between frontend language IDs and Piston runtime versions. |

---

## 🚀 Setup & Run

### 1. Prerequisites
* Node.js 18+
* MongoDB Running (Local or Atlas)
* Motia CLI (optional, but recommended)

### 2. Install Dependencies
```bash
cd battle-engine
npm install

```

### 3. Environment Variables

Create a `.env` file in `battle-engine/`:

```env
MONGO_URI=mongodb://localhost:27017/codebattle
GEMINI_API_KEY=your_gemini_key_here

```

### 4. Run the Engine

```bash
npm run dev

```

* **API URL:** `http://localhost:3000`
* **Motia Dashboard:** `http://localhost:3000` (Great for visualizing the event flow!)

---

## 🛠️ Key Technologies

* **Framework:** [Motia](https://www.google.com/search?q=https://github.com/motia/motia) (Event Orchestration)
* **Database:** MongoDB (Mongoose)
* **Execution:** Piston (Remote Code Execution API)
* **AI:** Google Gemini 2.5 Flash

---

## 🏆 Backend Reloaded Context

This engine demonstrates how **Motia Steps** allow us to handle:

1. **Race Conditions:** Atomic joins in `match-api`.
2. **Async Processing:** Non-blocking code execution in `code-runner`.
3. **Real-Time Data:** Streaming updates via `match.stream`.
All within a single TypeScript runtime.
