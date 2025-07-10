import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { getSlideImageUrl } from '../api';
import type { SlideScript } from '../api';

interface ScriptEditorProps {
  jobId: string;
  scripts: SlideScript[];
  onSave: (scripts: Record<number, string>) => void;
  isSaving: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  jobId,
  scripts,
  onSave,
  isSaving
}) => {
  const [editedScripts, setEditedScripts] = useState<Record<number, string>>({});
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize edited scripts from props
    const initialScripts: Record<number, string> = {};
    scripts.forEach(script => {
      initialScripts[script.slide_number] = script.script;
    });
    setEditedScripts(initialScripts);
  }, [scripts]);

  const handleScriptChange = (slideNumber: number, newScript: string) => {
    setEditedScripts(prev => ({
      ...prev,
      [slideNumber]: newScript
    }));
    
    // Check if there are changes
    const originalScript = scripts.find(s => s.slide_number === slideNumber)?.script || '';
    const hasCurrentChanges = Object.entries(editedScripts).some(([num, script]) => {
      const original = scripts.find(s => s.slide_number === parseInt(num))?.script || '';
      return script !== original;
    }) || newScript !== originalScript;
    
    setHasChanges(hasCurrentChanges);
  };

  const toggleSlideExpansion = (slideNumber: number) => {
    setExpandedSlides(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slideNumber)) {
        newSet.delete(slideNumber);
      } else {
        newSet.add(slideNumber);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    // Only send changed scripts
    const changedScripts: Record<number, string> = {};
    Object.entries(editedScripts).forEach(([slideNum, script]) => {
      const slideNumber = parseInt(slideNum);
      const originalScript = scripts.find(s => s.slide_number === slideNumber)?.script || '';
      if (script !== originalScript) {
        changedScripts[slideNumber] = script;
      }
    });

    if (Object.keys(changedScripts).length > 0) {
      onSave(changedScripts);
      setHasChanges(false);
    }
  };

  const toggleAllSlides = () => {
    if (expandedSlides.size === scripts.length) {
      setExpandedSlides(new Set());
    } else {
      setExpandedSlides(new Set(scripts.map(s => s.slide_number)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Scripts</h2>
            <p className="text-gray-600">
              Customize the narration for each slide. Changes will regenerate only the affected audio.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAllSlides}
              className="btn-secondary text-sm"
            >
              {expandedSlides.size === scripts.length ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Expand All
                </>
              )}
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              You have unsaved changes. Click "Save Changes" to regenerate audio for modified scripts.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {scripts.map((script) => {
          const isExpanded = expandedSlides.has(script.slide_number);
          const currentScript = editedScripts[script.slide_number] || script.script;
          const hasChanged = currentScript !== script.script;

          return (
            <div key={script.slide_number} className="card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSlideExpansion(script.slide_number)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={getSlideImageUrl(jobId, script.slide_number)}
                      alt={`Slide ${script.slide_number}`}
                      className="w-16 h-12 object-cover rounded border border-gray-200"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      Slide {script.slide_number}
                      {hasChanged && (
                        <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                          Modified
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentScript.length} characters • Click to {isExpanded ? 'collapse' : 'expand'}
                    </p>
                  </div>
                </div>
                
                <div className="text-gray-400">
                  {isExpanded ? '−' : '+'}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={getSlideImageUrl(jobId, script.slide_number)}
                        alt={`Slide ${script.slide_number}`}
                        className="w-32 h-24 object-cover rounded border border-gray-200"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Narration Script
                      </label>
                      <textarea
                        value={currentScript}
                        onChange={(e) => handleScriptChange(script.slide_number, e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Enter the narration script for this slide..."
                      />
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>Aim for 100-150 words for optimal timing</span>
                        <span>{currentScript.split(/\s+/).filter(word => word.length > 0).length} words</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scripts.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-500">No scripts available yet. Complete the conversion first.</p>
        </div>
      )}
    </div>
  );
};