# DisasterOps – Backend

This is the **backend** service for **DisasterOps**, an AI-powered disaster response coordination platform. It provides APIs for submitting help requests, task assignment, user authentication, and real-time updates.

The backend is built with **Node.js** and **Express**, and integrates with **Firebase** services for database operations, authentication, storage, and more. AI agent logic (e.g., prioritization, assignment) is handled separately in the AI repository and consumed via API or logic hooks.

## Key Features

-  RESTful API built with Express
-  Firebase Authentication (role-based: Admin, Responder, Volunteer, Affected)
-  AI integration via external service (separate AI repo)
-  Realtime support for tasks, users, and resources
-  Sync support for offline devices
-  Modular and scalable structure for easy maintenance


## Technologies Used

| Component         | Tech                                     |
|------------------|-------------------------------------------|
| Runtime           | Node.js                                  |
| Framework         | Express.js                               |
| Main Database    | Firebase Firestore                        |
| Realtime Support | Firebase Realtime Database    |
| Authentication    | Firebase Auth          |
| AI Logic          | External AI Agent API (maintained in a separate repository)|


## Folder Structure

```
backend/
├── src/
│   ├── routes/                     # API route handlers (e.g., /requests, /users)
│   ├── controllers/                # Logic for handling requests
│   ├── services/                   # Firebase operations, data handling
│   ├── middlewares/                # Auth, error handling, etc.
│   ├── utils/                      # Utility functions
│   ├── FirebaseRealtimeStore.js    # Central DB wrapper
│   ├── config.js                   # Firebase and environment configs
│   └── server.js                   # Main Express app
├── package.json
├── .env.example
└── README.md
```

##  Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/DisasterOpsAI/disasterops-core-api.git
cd disasterops-core-api
```

### 2. Install Dependencies
```
pnpm install
```

### 3. Start the Server
```
pnpm dev
```

## Development Commands
```
pnpm run dev      # Run with nodemon
pnpm run lint     # Lint your code using ESLint
pnpm run format   # Format using Prettier (optional)
```

## Contributing

We welcome contributions! Please:

- Fork the repo
- Create a feature branch
- Follow the linting/formatting conventions
- Open a pull request


## License

MIT – See `LICENSE` file for details.
