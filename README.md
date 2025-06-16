# 🧠 DisasterOps - AI-Powered Disaster Response Coordination (Backend)

DisasterOps is a backend system designed to enable intelligent coordination and communication during disaster events using an AI-agentic workflow. It uses Node.js with Firebase Realtime Database and LLMs to process multimodal requests, prioritize tasks, and assist multiple user roles.

This backend handles request parsing, task assignment, agent-based decision-making, and sync functionalities to ensure real-time, efficient disaster response operations.

---

## ✨ Features

- **AI Agentic Workflow**: Dynamic decision-making using lightweight rules or LLMs.
- **Multimodal Request Handling**: Accepts text and image-based requests.
- **Task Prioritization**: Based on urgency, location, and resource availability.
- **Real-Time Updates**: For responders and admins via Firebase integration.
- **Offline Sync Support**: Enables local caching and automatic resync on reconnect.
- **Secure Role-Based Access**: Supports First Responders, Volunteers, Citizens, and Admins.

---

## 🧰 Technologies

| Category               | Stack                             |
|------------------------|------------------------------------|
| Backend Framework      | Node.js (ESM) + Express            |
| Database               | Firebase Realtime Database         |
| Auth                   | Firebase Auth                      |
| AI Integration         | OpenAI API / Custom Agents         |
| Cloud Functions (opt.) | Firebase / Vercel (optional)       |
| Data Formats           | JSON / Base64 (for images)         |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── ai/                # Agent logic (LLMs, scoring, assignment)
│   ├── routes/            # Express route handlers
│   ├── utils/             # Helper functions
│   ├── FirebaseRealtimeStore.js  # Database abstraction layer
│   ├── config.js          # Firebase/service key setup
│   └── server.js          # App entrypoint
├── firebaseServiceAccountKey.json
├── package.json
└── README.md              # This file
```
