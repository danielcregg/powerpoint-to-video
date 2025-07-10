# PowerPoint to Video - Full Stack Application

A beautiful, professional web application for converting PowerPoint presentations to narrated videos using AI.

## New Architecture (React + Python)

### Frontend (React + TypeScript + Tailwind CSS)
- **Beautiful drag-and-drop interface** for file uploads
- **Real-time progress tracking** with detailed status updates
- **Script editing interface** for customizing narration
- **Professional, responsive design** optimized for all devices
- **Download management** with preview capabilities

### Backend (Python + FastAPI)
- **RESTful API** built with FastAPI
- **Background processing** for video conversion
- **Real-time status updates** via polling
- **Script management** with regeneration capabilities
- **File handling** with proper validation and cleanup

### Key Features
- **AI-powered script generation** using Google Gemini
- **High-quality text-to-speech** using Coqui TTS  
- **Cross-platform PowerPoint conversion** using LibreOffice
- **Professional video output** with multiple codec fallbacks
- **Script editing and regeneration** without full reprocessing
- **Multi-job management** with persistent state

## Quick Start

### GitHub Codespaces (Recommended)
1. Create a new Codespace from this repository
2. Wait for the devcontainer to initialize (installs Node.js, Python, LibreOffice, FFmpeg)
3. Set up your Gemini API key:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```
4. Start the backend:
   ```bash
   cd backend
   python app.py
   ```
5. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```
6. Open http://localhost:3000 in your browser

### Local Development
1. **Prerequisites:**
   - Python 3.11+
   - Node.js 18+
   - LibreOffice
   - FFmpeg

2. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   python app.py
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API Endpoints

### Core Endpoints
- `POST /upload` - Upload PowerPoint file and start conversion
- `GET /status/{job_id}` - Get conversion progress and status
- `GET /download/{job_id}` - Download completed video
- `GET /scripts/{job_id}` - Get generated scripts for editing
- `PUT /scripts/{job_id}` - Update scripts and regenerate audio

### Management Endpoints
- `GET /jobs` - List all conversion jobs
- `GET /slides/{job_id}/{slide_num}` - Get slide image for preview
- `GET /health` - Check service availability

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **TanStack Query** for API state management
- **Lucide React** for icons
- **React Dropzone** for file uploads
- **Vite** for fast development

### Backend
- **FastAPI** for the REST API
- **Uvicorn** for ASGI server
- **Pydantic** for data validation
- **Google Generative AI** (Gemini) for script generation
- **Coqui TTS** for text-to-speech synthesis
- **MoviePy** for video assembly
- **PyMuPDF** for PDF processing

### Infrastructure
- **LibreOffice** for PowerPoint conversion
- **FFmpeg** for video encoding
- **GitHub Codespaces** for development environment

## Development Workflow

1. **Upload a presentation** via the drag-and-drop interface
2. **Monitor progress** in real-time with detailed status updates
3. **Edit scripts** once conversion is complete
4. **Regenerate audio** for modified scripts only
5. **Download the final video** with custom narration

## Project Structure

```
powerpoint-to-video/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── api.ts          # API client
│   │   └── App.tsx         # Main application
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # FastAPI application
│   ├── app.py              # Main API server
│   └── requirements.txt    # Python dependencies
├── auto_presenter.py       # Original CLI script (preserved)
├── requirements.txt        # Legacy requirements
└── .devcontainer/          # Codespaces configuration
    └── devcontainer.json
```

## Legacy CLI Support

The original command-line interface is still available:

```bash
python auto_presenter.py presentation.pptx
```

This provides backward compatibility while the new web interface offers enhanced features and usability.