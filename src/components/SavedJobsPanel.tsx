import React, { useState } from 'react';
import { FolderOpen, Plus, Save, Trash2, Pencil, X } from 'lucide-react';
import { SavedJob } from '../utils/savedJobs';

interface SavedJobsPanelProps {
  jobs: SavedJob[];
  activeJobId: string | null;
  hasUnsavedChanges: boolean;
  onNew: () => void;
  onSave: (name: string) => void;
  onLoad: (job: SavedJob) => void;
  onRename: (jobId: string, name: string) => void;
  onDelete: (jobId: string) => void;
}

export const SavedJobsPanel: React.FC<SavedJobsPanelProps> = ({
  jobs,
  activeJobId,
  hasUnsavedChanges,
  onNew,
  onSave,
  onLoad,
  onRename,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobName, setJobName] = useState('');

  const save = () => {
    const name = jobName.trim();
    if (!name) return;
    onSave(name);
    setJobName('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        Saved Jobs
        {hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved changes" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-80 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Browser Saved Jobs</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1.5 mb-3">
            <input
              value={jobName}
              onChange={(event) => setJobName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && save()}
              placeholder="New name = separate job"
              className="min-w-0 flex-1 px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
            />
            <button type="button" onClick={save} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-white bg-[#c4122f] rounded">
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
          <button type="button" onClick={onNew} className="inline-flex items-center gap-1 mb-2 text-xs font-semibold text-[#c4122f] hover:underline">
            <Plus className="w-3.5 h-3.5" /> New blank job
          </button>
          <div className="max-h-56 overflow-y-auto space-y-1">
            {jobs.length === 0 && <p className="text-[11px] text-slate-500 py-2">No saved jobs in this browser.</p>}
            {jobs.map((job) => (
              <div key={job.id} className={`flex items-center gap-1 p-2 rounded ${job.id === activeJobId ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <button type="button" onClick={() => onLoad(job)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{job.name}</span>
                  <span className="text-[10px] text-slate-500">{job.state.items.length} rows · {new Date(job.savedAt).toLocaleString()}</span>
                </button>
                <button type="button" onClick={() => { const name = window.prompt('Rename saved job', job.name); if (name?.trim()) onRename(job.id, name.trim()); }} title="Rename" className="p-1 text-slate-400 hover:text-slate-700">
                  <Pencil className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => onDelete(job.id)} title="Delete" className="p-1 text-rose-500 hover:text-rose-700">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
