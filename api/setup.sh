#!/bin/bash

echo "🚀 Emulator Skin API - Setup Script"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your MongoDB connection string!"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your MongoDB connection string"
echo "2. Test database connection: npm run test:db"
echo "3. Run locally: npm run dev"
echo "4. Deploy to Vercel: npm run deploy"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"