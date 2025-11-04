
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';

interface TasksProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  users: User[];
  currentUser: User;
}

type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: keyof Task | null;
  direction: SortDirection;
}

const Tasks: React.FC<TasksProps> = ({ tasks, onEditTask, users, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('taskViewSettings');
      if (savedSettings) {
        const { searchQuery, statusFilter, userFilter, sortConfig } = JSON.parse(savedSettings);
        setSearchQuery(searchQuery || '');
        setStatusFilter(statusFilter || 'all');
        setUserFilter(userFilter || 'all');
        setSortConfig(sortConfig || { key: 'createdAt', direction: 'descending' });
      }
    } catch (error) {
      console.error("Failed to parse task view settings from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const settings = {
      searchQuery,
      statusFilter,
      userFilter,
      sortConfig,
    };
    localStorage.setItem('taskViewSettings', JSON.stringify(settings));
  }, [searchQuery, statusFilter, userFilter, sortConfig]);

  const visibleTasks = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) {
        return tasks;
    }
    return tasks.filter(task => task.assignedTo === currentUser.email);
  }, [tasks, currentUser]);


  const requestSort = (key: keyof Task) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Task) => {
    if (sortConfig.key !== key) return <span className="text-slate-600">↕</span>;
    if (sortConfig.direction === 'ascending') {
      return <span className="text-cyan-400">▲</span>;
    }
    return <span className="text-cyan-400">▼</span>;
  };


  const filteredAndSortedTasks = useMemo(() => {
    let filteredTasks = [...visibleTasks];

    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }

    if (userFilter !== 'all' && currentUser.role === UserRole.ADMIN) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === userFilter);
    }

    if (sortConfig.key) {
      filteredTasks.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredTasks;
  }, [visibleTasks, searchQuery, statusFilter, userFilter, sortConfig, currentUser]);

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
        >
          <option value="all">All Statuses</option>
          {Object.values(TaskStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        {currentUser.role === UserRole.ADMIN && (
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.email}>{user.name}</option>
              ))}
            </select>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                 <button onClick={() => requestSort('name')} className="flex items-center gap-2 transition-colors hover:text-white">
                    Task Name {getSortIndicator('name')}
                </button>
              </th>
              <th scope="col" className="px-6 py-3">
                 <button onClick={() => requestSort('assignedTo')} className="flex items-center gap-2 transition-colors hover:text-white">
                    Assigned To {getSortIndicator('assignedTo')}
                 </button>
              </th>
              <th scope="col" className="px-6 py-3">
                 <button onClick={() => requestSort('status')} className="flex items-center gap-2 transition-colors hover:text-white">
                    Status {getSortIndicator('status')}
                 </button>
              </th>
              <th scope="col" className="px-6 py-3">
                 <button onClick={() => requestSort('createdAt')} className="flex items-center gap-2 transition-colors hover:text-white">
                    Created At {getSortIndicator('createdAt')}
                 </button>
              </th>
              <th scope="col" className="px-6 py-3">
                 <button onClick={() => requestSort('elapsedTime')} className="flex items-center gap-2 transition-colors hover:text-white">
                    Time Elapsed {getSortIndicator('elapsedTime')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTasks.map(task => (
              <tr key={task.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer" onClick={() => onEditTask(task)}>
                <td className="px-6 py-4 font-medium text-white">{task.name}</td>
                <td className="px-6 py-4">{users.find(u => u.email === task.assignedTo)?.name || task.assignedTo}</td>
                <td className="px-6 py-4">{task.status}</td>
                <td className="px-6 py-4">{new Date(task.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-mono">{new Date(task.elapsedTime * 1000).toISOString().substr(11, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {filteredAndSortedTasks.length === 0 && <p className="text-center text-slate-500 py-10">No tasks match the current filters.</p>}
    </div>
  );
};

export default Tasks;
