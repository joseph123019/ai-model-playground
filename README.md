# AI Model Playground

A real-time AI model comparison platform that allows users to submit a single prompt and see responses from multiple AI models side-by-side with live streaming, performance metrics, and cost analysis.

## 🚀 Features

- **Real-time Streaming**: See AI responses stream in real-time as they're generated
- **Side-by-side Comparison**: Compare GPT-4o and Claude 3.5 Sonnet responses simultaneously
- **Live Status Updates**: Track each model's status (thinking, writing, complete, error)
- **Cost & Token Analysis**: View detailed metrics including token usage and costs
- **User Authentication**: Secure JWT-based login and registration system
- **Session Management**: Save and track all comparison sessions
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: WebSocket gateway for streaming responses
- **AI Integration**: OpenAI GPT-4o and Anthropic Claude 3.5 Sonnet
- **Validation**: Class-validator for request validation

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS for responsive design
- **Real-time**: Socket.io-client for WebSocket communication
- **Markdown**: React-markdown for AI response rendering
- **Authentication**: JWT token management with localStorage

## 📋 Prerequisites

- Node.js 20+ 
- npm or yarn
- PostgreSQL database (or use Prisma Accelerate)
- OpenAI API key
- Anthropic API key

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/joseph123019/ai-model-playground.git
cd ai-model-playground/Development
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys and database URL
# Required variables:
# - OPENAI_API_KEY=your_openai_key
# - ANTHROPIC_API_KEY=your_anthropic_key
# - DATABASE_URL=your_postgresql_url
# - JWT_SECRET=your_jwt_secret

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your backend URL
# NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 🔧 Environment Variables

### Backend (.env)
```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
PORT=4000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret_key
```

## 🚀 Deployment

### Backend (Railway/Render)

1. **Railway Deployment**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Deploy from backend directory
   cd backend
   railway up
   ```

2. **Environment Variables** (set in Railway dashboard):
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel URL)

### Frontend (Vercel)

1. **Connect to Vercel**:
   - Import your GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `.next`

2. **Environment Variables** (set in Vercel dashboard):
   - `NEXT_PUBLIC_BACKEND_URL` (your Railway/Render URL)
   - `NEXT_PUBLIC_JWT_SECRET` (same as backend)

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)

### WebSocket Events
- `startComparison` - Start AI model comparison
- `statusUpdate` - Model status updates
- `responseChunk` - Streaming response chunks
- `finalMetrics` - Final comparison metrics
- `error` - Error notifications

## 🗄️ Database Schema

### User
- `id` (String, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `createdAt` (DateTime)

### Session
- `id` (String, Primary Key)
- `prompt` (String)
- `userId` (String, Foreign Key)
- `createdAt` (DateTime)

### Response
- `id` (String, Primary Key)
- `model` (String)
- `content` (String)
- `tokens` (Int)
- `cost` (Float)
- `status` (String)
- `sessionId` (String, Foreign Key)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- WebSocket authentication
- Environment variable protection

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## 📈 Performance Considerations

- Real-time streaming for immediate feedback
- Token estimation for cost calculation
- Efficient WebSocket connections
- Optimized database queries with Prisma
- Responsive UI with Tailwind CSS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔗 Live Demo

[Deploy your own instance using the deployment instructions above]

---

**Note**: Make sure to keep your API keys secure and never commit them to version control. Use environment variables for all sensitive configuration.
