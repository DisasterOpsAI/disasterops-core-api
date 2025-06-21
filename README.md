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
my-express-backend/
├── src/
│   ├── config/
│   │   ├── index.js               # Loads env, selects provider adapters
│   │   └── providers.js           # Maps CLOUD_PROVIDER to adapter modules
│   │
│   ├── common/
│   │   ├── logger/                # Winston or similar
│   │   └── errors/                # Custom error classes
│   │
│   ├── adapters/                  # Provider-specific implementations
│   │   ├── database/
│   │   │   ├── firebaseDb.js      # Firebase Realtime Database adapter
│   │   │   └── mongoDb.js         # MongoDB adapter (example)
│   │   └── storage/
│   │       ├── firebaseStorage.js
│   │       └── s3Storage.js       # AWS S3 adapter example
│   │
│   ├── domain/                    # Feature modules
│   │   ├── users/
│   │   │   ├── users.model.js
│   │   │   ├── users.service.js
│   │   │   ├── users.controller.js
│   │   │   └── users.routes.js
│   │   └── posts/
│   │       ├── posts.model.js
│   │       ├── posts.service.js
│   │       ├── posts.controller.js
│   │       └── posts.routes.js
│   │
│   ├── interfaces/                # Abstractions for adapters
│   │   ├── IDatabaseService.js
│   │   └── IStorageService.js
│   │
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   │
│   ├── routes/
│   │   └── index.js               # Main router mounting feature routes
│   │
│   ├── app.js                     # Express app setup
│   └── server.js                  # Starts HTTP server
│
├── tests/                         # Unit & integration tests
│   ├── unit/
│   └── integration/
│
├── .env.example
├── package.json
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

The Unlicense – See LICENSE file for details.
