# C++ AI IDE

A modern C++ IDE with AI integration for code review and error fixing.

## Features

- 🔧 Modern VS Code-like interface
- 📝 Code editor with syntax highlighting
- 🚀 Integrated terminal
- 🤖 AI-powered code review and error fixing
- 📁 File explorer
- 🛠️ C++ compilation support

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- g++ compiler (for C++ compilation)

## Project Structure

```
cpp-ai-ide/
├── src/               # Frontend source code
├── backend/           # Backend source code
├── public/           # Static files
└── package.json      # Frontend dependencies
```

## Setup

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Development

- Frontend runs on port 5173 (Vite default)
- Backend runs on port 3001
- The backend includes mock AI services that can be replaced with real AI integrations

## Authors

- Ajitesh Singh
- Ananya Pandey
- Yash Jain
