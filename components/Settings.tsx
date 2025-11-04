
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface SettingsProps {
  users: User[];
  onCreateUser: (newUser: Omit<User, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt' | 'deletedBy'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: User;
}

const Settings: React.FC<SettingsProps> = ({ users, onCreateUser, onUpdateUser, onDeleteUser, currentUser }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.USER);

    useEffect(() => {
        if (editingUser) {
            setName(editingUser.name);
            setEmail(editingUser.email);
            setRole(editingUser.role);
        } else {
            // Reset form for creation
            setName('');
            setEmail('');
            setRole(UserRole.USER);
        }
    }, [editingUser]);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;

        if (editingUser) {
            onUpdateUser({ ...editingUser, name, email, role });
            setEditingUser(null);
        } else {
            onCreateUser({ name, email, role });
            // Reset form fields after creation
            setName('');
            setEmail('');
            setRole(UserRole.USER);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Form */}
            <div className="bg-slate-800/50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">
                    {editingUser ? 'Edit User' : 'Create New User'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-slate-400 mb-1">User Name</label>
                        <input
                            type="text"
                            id="userName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label htmlFor="userEmail" className="block text-sm font-medium text-slate-400 mb-1">User Email</label>
                        <input
                            type="email"
                            id="userEmail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="e.g. john.doe@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="userRole" className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                        <select
                            id="userRole"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value={UserRole.USER}>User</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-2">
                        {editingUser && (
                            <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all">
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-all">
                            {editingUser ? 'Update User' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* User List */}
            <div className="bg-slate-800/50 rounded-lg p-6">
                 <h2 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">Manage Users</h2>
                 <div className="space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-2">
                    {users.map(user => (
                        <div key={user.id} className={`p-3 rounded-md flex justify-between items-center transition-colors ${user.isActive ? 'bg-slate-900/50 hover:bg-slate-900' : 'bg-slate-800/30'}`}>
                            <div>
                                <p className={`font-semibold text-slate-200 ${!user.isActive ? 'line-through text-slate-500' : ''}`}>{user.name} <span className="text-xs text-slate-500">({user.role})</span></p>
                                <p className={`text-sm ${!user.isActive ? 'text-slate-600' : 'text-slate-400'}`}>{user.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleEditClick(user)}
                                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                                    aria-label={`Edit user ${user.name}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onDeleteUser(user.id)}
                                    disabled={user.id === currentUser.id || !user.isActive}
                                    className="text-slate-500 hover:text-red-500 transition-colors disabled:text-slate-700 disabled:cursor-not-allowed"
                                    aria-label={`Deactivate user ${user.name}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default Settings;