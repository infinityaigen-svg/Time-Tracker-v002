import React, { useState, useEffect } from 'react';
import { Task, User, TaskLog, UserRole } from '../types';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'elapsedTime' | 'status' | 'createdAt' | 'createdBy' | 'logs' | 'notes' | 'updatedAt' | 'updatedBy' | 'deletedAt' | 'deletedBy'> | Task) => void;
  task: Task | null;
  currentUser: User;
  users: User[];
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border border-slate-700 rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform ${isOpen ? '' : '-rotate-90'}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && <div className="p-3">{children}</div>}
    </div>
  );
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, onSubmit, task, currentUser, users }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [assignedTo, setAssignedTo] = useState(users.find(u => u.role !== UserRole.ADMIN)?.email || '');
  const [urlLink, setUrlLink] = useState('');
  const [newNote, setNewNote] = useState('');
  
  const isEditing = task !== null;

  useEffect(() => {
    if (isOpen && task) {
      setName(task.name);
      setDescription(task.description);
      const hours = Math.floor(task.estimatedTime / 3600);
      const minutes = Math.floor((task.estimatedTime % 3600) / 60);
      setEstimatedHours(hours);
      setEstimatedMinutes(Math.round(minutes / 5) * 5); // Round to nearest 5 for dropdown
      setAssignedTo(task.assignedTo);
      setUrlLink(task.urlLink || '');
    } else if (isOpen && !task) {
      // Reset for new task
      setName('');
      setDescription('');
      setEstimatedHours(0);
      setEstimatedMinutes(30);
      setAssignedTo(users.find(u => u.role !== UserRole.ADMIN && u.isActive)?.email || '');
      setUrlLink('');
    }
  }, [isOpen, task, users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = { name, description, assignedTo, urlLink };
    const estimatedTimeInSeconds = estimatedHours * 3600 + estimatedMinutes * 60;
    
    if (isEditing) {
        const updatedLogs: TaskLog[] = [...task.logs];
        if (task.name !== name) {
            updatedLogs.push({ timestamp: Date.now(), user: currentUser.email, change: `Task name changed to "${name}"` });
        }
        if (task.description !== description) {
            updatedLogs.push({ timestamp: Date.now(), user: currentUser.email, change: `Description updated.` });
        }
        if (task.urlLink !== urlLink) {
            updatedLogs.push({ timestamp: Date.now(), user: currentUser.email, change: `URL link updated.` });
        }
        if (task.estimatedTime !== estimatedTimeInSeconds) {
            updatedLogs.push({ timestamp: Date.now(), user: currentUser.email, change: `Estimated time updated.` });
        }
        onSubmit({ ...task, ...commonData, estimatedTime: estimatedTimeInSeconds, logs: updatedLogs });
    } else {
        onSubmit({ ...commonData, estimatedTime: estimatedTimeInSeconds });
    }
  };

  const handleAddNote = () => {
    if (newNote.trim() && isEditing) {
      const updatedTask = {
        ...task,
        notes: [...task.notes, { text: newNote, user: currentUser.email, timestamp: Date.now() }],
        logs: [...task.logs, { timestamp: Date.now(), user: currentUser.email, change: `Note added.` }]
      };
      onSubmit(updatedTask);
      setNewNote('');
    }
  };


  if (!isOpen) return null;

  const hourOptions = [...Array(13).keys()]; // 0-12 hours
  const minuteOptions = [...Array(12).keys()].map(m => m * 5); // 0, 5, 10... 55 minutes

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-slate-100 flex-shrink-0">{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow" id="task-form">
          {/* Main Details */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={250} rows={4} className="w-full input-style" />
            <p className="text-right text-xs text-slate-500">{description.length} / 250</p>
          </div>
           <div>
            <label htmlFor="urlLink" className="block text-sm font-medium text-slate-400 mb-1">URL Link</label>
            <div className="relative">
              <input type="url" id="urlLink" value={urlLink} onChange={(e) => setUrlLink(e.target.value)} placeholder="https://example.com" className="w-full input-style pr-10" />
              {urlLink && (
                  <a href={urlLink} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-slate-400 mb-1">Estimated Time</label>
              <div className="flex gap-2">
                <select id="estimatedHours" value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} required className="w-full input-style">
                  {hourOptions.map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')} hrs</option>)}
                </select>
                <select id="estimatedMinutes" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} required className="w-full input-style">
                  {minuteOptions.map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')} mins</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-400 mb-1">Assign To</label>
              <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required disabled={isEditing} className="w-full input-style disabled:bg-slate-700/50">
                {users.filter(u => u.role !== UserRole.ADMIN && u.isActive).map(user => <option key={user.id} value={user.email}>{user.name}</option>)}
              </select>
            </div>
          </div>
          
          {/* Notes and Logs for editing tasks */}
          {isEditing && (
            <div className='space-y-4'>
                <Section title="Notes">
                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                        {task.notes.length > 0 ? task.notes.map((note, index) => (
                            <div key={index} className="bg-slate-900/50 p-2 rounded text-sm">
                                <p className="text-slate-300">{note.text}</p>
                                <p className="text-xs text-slate-500 text-right"> - {note.user.split('@')[0]} on {new Date(note.timestamp).toLocaleDateString()}</p>
                            </div>
                        )).reverse() : <p className="text-slate-500 text-sm text-center py-4">No notes yet.</p>}
                    </div>
                     <div className="flex gap-2">
                        <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a new note..." className="w-full input-style" />
                        <button type="button" onClick={handleAddNote} className="btn-secondary flex-shrink-0">Add Note</button>
                    </div>
                </Section>
                <Section title="Logs">
                    <ul className="space-y-1 text-xs text-slate-400 max-h-32 overflow-y-auto">
                        {[...task.logs].reverse().map((log, index) => (
                            <li key={index}>
                                <span className="font-mono text-cyan-400/70">[{new Date(log.timestamp).toLocaleString()}]</span> {log.user.split('@')[0]}: {log.change}
                            </li>
                        ))}
                    </ul>
                </Section>
            </div>
          )}
        </form>
        <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="task-form" onClick={handleSubmit} className="btn-primary">
            {isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
        <style>{`
          .input-style {
            background-color: rgb(15 23 42 / 0.5);
            border: 1px solid #334155;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            width: 100%;
          }
          .input-style:focus {
            outline: none;
            border-color: #06b6d4;
            box-shadow: 0 0 0 2px #22d3ee80;
          }
          .btn-primary {
            padding: 0.5rem 1rem;
            background-color: #0891b2;
            color: white;
            font-weight: 600;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
          }
          .btn-primary:hover {
            background-color: #06b6d4;
          }
          .btn-secondary {
            padding: 0.5rem 1rem;
            background-color: #475569;
            color: white;
            font-weight: 600;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
          }
          .btn-secondary:hover {
            background-color: #64748b;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TaskDetailModal;