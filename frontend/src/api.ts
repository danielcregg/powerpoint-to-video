import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  created_at: string;
  slides_total?: number;
  slides_processed?: number;
  video_url?: string;
}

export interface SlideScript {
  slide_number: number;
  script: string;
  image_url: string;
}

export interface ScriptUpdate {
  scripts: Record<number, string>;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const uploadPresentation = async (file: File): Promise<JobStatus> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await api.get(`/status/${jobId}`);
  return response.data;
};

export const getAllJobs = async (): Promise<JobStatus[]> => {
  const response = await api.get('/jobs');
  return response.data;
};

export const getScripts = async (jobId: string): Promise<SlideScript[]> => {
  const response = await api.get(`/scripts/${jobId}`);
  return response.data;
};

export const updateScripts = async (
  jobId: string,
  scripts: Record<number, string>
): Promise<{ message: string }> => {
  const response = await api.put(`/scripts/${jobId}`, { scripts });
  return response.data;
};

export const downloadVideo = (jobId: string): string => {
  return `${API_BASE_URL}/download/${jobId}`;
};

export const getSlideImageUrl = (jobId: string, slideNumber: number): string => {
  return `${API_BASE_URL}/slides/${jobId}/${slideNumber}`;
};

export const checkHealth = async (): Promise<{
  status: string;
  gemini_available: boolean;
  tts_available: boolean;
}> => {
  const response = await api.get('/health');
  return response.data;
};