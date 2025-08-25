import React from 'react';
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import type { JobStatus } from '../api';

interface ProgressTrackerProps {
  job: JobStatus;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ job }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'processing':
        return <Loader className="h-6 w-6 text-primary-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-primary-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
    }
  };

  const getProgressBarColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'processing':
        return 'bg-primary-600';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="card w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {job.status === 'pending' && 'Preparing...'}
              {job.status === 'processing' && 'Processing Presentation'}
              {job.status === 'completed' && 'Conversion Complete!'}
              {job.status === 'failed' && 'Conversion Failed'}
            </h3>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {job.progress}%
          </div>
          {job.slides_total && (
            <div className="text-sm text-gray-500">
              {job.slides_processed || 0} / {job.slides_total} slides
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-4">
        <div
          className={`progress-fill ${getProgressBarColor()}`}
          style={{ width: `${job.progress}%` }}
        />
      </div>

      {/* Status Message */}
      <div className="space-y-2">
        <p className="text-gray-700 font-medium">{job.message}</p>
        
        {job.status === 'processing' && job.slides_total && (
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Total Slides:</span> {job.slides_total}
            </div>
            <div>
              <span className="font-medium">Processed:</span> {job.slides_processed || 0}
            </div>
            <div>
              <span className="font-medium">Remaining:</span> {job.slides_total - (job.slides_processed || 0)}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          Job ID: {job.job_id}
        </div>
        
        <div className="text-xs text-gray-500">
          Started: {new Date(job.created_at).toLocaleString()}
        </div>
      </div>

      {/* Processing Steps Indicator */}
      {job.status === 'processing' && (
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Processing Steps:</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${job.progress >= 10 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${job.progress >= 10 ? 'text-green-700' : 'text-gray-500'}`}>
                Extract slides from PowerPoint
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${job.progress >= 20 ? 'bg-green-500' : job.progress >= 10 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${job.progress >= 20 ? 'text-green-700' : job.progress >= 10 ? 'text-yellow-700' : 'text-gray-500'}`}>
                Generate AI scripts for each slide
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${job.progress >= 80 ? 'bg-green-500' : job.progress >= 20 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${job.progress >= 80 ? 'text-green-700' : job.progress >= 20 ? 'text-yellow-700' : 'text-gray-500'}`}>
                Convert scripts to speech
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${job.progress >= 100 ? 'bg-green-500' : job.progress >= 80 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${job.progress >= 100 ? 'text-green-700' : job.progress >= 80 ? 'text-yellow-700' : 'text-gray-500'}`}>
                Create final video
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};