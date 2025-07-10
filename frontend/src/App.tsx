import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileVideo, Download, RefreshCw } from 'lucide-react';

import { FileUpload } from './components/FileUpload';
import { ProgressTracker } from './components/ProgressTracker';
import { ScriptEditor } from './components/ScriptEditor';

import {
  uploadPresentation,
  getJobStatus,
  getAllJobs,
  getScripts,
  updateScripts,
  downloadVideo,
  checkHealth,
} from './api';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'progress' | 'scripts'>('upload');
  
  const queryClientInstance = useQueryClient();

  // Health check
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get current job status
  const { data: currentJob } = useQuery({
    queryKey: ['job', currentJobId],
    queryFn: () => currentJobId ? getJobStatus(currentJobId) : null,
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      // Refetch every 2 seconds if processing, otherwise every 10 seconds
      return query.state.data?.status === 'processing' ? 2000 : 10000;
    },
  });

  // Get all jobs
  const { data: allJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: getAllJobs,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Get scripts for current job
  const { data: scripts, isLoading: isScriptsLoading } = useQuery({
    queryKey: ['scripts', currentJobId],
    queryFn: () => currentJobId ? getScripts(currentJobId) : [],
    enabled: !!currentJobId && currentJob?.status === 'completed',
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadPresentation,
    onSuccess: (data) => {
      setCurrentJobId(data.job_id);
      setActiveTab('progress');
      queryClientInstance.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Update scripts mutation
  const updateScriptsMutation = useMutation({
    mutationFn: ({ jobId, scripts }: { jobId: string; scripts: Record<number, string> }) =>
      updateScripts(jobId, scripts),
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['job', currentJobId] });
      queryClientInstance.invalidateQueries({ queryKey: ['scripts', currentJobId] });
    },
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleScriptSave = (updatedScripts: Record<number, string>) => {
    if (currentJobId) {
      updateScriptsMutation.mutate({ jobId: currentJobId, scripts: updatedScripts });
    }
  };

  const handleJobSelect = (jobId: string) => {
    setCurrentJobId(jobId);
    setActiveTab('progress');
  };

  // Auto-switch to scripts tab when job completes
  useEffect(() => {
    if (currentJob?.status === 'completed' && activeTab === 'progress') {
      setActiveTab('scripts');
    }
  }, [currentJob?.status, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileVideo className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PowerPoint to Video</h1>
                <p className="text-sm text-gray-600">AI-powered presentation converter</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {health && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    health.gemini_available && health.tts_available 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`} />
                  <span className="text-gray-600">
                    {health.gemini_available && health.tts_available 
                      ? 'All services ready' 
                      : 'Some services unavailable'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              disabled={!currentJobId}
              className={`py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'progress'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Progress
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              disabled={!currentJobId || currentJob?.status !== 'completed'}
              className={`py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'scripts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Edit Scripts
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Convert PowerPoint to Video
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your PowerPoint presentation and let AI generate professional narration 
                and convert it to a video automatically.
              </p>
            </div>

            <FileUpload
              onFileSelect={handleFileUpload}
              isUploading={uploadMutation.isPending}
            />

            {/* Recent Jobs */}
            {allJobs && allJobs.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversions</h3>
                <div className="space-y-3">
                  {allJobs.slice(0, 5).map((job) => (
                    <div
                      key={job.job_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => handleJobSelect(job.job_id)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          Job {job.job_id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'failed' ? 'bg-red-100 text-red-800' :
                          job.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                        {job.status === 'completed' && job.video_url && (
                          <a
                            href={downloadVideo(job.job_id)}
                            className="text-primary-600 hover:text-primary-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && currentJob && (
          <div className="space-y-8">
            <ProgressTracker job={currentJob} />
            
            {currentJob.status === 'completed' && currentJob.video_url && (
              <div className="card text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your video is ready!
                </h3>
                <div className="space-y-4">
                  <a
                    href={downloadVideo(currentJob.job_id)}
                    className="btn-primary inline-flex items-center"
                    download
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Video
                  </a>
                  <p className="text-sm text-gray-600">
                    You can also edit the scripts and regenerate the video with custom narration.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scripts' && currentJobId && (
          <div className="space-y-8">
            {isScriptsLoading ? (
              <div className="card text-center py-8">
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading scripts...</p>
              </div>
            ) : scripts ? (
              <ScriptEditor
                jobId={currentJobId}
                scripts={scripts}
                onSave={handleScriptSave}
                isSaving={updateScriptsMutation.isPending}
              />
            ) : (
              <div className="card text-center py-8">
                <p className="text-gray-600">Scripts not available for this job.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
