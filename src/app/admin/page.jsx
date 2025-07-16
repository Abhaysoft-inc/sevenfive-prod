'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

const AdminPanel = () => {
    const [admin, setAdmin] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('branches');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    // Branch state
    const [branchName, setBranchName] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [branches, setBranches] = useState([]);

    // Batch state
    const [batchName, setBatchName] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedYear, setSelectedYear] = useState('FIRST');
    const [batches, setBatches] = useState([]);

    // Subject state
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectBranch, setSubjectBranch] = useState('');
    const [subjectYear, setSubjectYear] = useState('FIRST');
    const [subjects, setSubjects] = useState([]);

    // Schedule state
    const [scheduleBatch, setScheduleBatch] = useState('');
    const [scheduleSubject, setScheduleSubject] = useState('');
    const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState('MONDAY');
    const [scheduleStartTime, setScheduleStartTime] = useState('');
    const [scheduleEndTime, setScheduleEndTime] = useState('');
    const [schedules, setSchedules] = useState([]);

    // Users state
    const [users, setUsers] = useState([]);
    const [userStats, setUserStats] = useState([]);

    // System state
    const [resetConfirm, setResetConfirm] = useState('');

    const years = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Fetch data on component mount
    useEffect(() => {
        checkAdminAuth();
    }, []);

    useEffect(() => {
        if (admin) {
            fetchBranches();
            fetchBatches();
            fetchSubjects();
            fetchSchedules();
            fetchUsers();
        }
    }, [admin]);

    const checkAdminAuth = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user.role === 'ADMIN') {
                    setAdmin(data.user);
                } else {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('admin');
                    router.push('/admin/login');
                }
            } else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('admin');
                router.push('/admin/login');
            }
        } catch (error) {
            console.error('Admin auth check failed:', error);
            router.push('/admin/login');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleAdminLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('adminToken');
            localStorage.removeItem('admin');
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/admin/branches');
            if (response.ok) {
                const data = await response.json();
                setBranches(data);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await fetch('/api/admin/batches');
            if (response.ok) {
                const data = await response.json();
                setBatches(data);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/admin/subjects');
            if (response.ok) {
                const data = await response.json();
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await fetch('/api/admin/schedules');
            if (response.ok) {
                const data = await response.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setUserStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDatabaseReset = async () => {
        if (resetConfirm !== 'RESET DATABASE') {
            setError('Please type "RESET DATABASE" to confirm');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/reset-database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setSuccess('Database has been reset successfully!');
                setResetConfirm('');
                // Refresh all data
                fetchBranches();
                fetchBatches();
                fetchSubjects();
                fetchSchedules();
                fetchUsers();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to reset database');
            }
        } catch (error) {
            console.error('Error resetting database:', error);
            setError('Failed to reset database');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: branchName, code: branchCode })
            });

            if (response.ok) {
                setSuccess('Branch created successfully!');
                setBranchName('');
                setBranchCode('');
                fetchBranches();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create branch');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: batchName,
                    branchId: selectedBranch,
                    year: selectedYear
                })
            });

            if (response.ok) {
                setSuccess('Batch created successfully!');
                setBatchName('');
                setSelectedBranch('');
                fetchBatches();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create batch');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: subjectName,
                    code: subjectCode,
                    branch: subjectBranch,
                    year: subjectYear
                })
            });

            if (response.ok) {
                setSuccess('Subject created successfully!');
                setSubjectName('');
                setSubjectCode('');
                setSubjectBranch('');
                setSubjectYear('FIRST');
                fetchSubjects();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create subject');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batchId: scheduleBatch,
                    subjectId: scheduleSubject,
                    dayOfWeek: scheduleDayOfWeek,
                    startTime: scheduleStartTime,
                    endTime: scheduleEndTime
                })
            });

            if (response.ok) {
                setSuccess('Schedule created successfully!');
                setScheduleBatch('');
                setScheduleSubject('');
                setScheduleDayOfWeek('MONDAY');
                setScheduleStartTime('');
                setScheduleEndTime('');
                fetchSchedules();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create schedule');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/schedules?id=${scheduleId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSuccess('Schedule deleted successfully!');
                fetchSchedules();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete schedule');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Verifying admin access...</div>
            </div>
        );
    }

    if (!admin) {
        return null; // Will redirect to admin login
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-center">Admin Panel</h1>
                    <div className="flex items-center gap-4">
                        <p className="text-lg">Welcome, {admin.name}</p>
                        <button
                            onClick={handleAdminLogout}
                            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg shadow-md p-1">
                        {['branches', 'batches', 'subjects', 'schedules', 'users', 'system'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-md font-medium capitalize transition ${activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-blue-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 mb-4">
                        {success}
                    </div>
                )}

                <div className={`grid gap-8 ${activeTab === 'users' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                    {/* Forms Section - Hide for users tab */}
                    {activeTab !== 'users' && (
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-6 capitalize">
                                {activeTab === 'system' ? 'System Controls' : `Create ${activeTab.slice(0, -1)}`}
                            </h2>

                            {/* Branch Form */}
                            {activeTab === 'branches' && (
                                <form onSubmit={handleCreateBranch} className="space-y-4">
                                    <div>
                                        <label className="block font-medium mb-1">Branch Name</label>
                                        <input
                                            type="text"
                                            value={branchName}
                                            onChange={(e) => setBranchName(e.target.value)}
                                            placeholder="e.g., Computer Science"
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Branch Code</label>
                                        <input
                                            type="text"
                                            value={branchCode}
                                            onChange={(e) => setBranchCode(e.target.value)}
                                            placeholder="e.g., CS"
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Branch'}
                                    </button>
                                </form>
                            )}

                            {/* Batch Form */}
                            {activeTab === 'batches' && (
                                <form onSubmit={handleCreateBatch} className="space-y-4">
                                    <div>
                                        <label className="block font-medium mb-1">Batch Name</label>
                                        <input
                                            type="text"
                                            value={batchName}
                                            onChange={(e) => setBatchName(e.target.value)}
                                            placeholder="e.g., CS1"
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Branch</label>
                                        <select
                                            value={selectedBranch}
                                            onChange={(e) => setSelectedBranch(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name} ({branch.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Year</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {years.map((year) => (
                                                <option key={year} value={year}>
                                                    {year} Year
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Batch'}
                                    </button>
                                </form>
                            )}

                            {/* Subject Form */}
                            {activeTab === 'subjects' && (
                                <form onSubmit={handleCreateSubject} className="space-y-4">
                                    <div>
                                        <label className="block font-medium mb-1">Subject Name</label>
                                        <input
                                            type="text"
                                            value={subjectName}
                                            onChange={(e) => setSubjectName(e.target.value)}
                                            placeholder="e.g., Data Structures"
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Subject Code</label>
                                        <input
                                            type="text"
                                            value={subjectCode}
                                            onChange={(e) => setSubjectCode(e.target.value)}
                                            placeholder="e.g., DS101"
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Branch</label>
                                        <select
                                            value={subjectBranch}
                                            onChange={(e) => setSubjectBranch(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((branch) => (
                                                <option key={branch.id} value={branch.name}>
                                                    {branch.name} ({branch.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Year</label>
                                        <select
                                            value={subjectYear}
                                            onChange={(e) => setSubjectYear(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {years.map((year) => (
                                                <option key={year} value={year}>
                                                    {year} Year
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Subject'}
                                    </button>
                                </form>
                            )}

                            {/* Schedule Form */}
                            {activeTab === 'schedules' && (
                                <form onSubmit={handleCreateSchedule} className="space-y-4">
                                    <div>
                                        <label className="block font-medium mb-1">Batch</label>
                                        <select
                                            value={scheduleBatch}
                                            onChange={(e) => setScheduleBatch(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map((batch) => (
                                                <option key={batch.id} value={batch.id}>
                                                    {batch.name} - {batch.branch?.name} ({batch.year} Year)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Subject</label>
                                        <select
                                            value={scheduleSubject}
                                            onChange={(e) => setScheduleSubject(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map((subject) => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.name} ({subject.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Day of Week</label>
                                        <select
                                            value={scheduleDayOfWeek}
                                            onChange={(e) => setScheduleDayOfWeek(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {daysOfWeek.map((day) => (
                                                <option key={day} value={day}>
                                                    {day.charAt(0) + day.slice(1).toLowerCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-medium mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={scheduleStartTime}
                                                onChange={(e) => setScheduleStartTime(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-medium mb-1">End Time</label>
                                            <input
                                                type="time"
                                                value={scheduleEndTime}
                                                onChange={(e) => setScheduleEndTime(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Schedule'}
                                    </button>
                                </form>
                            )}

                            {/* Users Tab - No form needed, just viewing */}
                            {activeTab === 'users' && (
                                <div className="text-center py-16">
                                    <h3 className="text-2xl font-semibold text-gray-400 mb-4">👥 All Users Listed</h3>
                                    <p className="text-gray-400">Check the right panel to see all registered users</p>
                                </div>
                            )}

                            {/* System Tab - Database Reset */}
                            {activeTab === 'system' && (
                                <div className="space-y-6">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Danger Zone</h3>
                                        <p className="text-red-600 mb-4">This will permanently delete ALL data including users, attendance records, and system configurations.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block font-medium mb-2 text-red-700">
                                                    Type "RESET DATABASE" to confirm:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={resetConfirm}
                                                    onChange={(e) => setResetConfirm(e.target.value)}
                                                    className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    placeholder="RESET DATABASE"
                                                />
                                            </div>
                                            <button
                                                onClick={handleDatabaseReset}
                                                disabled={loading || resetConfirm !== 'RESET DATABASE'}
                                                className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Resetting Database...' : 'RESET DATABASE'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lists Section */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-6 capitalize">
                            {activeTab === 'users' ? 'All Users & Attendance' :
                                activeTab === 'system' ? 'System Status' :
                                    `Existing ${activeTab}`}
                        </h2>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {activeTab === 'branches' && branches.map((branch) => (
                                <div key={branch.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{branch.name}</p>
                                        <p className="text-sm text-gray-600">Code: {branch.code}</p>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'batches' && batches.map((batch) => (
                                <div key={batch.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{batch.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {batch.branch?.name} - {batch.year} Year
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'subjects' && subjects.map((subject) => (
                                <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{subject.name}</p>
                                        <p className="text-sm text-gray-600">
                                            Code: {subject.code} | {subject.branch} - {subject.year} Year
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'schedules' && schedules.map((schedule) => (
                                <div key={schedule.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium">{schedule.subject.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {schedule.batch.name} - {schedule.batch.branch?.name} ({schedule.batch.year} Year)
                                            </p>
                                            <p className="text-sm text-blue-600 font-medium">
                                                {schedule.dayOfWeek.charAt(0) + schedule.dayOfWeek.slice(1).toLowerCase()} • {schedule.startTime} - {schedule.endTime}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'users' && (
                                users.length === 0 ? (
                                    <div className="text-center py-8">
                                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Users Found</h3>
                                        <p className="text-gray-500">No students have registered yet.</p>
                                    </div>
                                ) : (
                                    users.map((user) => {
                                        const userStat = userStats.find(stat => stat.userId === user.id);
                                        const overallAttendance = userStat ? userStat.overallPercentage : 0;

                                        const getAttendanceColor = (percentage) => {
                                            if (percentage >= 85) return 'text-green-600 bg-green-100';
                                            if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
                                            return 'text-red-600 bg-red-100';
                                        };

                                        return (
                                            <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-semibold text-lg">{user.name}</h3>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAttendanceColor(overallAttendance)}`}>
                                                                {overallAttendance}% Overall
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                            <div>
                                                                <p><span className="font-medium">Email:</span> {user.email}</p>
                                                                <p><span className="font-medium">Branch:</span> {user.branch}</p>
                                                            </div>
                                                            <div>
                                                                <p><span className="font-medium">Batch:</span> {user.batch}</p>
                                                                <p><span className="font-medium">Year:</span> {user.year}</p>
                                                            </div>
                                                        </div>

                                                        {userStat && userStat.subjectStats && userStat.subjectStats.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <h4 className="font-medium text-sm text-gray-700 mb-2">Subject-wise Attendance:</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {userStat.subjectStats.map((subjectStat, index) => (
                                                                        <div key={index} className="flex justify-between items-center text-xs">
                                                                            <span className="text-gray-600">{subjectStat.subjectName}</span>
                                                                            <span className={`px-2 py-1 rounded ${getAttendanceColor(subjectStat.percentage)}`}>
                                                                                {subjectStat.percentage}%
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {userStat && userStat.totalClasses === 0 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <p className="text-sm text-gray-500 italic">No attendance records yet</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}

                            {activeTab === 'system' && (
                                <div className="text-center py-8">
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">System Management</h3>
                                    <p className="text-gray-500">Use the form above to reset the database</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
