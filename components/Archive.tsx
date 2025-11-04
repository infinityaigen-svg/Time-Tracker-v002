
import React, { useState, useMemo } from 'react';
import { Task, User, UserRole, TaskStatus } from '../types';

interface ArchiveProps {
  tasks: Task[];
  onDeleteTasks: (taskIds: string[]) => void;
  users: User[];
  currentUser: User;
}

const Archive: React.FC<ArchiveProps> = ({ tasks, onDeleteTasks, users, currentUser }) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState('all');

  const visibleTasks = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) {
        return tasks;
    }
    return tasks.filter(task => task.assignedTo === currentUser.email);
  }, [tasks, currentUser]);

  const filteredTasks = useMemo(() => {
    if (userFilter === 'all') {
      return visibleTasks;
    }
    return visibleTasks.filter(task => task.assignedTo === userFilter);
  }, [visibleTasks, userFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(filteredTasks.map(t => t.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    if (e.target.checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleArchiveSelected = () => {
    if (window.confirm(`Are you sure you want to archive ${selectedTasks.length} task(s)?`)) {
        onDeleteTasks(selectedTasks);
        setSelectedTasks([]);
    }
  };

  const handleArchiveOne = (taskId: string) => {
    if (window.confirm(`Are you sure you want to archive this task?`)) {
        onDeleteTasks([taskId]);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch(status) {
        case TaskStatus.COMPLETED:
            return <span className="text-sm font-medium text-green-400">{status}</span>;
        case TaskStatus.DELETED:
            return <span className="text-sm font-medium text-slate-500">{status}</span>;
        default:
            return <span className="text-sm font-medium text-slate-400">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        {currentUser.role === UserRole.ADMIN && (
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Filter by User:</label>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="ml-2 bg-slate-700 border border-slate-600 rounded-md p-2"
            >
              <option value="all">All Users</option>
              {users.map(u => <option key={u.id} value={u.email}>{u.name}</option>)}
            </select>
          </div>
        )}
        <div className={currentUser.role !== UserRole.ADMIN ? 'w-full text-right' : ''}>
          <button
            onClick={handleArchiveSelected}
            disabled={selectedTasks.length === 0}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg disabled:bg-yellow-800/50 disabled:cursor-not-allowed transition-all"
          >
            Archive Selected ({selectedTasks.length})
          </button>
        </div>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4">
        {filteredTasks.length > 0 ? (
          <ul className="space-y-3">
            <li className="p-3 rounded-md flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-4 w-2/3">
                    <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
                        className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <p className="font-semibold text-slate-200">Task</p>
                </div>
                <span className="text-sm font-medium text-slate-400">Status</span>
            </li>
            {filteredTasks.map(task => (
              <li key={task.id} className="bg-slate-900/50 p-3 rounded-md flex justify-between items-center hover:bg-slate-900 transition-colors">
                <div className="flex items-center gap-4 w-2/3">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => handleSelectOne(e, task.id)}
                    className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    disabled={task.status === TaskStatus.DELETED}
                  />
                  <div>
                    <p className={`font-semibold text-slate-200 ${task.status === TaskStatus.DELETED ? 'line-through' : ''}`}>{task.name}</p>
                    <p className="text-xs text-slate-400">Completed on {new Date(task.completedAt || task.createdAt).toLocaleDateString()} by {users.find(u => u.email === task.assignedTo)?.name || task.assignedTo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                    {getStatusBadge(task.status)}
                    <button onClick={() => handleArchiveOne(task.id)} className="text-slate-500 hover:text-yellow-500 transition-colors disabled:text-slate-700 disabled:cursor-not-allowed" aria-label="Archive task" disabled={task.status === TaskStatus.DELETED}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500 py-10">No archived tasks found.</p>
        )}
      </div>
    </div>
  );
};

export default Archive;