
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, User } from '../types';

interface ReportsProps {
  tasks: Task[];
  users: User[];
}

const formatTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0h 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatTimeVerbose = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0h 0m 0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// --- Chart Components ---

const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-4 text-slate-200">{title}</h3>
        <div className="flex items-center justify-center min-h-[16rem] bg-slate-700/50 rounded-md text-slate-500">
            {children}
        </div>
    </div>
);

const NoData: React.FC = () => <div className="text-slate-500">Not enough data to display chart.</div>;

const PieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <NoData />;

    let accumulatedPercentage = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-center w-full p-4 gap-6">
            <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-48 h-48 transform -rotate-90">
                {data.map(({ value, color }) => {
                    const percentage = value / total;
                    if (percentage === 0) return null;

                    const [startX, startY] = getCoordinatesForPercent(accumulatedPercentage);
                    accumulatedPercentage += percentage;
                    const [endX, endY] = getCoordinatesForPercent(accumulatedPercentage);
                    const largeArcFlag = percentage > 0.5 ? 1 : 0;
                    
                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        'L 0 0',
                    ].join(' ');
                    
                    return <path key={color} d={pathData} fill={color} />;
                })}
            </svg>
            <div className="flex flex-col gap-2">
                {data.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                        <span className="text-slate-300">{name}:</span>
                        <span className="font-semibold text-white">{value} ({value > 0 ? ((value/total)*100).toFixed(0) : 0}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    if (data.length === 0) return <NoData />;
    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    
    return (
         <div className="w-full h-64 p-4 flex justify-around items-end gap-2">
            {data.map(({ name, value }) => (
                <div key={name} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                    <div className="absolute -top-8 bg-slate-900/80 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTimeVerbose(value)}
                    </div>
                    <div 
                        className="w-full bg-cyan-600 hover:bg-cyan-500 rounded-t-md transition-all" 
                        style={{ height: `${(value / maxValue) * 100}%` }}
                    />
                    <span className="text-xs text-slate-400 truncate">{name}</span>
                </div>
            ))}
        </div>
    );
}

const LineChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    if (data.length < 2) return <NoData />;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const points = data.map((point, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');
  
    return (
        <div className="w-full h-64 p-4 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                 <polyline fill="none" stroke="#0891b2" strokeWidth="2" points={points} />
            </svg>
            <div className="absolute inset-0 p-4 flex justify-between">
                {data.map((point, i) => (
                    <div key={i} className="flex flex-col items-center justify-end h-full relative">
                       <span className="text-xs text-white bg-slate-900/50 px-1 rounded">{point.value}</span>
                       <div className="flex-grow"></div>
                       <span className="text-xs text-slate-400">{point.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


const Reports: React.FC<ReportsProps> = ({ tasks, users }) => {
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (selectedUser !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === selectedUser);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case 'daily':
        filtered = filtered.filter(task => new Date(task.createdAt).toDateString() === now.toDateString());
        break;
      case 'weekly':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        filtered = filtered.filter(task => new Date(task.createdAt) >= lastWeek);
        break;
      case 'monthly':
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(task => new Date(task.createdAt) >= firstDayOfMonth);
        break;
      default:
        break;
    }
    return filtered;
  }, [tasks, selectedUser, dateRange]);

  const kpiData = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === TaskStatus.COMPLETED);
    
    const totalCompletionTime = completedTasks.reduce((acc, task) => acc + task.elapsedTime, 0);
    const avgCompletionTime = completedTasks.length > 0 ? totalCompletionTime / completedTasks.length : 0;
    
    const onTimeTasks = completedTasks.filter(t => t.elapsedTime <= t.estimatedTime).length;
    const onTimePercentage = completedTasks.length > 0 ? (onTimeTasks / completedTasks.length) * 100 : 0;
    
    return {
        totalTasks,
        avgCompletionTime: formatTime(avgCompletionTime),
        onTimePercentage: `${onTimePercentage.toFixed(0)}%`
    };
  }, [filteredTasks]);

  // Data for Charts
  const taskStatusData = useMemo(() => {
    const statuses = {
      [TaskStatus.NEW]: 0,
      [TaskStatus.STARTED]: 0,
      [TaskStatus.REVIEW]: 0,
      [TaskStatus.COMPLETED]: 0,
    };
    filteredTasks.forEach(task => {
        statuses[task.status] = (statuses[task.status] || 0) + 1;
    });
    return [
      { name: 'New', value: statuses[TaskStatus.NEW], color: '#60a5fa' },
      { name: 'Started', value: statuses[TaskStatus.STARTED], color: '#facc15' },
      { name: 'In Review', value: statuses[TaskStatus.REVIEW], color: '#a78bfa' },
      { name: 'Completed', value: statuses[TaskStatus.COMPLETED], color: '#4ade80' },
    ];
  }, [filteredTasks]);

  const userPerformanceData = useMemo(() => {
    const userTimes: { [key: string]: number } = {};
    // Calculate performance based on time spent on COMPLETED tasks only
    filteredTasks
      .filter(task => task.status === TaskStatus.COMPLETED)
      .forEach(task => {
        userTimes[task.assignedTo] = (userTimes[task.assignedTo] || 0) + task.elapsedTime;
      });
    return Object.entries(userTimes).map(([email, time]) => ({
      name: users.find(u => u.email === email)?.name || email.split('@')[0],
      value: time,
    })).sort((a,b) => b.value - a.value).slice(0, 10); // Top 10 users
  }, [filteredTasks, users]);

  const completionTrendData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    return last7Days.map(day => {
        const count = tasks.filter(task => 
            task.status === TaskStatus.COMPLETED &&
            task.completedAt &&
            new Date(task.completedAt).toDateString() === day.toDateString()
        ).length;
        return { name: day.toLocaleDateString('en-US', { weekday: 'short' }), value: count };
    });
}, [tasks]);


  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col sm:flex-row flex-wrap items-center gap-4">
        <div className="w-full sm:w-auto">
          <label className="text-sm text-slate-400 mr-2">User:</label>
          <select 
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2"
          >
            <option value="all">All Users</option>
            {users.map(u => <option key={u.id} value={u.email}>{u.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="text-sm text-slate-400 mr-2">Date Range:</label>
          <select 
             value={dateRange}
             onChange={e => setDateRange(e.target.value)}
             className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2"
          >
            <option value="all">All Time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="flex-grow flex flex-col sm:flex-row sm:justify-end gap-2 w-full sm:w-auto">
           <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg">Export (PDF)</button>
           <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">Export (Excel)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 p-4 rounded-lg text-center">
            <h4 className="text-slate-400 font-semibold">Total Tasks</h4>
            <p className="text-3xl font-bold text-cyan-400">{kpiData.totalTasks}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg text-center">
            <h4 className="text-slate-400 font-semibold">Avg. Completion Time</h4>
            <p className="text-3xl font-bold text-cyan-400">{kpiData.avgCompletionTime}</p>
        </div>
         <div className="bg-slate-800/50 p-4 rounded-lg text-center">
            <h4 className="text-slate-400 font-semibold">On-Time Percentage</h4>
            <p className="text-3xl font-bold text-cyan-400">{kpiData.onTimePercentage}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="Task Status Distribution">
          <PieChart data={taskStatusData} />
        </ChartWrapper>
        <ChartWrapper title="User Performance (Time on Completed Tasks)">
           <BarChart data={userPerformanceData} />
        </ChartWrapper>
        <ChartWrapper title="Completed Tasks (Last 7 Days)">
           <LineChart data={completionTrendData} />
        </ChartWrapper>
      </div>
    </div>
  );
};

export default Reports;