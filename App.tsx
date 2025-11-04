
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Reports from './components/Reports';
import Archive from './components/Archive';
import Header from './components/Header';
import Settings from './components/Settings';
import Login from './components/Login';
import { User, Task, TaskStatus, UserRole } from './types';
import NotificationComponent from './components/Notification';
import TaskDetailModal from './components/TaskDetailModal';
import { api } from './api';

export type Tab = 'dashboard' | 'tasks' | 'reports' | 'archive' | 'settings';

export const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const loadData = useCallback(async () => {
      try {
          const [fetchedUsers, fetchedTasks] = await Promise.all([
              api.getUsers(),
              api.getTasks()
          ]);
          setUsers(fetchedUsers);
          setTasks(fetchedTasks);
      } catch (error) {
          showNotification('Failed to load data from the server.', 'error');
      }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
        setIsLoading(true);
        const user = await api.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            await loadData();
        }
        setIsLoading(false);
    };
    checkSession();
  }, [loadData]);
  
  useEffect(() => {
    if (currentUser && currentUser.role !== UserRole.ADMIN && (activeTab === 'reports' || activeTab === 'settings')) {
        setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  const handleLogin = async (email: string) => {
    try {
        const user = await api.login(email);
        setCurrentUser(user);
        await loadData();
        showNotification(`Welcome back, ${user.name}!`, 'success');
    } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Login failed', 'error');
    }
  };

  const handleLogout = async () => {
      await api.logout();
      setCurrentUser(null);
      setUsers([]);
      setTasks([]);
      showNotification('You have been logged out.', 'success');
  };

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    if (!currentUser) return;
    try {
        const result = await api.updateTask(updatedTask, currentUser.email);
        setTasks(prevTasks => prevTasks.map(task => (task.id === result.id ? result : task)));
    } catch (error) {
        showNotification('Failed to update task.', 'error');
    }
  }, [currentUser]);

  const handleCreateTask = async (newTaskData: Omit<Task, 'id' | 'elapsedTime' | 'status' | 'createdAt' | 'createdBy' | 'logs' | 'notes' | 'updatedAt' | 'updatedBy'>) => {
    if (!currentUser) return;
    const taskPayload = {
        ...newTaskData,
        elapsedTime: 0,
        status: TaskStatus.NEW,
        createdBy: currentUser.email,
        createdAt: Date.now(),
        logs: [{
          timestamp: Date.now(),
          user: currentUser.email,
          change: 'Task created.'
        }],
        notes: [],
    };
    try {
        const createdTask = await api.createTask(taskPayload);
        setTasks(prev => [...prev, createdTask]);
        showNotification('Task created successfully!', 'success');
    } catch (error) {
        showNotification('Failed to create task.', 'error');
    }
  };
  
  const handleEditTask = (taskToEdit: Task) => {
    setEditingTask(taskToEdit);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  const handleModalSubmit = async (taskData: Parameters<typeof handleCreateTask>[0] | Task) => {
      if ('id' in taskData) {
          await handleUpdateTask(taskData);
          showNotification('Task updated successfully!', 'success');
      } else {
          await handleCreateTask(taskData);
      }
      setIsModalOpen(false);
      setEditingTask(null);
  };

  const handleArchiveTasks = async (taskIds: string[]) => {
    if (!currentUser) return;
    try {
        const { updatedTasks } = await api.softDeleteTasks(taskIds, currentUser.email);
        setTasks(prevTasks => prevTasks.map(task => {
            const updated = updatedTasks.find(u => u.id === task.id);
            return updated || task;
        }));
        showNotification(`${taskIds.length} task(s) archived successfully!`, 'success');
    } catch (error) {
        showNotification('Failed to archive tasks.', 'error');
    }
  };

  const handleCreateUser = async (newUser: Omit<User, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    try {
        const createdUser = await api.createUser(newUser, currentUser?.email || null);
        setUsers(prev => [...prev, createdUser]);
        showNotification('User created successfully!', 'success');
    } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Failed to create user.', 'error');
    }
  };

  const handleUpdateUser = useCallback(async (updatedUser: User) => {
    if (!currentUser) return;

    const adminUsers = users.filter(u => u.role === UserRole.ADMIN);
    const userBeingUpdated = users.find(u => u.id === updatedUser.id);
    if (adminUsers.length === 1 && userBeingUpdated?.role === UserRole.ADMIN && updatedUser.role !== UserRole.ADMIN) {
        showNotification('Cannot remove the last administrator.', 'error');
        return;
    }
    
    try {
        const result = await api.updateUser(updatedUser, currentUser.email);
        setUsers(prevUsers => prevUsers.map(user => (user.id === result.id ? result : user)));
        // Refresh tasks in case emails were cascaded
        const updatedTasks = await api.getTasks();
        setTasks(updatedTasks);
        showNotification('User updated successfully!', 'success');
    } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Failed to update user.', 'error');
    }
  }, [users, currentUser]);

  const handleDeactivateUser = async (userId: string) => {
    const userToDeactivate = users.find(u => u.id === userId);
    if (!userToDeactivate || !currentUser) return;

    if (currentUser.id === userId) {
        showNotification("You can't deactivate your own account.", 'error');
        return;
    }
    
    const adminUsers = users.filter(u => u.role === UserRole.ADMIN && u.isActive);
    if (userToDeactivate.role === UserRole.ADMIN && adminUsers.length <= 1) {
        showNotification('Cannot deactivate the last administrator.', 'error');
        return;
    }

    try {
        const deactivatedUser = await api.deactivateUser(userId, currentUser.email);
        setUsers(prev => prev.map(u => u.id === userId ? deactivatedUser : u));
        showNotification('User deactivated successfully!', 'success');
    } catch (error) {
        showNotification('Failed to deactivate user.', 'error');
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const archivedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED || task.status === TaskStatus.DELETED);
    const activeTasks = tasks.filter(task => task.status !== TaskStatus.DELETED);


    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={activeTasks} currentUser={currentUser} onUpdateTask={handleUpdateTask} onEditTask={handleEditTask} showNotification={showNotification} />;
      case 'tasks':
        return <Tasks tasks={activeTasks} onEditTask={handleEditTask} users={users} currentUser={currentUser} />;
      case 'reports':
        return <Reports tasks={tasks} users={users} />;
      case 'archive':
        return <Archive tasks={archivedTasks} onDeleteTasks={handleArchiveTasks} users={users} currentUser={currentUser} />;
      case 'settings':
        return <Settings users={users} onCreateUser={handleCreateUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeactivateUser} currentUser={currentUser} />;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="text-xl text-slate-400">Loading Application...</div>
        </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {notification && <NotificationComponent message={notification.message} type={notification.type} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
           <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-100 capitalize">{activeTab}</h1>
            {currentUser.role === UserRole.ADMIN && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-all transform hover:scale-105"
              >
                + Create Task
              </button>
            )}
          </div>
          {renderContent()}
        </div>
      </main>
      
      {notification && <NotificationComponent message={notification.message} type={notification.type} />}

      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSubmit={handleModalSubmit}
        task={editingTask}
        currentUser={currentUser}
        users={users}
      />
    </div>
  );
};

export default App;