import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isUploading }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Only PowerPoint (.pptx) files are supported');
      } else if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError('File is too large. Maximum size is 100MB');
      } else {
        setError('Invalid file selected');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <div className="text-lg font-medium text-gray-700">Uploading...</div>
            </>
          ) : (
            <>
              <div className="p-4 bg-primary-100 rounded-full">
                {isDragActive ? (
                  <Upload className="h-8 w-8 text-primary-600" />
                ) : (
                  <FileText className="h-8 w-8 text-primary-600" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDragActive ? 'Drop your PowerPoint file here' : 'Upload PowerPoint Presentation'}
                </h3>
                <p className="text-gray-600">
                  Drag & drop your .pptx file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 100MB
                </p>
              </div>
              
              <button
                type="button"
                className="btn-primary"
                disabled={isUploading}
              >
                Choose File
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};