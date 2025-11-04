import React, { useEffect, useMemo, useState } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';

interface TaskCardProps {
  task: Task;
  currentUser: User;
  onUpdate: (task: Task) => void;
  onEdit: (task: Task) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
);

const StopIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const colorClass = progress >= 80 ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <div 
        className={`${colorClass} h-2 rounded-full transition-width ease-linear duration-1000`} 
        style={{ width: `${Math.min(progress, 100)}%` }}
      ></div>
    </div>
  );
};

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, currentUser, onUpdate, onEdit, showNotification }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let interval: number | undefined;
    if (task.status === TaskStatus.STARTED) {
      interval = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task.status]);

  const displayedElapsedTime = useMemo(() => {
    if (task.status === TaskStatus.STARTED && task.startedAt) {
      const sessionDuration = Math.max(0, Math.floor((now - task.startedAt) / 1000));
      return task.elapsedTime + sessionDuration;
    }
    return task.elapsedTime;
  }, [task.status, task.elapsedTime, task.startedAt, now]);


  const handleStart = () => {
    onUpdate({ 
      ...task, 
      status: TaskStatus.STARTED,
      startedAt: Date.now(),
      logs: [...task.logs, { timestamp: Date.now(), user: currentUser.email, change: 'Task started.' }]
    });
  };
  
  const handleEnd = () => {
    const sessionDuration = task.startedAt ? Math.floor((Date.now() - task.startedAt) / 1000) : 0;
    const finalElapsedTime = task.elapsedTime + sessionDuration;

    onUpdate({ 
      ...task, 
      elapsedTime: finalElapsedTime,
      status: TaskStatus.REVIEW,
      completedAt: Date.now(),
      startedAt: undefined, // Clear startedAt as the timing session is over
      logs: [...task.logs, { timestamp: Date.now(), user: currentUser.email, change: 'Task ended and sent for review.' }]
    });
    showNotification(`Task "${task.name}" submitted for review.`, 'success');
    console.log(`Simulating email to training.ksnl@gmail.com for task: ${task.name}`);
  }

  const handleApprove = () => {
    onUpdate({
        ...task,
        status: TaskStatus.COMPLETED,
        logs: [...task.logs, { timestamp: Date.now(), user: currentUser.email, change: 'Task approved.' }],
        notes: [...task.notes, { timestamp: Date.now(), user: currentUser.email, text: 'Approved.' }]
    });
    showNotification(`Task "${task.name}" approved.`, 'success');
  }

  const progress = task.estimatedTime > 0 ? (displayedElapsedTime / task.estimatedTime) * 100 : 0;
  
  const assignedUser = useMemo(() => task.assignedTo.split('@')[0], [task.assignedTo]);

  return (
      <div className="bg-slate-900/70 p-4 rounded-lg shadow-lg flex flex-col justify-between border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer" onClick={() => onEdit(task)}>
        <div>
          <h4 className="font-bold text-slate-100 mb-2">{task.name}</h4>
          <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
            <span>Assigned to: <span className='font-semibold text-slate-300'>{assignedUser}</span></span>
          </div>
          <div className="my-3">
            <div className="flex justify-between text-sm font-mono mb-1">
              <span className={progress >= 80 ? 'text-red-400' : 'text-green-400'}>{formatTime(displayedElapsedTime)}</span>
              <span className="text-slate-500">{formatTime(task.estimatedTime)}</span>
            </div>
            <ProgressBar progress={progress} />
          </div>
        </div>
        <div className="mt-3">
          {task.status === TaskStatus.NEW && (
            <button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="w-full flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-all text-sm"><PlayIcon /> Start Task</button>
          )}
          {task.status === TaskStatus.STARTED && (
            <button onClick={(e) => { e.stopPropagation(); handleEnd(); }} className="w-full flex items-center justify-center px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-all text-sm"><StopIcon /> End Task</button>
          )}
          {task.status === TaskStatus.REVIEW && currentUser.role === UserRole.ADMIN && (
            <button onClick={(e) => { e.stopPropagation(); handleApprove(); }} className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-all text-sm"><CheckIcon /> Approve Task</button>
          )}
        </div>
      </div>
  );
};

export default TaskCard;