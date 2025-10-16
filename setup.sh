#!/bin/bash

# EduFund Setup Script
echo "🚀 Setting up EduFund..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"

# Backend setup
echo -e "\n${BLUE}📦 Setting up backend...${NC}"
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/edufund?schema=public"
PORT=3001
EOF
    echo -e "${GREEN}✅ .env file created. Please update it with your database credentials.${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Frontend setup
echo -e "\n${BLUE}📦 Setting up frontend...${NC}"
cd ../frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update backend/.env with your PostgreSQL connection string"
echo "2. Update frontend/src/wagmi.config.ts with your WalletConnect Project ID"
echo "   Get one from: https://cloud.walletconnect.com/"
echo ""
echo "3. Initialize the database:"
echo "   cd backend && npm run db:push"
echo ""
echo "4. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "5. Start the frontend (in a new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "6. Open http://localhost:3000 in your browser"
echo ""
echo "📚 See SETUP.md for detailed instructions and sample data"



