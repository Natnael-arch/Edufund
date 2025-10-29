#!/bin/bash
# Deployment script for EduFund

echo "🚀 Deploying EduFund to Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root"
    exit 1
fi

echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Frontend built successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Deploy frontend to Vercel:"
echo "   - Connect GitHub repo to Vercel"
echo "   - Set root directory to 'frontend'"
echo "   - Add environment variables from frontend/env.example"
echo ""
echo "2. Deploy backend to Railway/Render:"
echo "   - Connect GitHub repo"
echo "   - Set root directory to 'backend'"
echo "   - Add environment variables from backend/railway.env.example"
echo ""
echo "3. Set up database:"
echo "   - Create Supabase/Neon database"
echo "   - Run: npx prisma db push"
echo ""
echo "4. Update frontend API URL:"
echo "   - Set VITE_API_URL to your backend URL"
echo ""
echo "🎉 Your EduFund platform will be live!"

