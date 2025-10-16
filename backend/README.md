# EduFund Backend

Express + TypeScript + Prisma backend for the EduFund platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/edufund?schema=public"
   PORT=3001
   ```

3. Push database schema:
   ```bash
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma Client

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Quests
- `GET /api/quests` - Get all quests
- `POST /api/quests` - Create new quest
  ```json
  {
    "title": "Quest Title",
    "description": "Description",
    "reward": 100,
    "difficulty": "beginner",
    "content": "Quest content..."
  }
  ```
- `POST /api/quests/:id/complete` - Complete a quest
  ```json
  {
    "walletAddress": "0x..."
  }
  ```

### Users
- `GET /api/users/:walletAddress` - Get user profile



