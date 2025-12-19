# CodeBattle<img width="50" height="50" alt="logo" src="https://github.com/user-attachments/assets/af190251-fede-4423-b0fd-b92aac03842e" />


## Real-Time 1v1 Competitive Coding Platform  
**Built on Motia — One Primitive. Infinite Scalability.**

CodeBattle transforms competitive programming from a solitary grind into a **live, high-stakes 1v1 e-sport**.  
Unlike traditional platforms where problems are solved asynchronously, CodeBattle enables **synchronous duels** where speed, accuracy, and strategy determine the winner in real time.

---

## 🚀 Why CodeBattle?

### The Problem
Most coding platforms (LeetCode, HackerRank):
- Are **static**
- Promote **solitary problem solving**
- Lack **real-time pressure**
- Use asynchronous leaderboards

### The Solution
CodeBattle brings the **adrenaline of esports** into competitive programming with:
- Live 1v1 battles
- Server-authoritative timing
- Real-time spectators
- AI-powered post-match analysis

### The Tech
A **latency-sensitive, event-driven backend** that orchestrates:
- Matchmaking race conditions
- Secure code execution
- AI analysis  
—all simultaneously using Motia.

---

## ✨ Features

### 🎯 Core Capabilities
- **Real-Time 1v1 Duels**  
  Server-authoritative match lifecycle with synchronized clocks.

- **Live Code Execution**  
  Secure, sandboxed remote execution via **Piston (Docker-based)**.

- **Spectator Mode**  
  Real-time state replication to observers via **Motia Streams**.

---

### 🤖 AI-Powered Referee (Gemini 2.5)
- **Instant Code Analysis**  
  Goes beyond “Accepted / Rejected” to analyze program logic.

- **The Coach Persona**  
  Acts as an *ICPC World Finalist Coach*:
  - Time Complexity comparison (`O(N)` vs `O(N²)`)
  - Edge case detection
  - Optimization suggestions

---

### 🔧 Technical Depth
- **Atomic Matchmaking**  
  Handles high-concurrency join requests using **MongoDB atomic operators + Motia event locks**.

- **Unified Observability**  
  Distributed tracing and step-level logging out of the box.

---

## 🏗️ Architecture Overview

CodeBattle uses **Motia Steps** to orchestrate APIs, background jobs, AI agents, and real-time streams — all within a single runtime.

```mermaid
graph TD
    User[Client] -->|HTTP POST| API[MatchAPI Step]
    API -->|Event: player.joined| Engine[GameEngine Step]

    subgraph "Motia Unified Runtime"
        Engine -->|Event: run.code| Runner[CodeRunner Step]
        Runner -->|Docker Exec| Piston[Piston Engine]
        Runner -->|Event: code.processed| Engine

        Engine -->|Event: analyze.code| Referee[AiReferee Step]
        Referee -->|Gemini API| AI[Gemini 2.5]

        Engine -->|Stream Update| Stream[MatchStream]
    end

    Stream -->|Real-time Updates| User
````

---

## 🏅 The Motia Advantage

We built CodeBattle to **push the limits of Motia**, a backend framework that treats **Steps** as the core architectural primitive.

### How Motia Supercharged Our Infrastructure

#### 🔻 Collapsed the Stack

**Before**

* Express (API)
* Redis (Pub/Sub)
* Celery (Workers)
* Socket.io (WebSockets)

**With Motia**

* One API step
* One event-driven engine
* One stream step
  Motia handled the glue code automatically.

---

#### ⚡ Zero-Config Event Bus

* Communication between steps uses simple `emit()` calls
* No RabbitMQ, Kafka, or Redis setup
* Built-in event routing handled by Motia

---

#### 👁️ Visual Debugging

* Built-in dashboard visualizes match flow:
  `player.joined → match.started → game.over`
* Critical for debugging race conditions during the hackathon

---

### 🧩 Architecture Comparison

| Feature       | Traditional Microservices | CodeBattle (Motia)    |
| ------------- | ------------------------- | --------------------- |
| API Layer     | Express / FastAPI         | `match-api.step.ts`   |
| Game State    | Redis / Memcached         | `game-engine.step.ts` |
| Job Queue     | Celery / SQS              | `code-runner.step.ts` |
| Real-Time     | Socket.io Server          | `match.stream.ts`     |
| AI Processing | External Worker           | `ai-referee.step.ts`  |

---

## 🔄 Match Lifecycle

1. **Match Creation**
   User initiates → `MatchAPI` persists state → waits for peer.

2. **Atomic Join**
   Opponent joins → MongoDB atomic update ensures no 3rd player → emits `player.joined`.

3. **Game Loop**
   `GameEngine` validates ready state → starts sync timer → emits `match.started`.

4. **Submission**
   Code received → `CodeRunner` executes in sandbox → verdict returned.

5. **AI Analysis**
   Post-match, **AiReferee (Gemini)** reviews code asynchronously and streams feedback.

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+
* MongoDB (Local or Atlas)
* Motia CLI

---

### 1️⃣ Clone & Install

```bash
git clone https://github.com/sambhandavale/code-battle.git

# Backend
cd battle-engine
npm install

# Frontend
cd ../battle-frontier
npm install
```

---

### 2️⃣ Environment Setup

Create a `.env` file in **both directories**.

#### `battle-engine/.env`

```env
MONGO_URI=mongodb://localhost:27017/codebattle
GEMINI_API_KEY=your_gemini_key_here
MOTIA_SECRET=dev_secret
```

#### `battle-frontier/.env`

```env
ENV=dev
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:2000
NEXT_PUBLIC_WS_GATEWAY_URL=ws://localhost:2000
```

---

### 3️⃣ Run the Project

#### Terminal 1 — Backend

```bash
cd battle-engine
npm run dev
# Motia Dashboard: http://localhost:3000
```

#### Terminal 2 — Frontend

```bash
cd battle-frontier
npm run dev
# App: http://localhost:2000 (or 3001 based on config)
```

---

## 🛠️ Tech Stack

* **Orchestration:** Motia
* **Runtime:** Node.js 18+ (TypeScript)
* **Database:** MongoDB
* **Execution Engine:** Piston (Dockerized)
* **AI:** Google Gemini 2.5 Flash
* **Frontend:** Next.js, Tailwind CSS, Monaco Editor

---

## 🤖 AI Tools Declaration

As per hackathon rules:

* **Development Assistance**
  ChatGPT was used for initial boilerplate generation (MongoDB queries, CSS scaffolding).

* **In-Game Feature**
  Google Gemini 2.5 is used explicitly as a feature (**The AI Referee**) and was **not** used to generate core business logic.

---

## ❤️ Built For Backend Reloaded 2025

**One runtime. One primitive. Infinite possibilities.**
