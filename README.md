# AI Medical Voice Agent - Architecture & Project Overview

## 1. Project Overview
The AI Medical Voice Agent is a web-based telehealth platform that allows users to consult with specialized AI doctors (e.g., General Physician, Cardiologist, Pediatrician) via real-time voice conversations. It uses Large Language Models (LLMs) and WebRTC voice streaming to simulate a natural, empathetic medical consultation, eventually generating a summarized medical report of the session.

## 2. Problem Statement
Accessing specialized medical advice quickly can be expensive and time-consuming. Patients often struggle to interpret mild symptoms or decide if a doctor's visit is necessary. This project solves this by providing instant, 24/7 preliminary voice-based consultations with specialized AI agents, reducing anxiety and providing actionable early health insights.

## 3. Complete Architecture
- **Client (Browser):** Next.js App Router (React) frontend handling UI and WebRTC voice streams.
- **Identity Provider:** Clerk for secure authentication.
- **Voice / AI Engine:** Vapi Web SDK managing the WebRTC connection, orchestrating Deepgram (Speech-to-Text), OpenAI (LLM processing), and OpenAI/PlayHT (Text-to-Speech).
- **Backend (API):** Next.js Serverless API Routes handling business logic.
- **Database Layer:** Drizzle ORM connecting to a Neon Serverless PostgreSQL database.

## 4. End-to-End Call Flow
1. **Initiation:** User enters symptoms; OpenAI suggests 2 relevant specialist AI doctors.
2. **Selection:** User picks a doctor; a new session is created in the DB.
3. **Connection:** Frontend initializes Vapi SDK with the selected doctor's system prompt and Voice ID.
4. **Conversation:** 
   - User speaks → Deepgram transcodes to text.
   - Text goes to OpenAI GPT-3.5 → LLM generates medical response.
   - Response goes to TTS (OpenAI/PlayHT) → Audio streams back to the user via WebRTC.
5. **Termination:** Call ends; backend triggers GPT-3.5 to generate a structured medical report based on the transcript and saves it to the DB.

## 5. Tech Stack & Rationale
- **Next.js (App Router):** Unified full-stack framework for React UI and serverless APIs.
- **Tailwind CSS & Shadcn UI:** Rapid, accessible, and responsive UI styling.
- **Clerk:** Effortless, secure drop-in authentication.
- **Vapi:** Handles complex WebRTC voice-AI orchestration, reducing latency.
- **OpenAI (GPT-3.5-turbo):** High-quality medical reasoning and report generation.
- **Neon DB (PostgreSQL) + Drizzle ORM:** Serverless, highly scalable relational database with type-safe queries.

## 6. Database Design
**PostgreSQL Tables:**
- `users`: `id`, `name`, `email` (Unique), `credits`, `createdAt`
- `sessionChatTable`: `id`, `sessionId` (UUID), `notes` (initial symptoms), `selectedDoctor` (JSON), `conversation` (JSON), `report` (JSON), `createdBy` (FK to users.email), `createdon` (Timestamp)

## 7. API Flow
- `POST /api/suggest-doctors`: Takes user symptoms → GPT-3.5 → Returns recommended doctor IDs.
- `POST /api/session-chat`: Creates a new session UUID and inserts the initial record into the DB.
- `GET /api/session-chat`: Fetches past sessions for a user (or a specific session).
- `POST /api/medical-report`: Takes the call transcript → GPT-3.5 → Generates structured JSON report → Updates DB.

## 8. Authentication & Authorization
- **Provider:** Clerk.
- **Flow:** Middleware (`middleware.ts`) protects all routes except `/sign-in` and `/sign-up`. APIs verify the user context via `currentUser()` before interacting with the database.

## 9. Frontend Flow
`Landing Page` → `Sign In` → `Dashboard` (History List) → `Add Session` (Enter Symptoms) → `Suggest Doctors` → `Medical Agent Page` (Voice Interface) → `End Call` → `View Report Dialog`.

