#!/bin/bash

# Development startup script for PowerPoint to Video application

echo "🚀 Starting PowerPoint to Video Development Environment"
echo "=================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file..."
    echo "GEMINI_API_KEY=your_api_key_here" > .env
    echo "📝 Please edit .env and add your Gemini API key"
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists soffice; then
    echo "⚠️  LibreOffice not found - installing..."
    sudo apt-get update && sudo apt-get install -y libreoffice
fi

if ! command_exists ffmpeg; then
    echo "⚠️  FFmpeg not found - installing..."
    sudo apt-get install -y ffmpeg
fi

echo "✅ Prerequisites check complete"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

echo "✅ Dependencies installed successfully"

# Create uploads directory for backend
mkdir -p backend/uploads

# Start services
echo "🎬 Starting services..."

# Start backend in background
echo "🐍 Starting FastAPI backend on port 8000..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️  Starting React frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Development environment is ready!"
echo "=================================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 Tips:"
echo "   - Edit .env to add your Gemini API key"
echo "   - Upload a PowerPoint file to test the conversion"
echo "   - Check the API health at http://localhost:8000/health"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Wait for user to stop
wait $FRONTEND_PID
kill $BACKEND_PID 2>/dev/null