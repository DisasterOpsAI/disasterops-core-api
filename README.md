# DisasterOps – Backend

This is the **backend** service for **DisasterOps**, an AI-powered disaster response coordination platform. It p### Available Serverless Commands

All serverless commands are available through pnpm scripts:

```bash
# Local development and testing
pnpm run sls:offline    # Run serverless locally (starts at localhost:3000)
pnpm run sls:invoke     # Test specific functions locally
pnpm run sls:info       # View serverless service information
pnpm run sls:logs       # View function logs in real-time
pnpm run sls:print      # Print the compiled CloudFormation template

# Deployment
pnpm run deploy         # Deploy to AWS Lambda (prod dependencies + clean deploy)
``` for submitting help requests, task assignment, user authentication, and real-time updates.

The backend is built with **Node.js** and **Express**, and integrates with **Firebase** services for database operations, authentication, storage, and more. AI agent logic (e.g., prioritization, assignment) is handled separately in the AI repository and consumed via API or logic hooks.

## Key Features

- RESTful API built with Express
- Firebase Authentication (role-based: Admin, Responder, Volunteer, Affected)
- AI integration via external service (separate AI repo)
- Realtime support for tasks, users, and resources
- Sync support for offline devices
- Modular and scalable structure for easy maintenance

## Technologies Used

| Component        | Tech                                                        |
| ---------------- | ----------------------------------------------------------- |
| Runtime          | Node.js                                                     |
| Framework        | Express.js                                                  |
| Main Database    | Firebase Firestore                                          |
| Realtime Support | Firebase Realtime Database                                  |
| Authentication   | Firebase Auth                                               |
| AI Logic         | External AI Agent API (maintained in a separate repository) |

## Folder Structure

```
disasterops-core-api/
├── .env.example
├── .gitignore
├── .prettierrc
├── Dockerfile
├── eslint.config.mjs
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── README.md
├── serverless.yml
├── .github/
│   ├── labeler.yml
│   └── workflows/
│       ├── dependency-review.yml
│       ├── docker-image.yml
│       ├── greetings.yml
│       ├── label.yml
│       ├── manual.yml
│       ├── serverless-deploy.yml
│       ├── stale.yml
│       └── summary.yml
├── api-tests/
│   └── DisasterOps Core API/
│       ├── bruno.json
│       └── Main.bru
├── archive/
│   ├── index.cjs
│   └── webpack.config.js
└── src/
    ├── app.js
    ├── index.js
    ├── server.js
    ├── config/
    │   ├── firebaseConfig.js
    │   ├── hashConfig.js
    │   ├── loggerConfig.js
    │   ├── redisConfig.js
    │   └── rolesConfig.js
    ├── firebase/
    │   ├── FirestoreStore.js
    │   ├── RealtimeStore.js
    │   └── StorageStore.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── cache.js
    │   └── validate.js
    ├── routes/
    │   └── helpRequest.js
    ├── utils/
    │   ├── hasher.js
    │   └── responseBinder.js
    └── validation/
        └── requestSchemas.js
```

## Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/DisasterOpsAI/disasterops-core-api.git
cd disasterops-core-api
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example` and configure your environment variables:

```bash
cp .env.example .env
# Edit .env with your specific configuration
```

### 4. Start the Server Locally

```bash
pnpm dev
```

## Serverless Local Development

This project supports serverless development using the Serverless Framework for local testing and AWS Lambda simulation.

### Prerequisites

1. **Node.js and pnpm**: Make sure you have Node.js (v18+) and pnpm installed
2. **Serverless Framework**: Already included as a dev dependency, no global installation needed

### Getting Started with Serverless

1. **Install dependencies (if not already done):**

```bash
pnpm install
```

1. **Run serverless offline (simulates AWS Lambda locally):**

```bash
pnpm run sls:offline
```

This will start the API at `http://localhost:3000`

### Available Serverless Commands

All serverless commands are available through pnpm scripts:

```bash
# Local development and testing
pnpm run sls:offline    # Run serverless locally (starts at localhost:3000)
pnpm run sls:invoke     # Test specific functions locally
pnpm run sls:info       # View serverless service information
pnpm run sls:logs       # View function logs in real-time
pnpm run sls:print      # Print the compiled CloudFormation template
```

### Testing the Serverless API

Once you run `pnpm run sls:offline`, you can test your API endpoints using:

- **Browser**: Navigate to `http://localhost:3000`
- **cURL**: `curl http://localhost:3000/your-endpoint`
- **Postman**: Use `http://localhost:3000` as your base URL
- **Thunder Client (VS Code)**: Use `http://localhost:3000` as your base URL

## Development Commands

```bash
# Standard development
pnpm run dev          # Run with nodemon
pnpm run start        # Run production build

# Code quality
pnpm run lint         # Lint your code using ESLint
pnpm run lint:fix     # Auto-fix linting issues
pnpm run format       # Format code with Prettier
pnpm run format:check # Check if code is properly formatted

# Serverless commands (see section above)
pnpm run sls:offline  # Run serverless locally
pnpm run sls:invoke   # Test functions locally
pnpm run sls:info     # View serverless information
pnpm run sls:logs     # View function logs
pnpm run sls:print    # Print serverless template
```

## Deployment

### AWS Lambda Deployment

To deploy the application to AWS Lambda, use:

```bash
pnpm run deploy
```

This command will:
1. Install production dependencies with post-install scripts enabled (for ESBuild)
2. Clear any stale serverless artifacts  
3. Deploy the application to AWS Lambda with optimized packaging

### Prerequisites for Deployment

- AWS CLI configured with appropriate credentials
- AWS account with Lambda and API Gateway permissions
- Serverless Framework configured for your AWS account

## Contributing

We welcome contributions! Please:

- Fork the repo
- Create a feature branch
- Follow the linting/formatting conventions
- Open a pull request

## License

The Unlicense – See LICENSE file for details.
