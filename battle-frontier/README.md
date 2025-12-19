This README focuses on the Next.js application, the real-time hook and Motia backend integration, and the UI components.

# ⚔️ CodeBattle Frontier (Frontend)

**The Arena for CodeBattle**
*Built with Next.js 14 • Tailwind CSS • Monaco Editor*

This is the client-side application for CodeBattle. It connects to the `battle-engine` using Motia Streams to render real-time code duels, live timer updates, and AI feedback.

---

## 📂 File Structure Explained

Based on the project structure:

| Directory | Component | Description |
| :--- | :--- | :--- |
| **📂 app/battle** | `live/[id]/page.tsx` | **The Arena:** The main game page. Handles the layout for the code editor, problem statement, and opponent status. |
| **📂 hooks** | `useMatchStream.ts` | **Real-Time Core:** Custom hook that connects to the backend `MatchStream`. It listens for `PLAYER_JOINED`, `START_RACE`, and `GAME_OVER` events. |
| **📂 components** | `battle/` | UI components specific to the duel (Timer, OutputConsole, SubmissionButton). |
| | `shared/MatchModel.ts` | Shared TypeScript interfaces ensuring frontend/backend type safety. |
| **📂 providers** | `motiaProvider.tsx` | Wraps the application to provide global access to the Motia stream client. |
| **📂 lib/services** | `apiRequests.ts` | Standard HTTP fetchers for `create match`, `join match`, and `submit code` endpoints. |

---

## 🚀 Setup & Run

### 1. Prerequisites
* Node.js 18+
* `battle-engine` must be running locally.

### 2. Install Dependencies
```bash
cd battle-frontier
npm install

```

### 3. Environment Variables

Create a `.env` file in `battle-frontier/`:

```env
# URL of the battle-engine
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_WS_GATEWAY_URL=ws://localhost:3000
ENV=dev

```

### 4. Run the Client

```bash
npm run dev

```

Open [http://localhost:2000](https://www.google.com/search?q=http://localhost:2000) (or whichever port Next.js assigns).

---

## ✨ Features

* **Live Monaco Editor:** Professional-grade code editing with syntax highlighting.
* **Stream Visualization:**
* Updates immediately when an opponent joins.
* Shows live "Running..." status when opponent submits code.


* **AI Feedback UI:** Displays the Markdown analysis from the AI Referee in a clean, readable format.
* **Responsive Design:** Built with Tailwind CSS for rapid UI development.

---

## 🔌 Integration Logic

The frontend communicates with the backend in two ways:

1. **Actions (HTTP):**

| Method | Endpoint | Description |
|------|---------|-------------|
| `POST` | `/match/create` | Creates a new match and waits for an opponent to join |
| `POST` | `/match/join` | Joins an existing match using a match ID |
| `POST` | `/match/run` | Runs code against sample test cases (test execution) |
| `POST` | `/match/submit` | Submits the final solution for evaluation |
| `POST` | `/match/analyze` | Triggers AI-powered post-match code analysis |
| `GET` | `/match/:matchId` | Fetches the current status of a specific match |


2. **Reactivity (Motia Streams):**
* The `useMatchStream` hook maintains a WebSocket connection.
* It updates the local React state whenever the `GameEngine` emits a state change.