## 10. Backend Flow
Requests are intercepted by Next.js API routes (`app/api/*`). The API authenticates via Clerk, executes business logic (e.g., calling OpenAI), interacts with Neon via Drizzle, and returns JSON to the client.

## 11. Deployment Architecture
- **Frontend/APIs:** Vercel (Edge/Serverless functions).
- **Database:** Neon (Serverless Postgres).
- **Voice Orchestration:** Vapi's managed cloud infrastructure.
- **Auth:** Clerk's managed cloud.

## 12. Scalability
- **Compute:** Next.js APIs on Vercel scale automatically to zero or infinity based on traffic.
- **Database:** Neon DB separates storage and compute, allowing instant scaling of connections.
- **Voice:** Offloading the heavy lifting (WebRTC, STT, TTS, LLM) to Vapi ensures the Next.js server isn't bottlenecked by persistent socket connections.

## 13. Security
- Route and API protection via Clerk.
- Row-level isolation in API queries (users can only fetch `sessionChatTable` where `createdBy` matches their email).
- Sensitive API keys (OpenAI, Vapi Secret) are kept server-side.

## 14. Challenges Faced
- **WebRTC Race Conditions:** Ensuring the Vapi instance was properly instantiated and cleaned up without duplicate SDK instances (e.g., KrispSDK duplication).
- **Voice Provider Stability:** Legacy PlayHT voices occasionally timed out. Resolved by using OpenAI TTS as the primary provider with PlayHT as a fallback within Vapi's fallback plan.
- **Data Serialization:** Handling JSON coercion from Postgres (e.g., parsing stringified IDs back to numbers) to correctly map Doctor Voice IDs.

## 15. Optimizations
- **Edge Routing:** Used Vapi to keep latency under 800ms for voice responses.
- **JSON Structured Output:** Enforced strict JSON structures for GPT-3.5 during report generation to ensure frontend components render flawlessly without parsing errors.

## 16. Future Improvements
- Implement RAG (Retrieval-Augmented Generation) using vector databases (like Pinecone) to ground the AI in verified medical literature.
- Add multi-language support.
- Implement WebSockets for real-time transcript streaming to the database rather than passing the whole array at the end of the call.

---

## 17. Interview Questions & Answers

**Q1: Why did you use Vapi instead of building WebRTC + WebSockets yourself?**
*Answer:* Building a custom voice pipeline requires handling WebRTC signaling, STT streaming, LLM token streaming, and TTS synthesis concurrently. Vapi abstracts this orchestration, significantly reducing latency, handling interruptions (barge-in), and allowing me to focus on business logic and UI.

**Q2: How do you ensure the AI doesn't give dangerous medical advice?**
*Answer:* We heavily engineered the system prompt (`agentPrompt`) to enforce boundaries. The AI is instructed to provide preliminary advice only, refuse to prescribe medication, and always advise the user to consult a real human doctor for emergencies. (Future improvement: adding a moderation layer).

**Q3: How does your database handle the unstructured data of conversations?**
*Answer:* We use PostgreSQL's native `JSON` columns in Drizzle ORM for fields like `report` and `conversation`. This gives us the flexibility of NoSQL (dynamic schema for AI outputs) while maintaining the ACID compliance and relational integrity of SQL for users and sessions.

**Q4: How did you debug the issue where the call would immediately disconnect?**
*Answer:* I traced the Vapi event listeners (`call-start-failed` and `call-end`). I discovered the Voice ID being passed to Vapi was invalid because of a string/number type mismatch during JSON deserialization from the database. Fixing the type coercion and adding a fallback TTS provider resolved it.

**Q5: How is authentication managed securely?**
*Answer:* We use Clerk. The frontend uses Clerk's React context to manage sessions, while the backend APIs use `currentUser()` to verify the JWT on the server side. Database queries explicitly filter by the user's email to prevent horizontal privilege escalation (IDOR).
