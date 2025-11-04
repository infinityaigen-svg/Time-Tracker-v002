

import React, { useState } from 'react';
// Fix: Import User and UserRole to handle user assignment logic properly.
import { Task, User, UserRole } from '../types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Omitted 'logs' and 'notes' from the taskData type to align with creation logic.
  onSubmit: (taskData: Omit<Task, 'id' | 'elapsedTime' | 'status' | 'createdAt' | 'createdBy' | 'logs' | 'notes'>) => void;
  // Fix: Add users prop to supply the list of users for assignment.
  users: User[];
}

const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, onSubmit, users }) => {
  // Fix: Filter out admin users, as tasks are typically assigned to non-admins.
  const assignableUsers = users.filter(u => u.role === UserRole.USER && u.isActive);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(60); // default to 60 minutes
  // Fix: Initialize assignedTo with the first available non-admin user.
  const [assignedTo, setAssignedTo] = useState(assignableUsers[0]?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, estimatedTime: estimatedTime * 60, assignedTo });
    onClose();
    // Reset form
    setName('');
    setDescription('');
    setEstimatedTime(60);
    // Fix: Reset assignedTo using the filtered list of users.
    setAssignedTo(assignableUsers[0]?.email || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-lg border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-100">Create New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="estimatedTime" className="block text-sm font-medium text-slate-400 mb-1">Estimated Time (minutes)</label>
            <input
              type="number"
              id="estimatedTime"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(Number(e.target.value))}
              required
              min="1"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div>
             <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-400 mb-1">Assign To</label>
             <select 
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
             >
                {/* Fix: Populate dropdown from the users prop, showing user names for better UX. */}
                {assignableUsers.map(user => <option key={user.id} value={user.email}>{user.name}</option>)}
             </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;