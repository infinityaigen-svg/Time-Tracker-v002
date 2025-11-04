
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';

interface AdminReviewProps {
  tasks: Task[];
  onApprove: (taskId: string, notes: string) => void;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const AdminReview: React.FC<AdminReviewProps> = ({ tasks, onApprove }) => {
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  // Fix: Corrected the TaskStatus enum from IN_REVIEW to REVIEW.
  const tasksToReview = tasks.filter(task => task.status === TaskStatus.REVIEW);

  const handleApprove = (taskId: string) => {
    onApprove(taskId, notes[taskId] || 'Approved.');
  };

  if (tasksToReview.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-slate-300 mb-4 border-b-2 border-slate-700 pb-2">Tasks for Review</h2>
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
        {tasksToReview.map(task => (
          <div key={task.id} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-grow">
              <p className="font-bold text-slate-100">{task.name}</p>
              <p className="text-sm text-slate-400">Assigned to: {task.assignedTo}</p>
              <p className="text-sm text-slate-400">Time Taken: <span className="font-mono">{formatTime(task.elapsedTime)}</span> / <span className="font-mono">{formatTime(task.estimatedTime)}</span></p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Add review notes..."
                value={notes[task.id] || ''}
                onChange={(e) => setNotes({ ...notes, [task.id]: e.target.value })}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm w-full md:w-64"
              />
              <button
                onClick={() => handleApprove(task.id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex-shrink-0"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReview;