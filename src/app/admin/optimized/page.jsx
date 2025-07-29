'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAdminDashboard, useBatchedAuth } from '../../../hooks/useOptimizedFetch';

const OptimizedAdminPanel = () => {
    // Use optimized hooks
    const { user: admin, loading: authLoading, authenticated } = useBatchedAuth();
    const { subjects, branches, batches, schedules, users, loading: dataLoading, refetch } = useAdminDashboard();

    const [activeTab, setActiveTab] = useState('branches');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    // Branch state
    const [branchName, setBranchName] = useState('');
    const [branchCode, setBranchCode] = useState('');

    // Batch state
    const [batchName, setBatchName] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedYear, setSelectedYear] = useState('FIRST');

    // Subject state
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectBranch, setSubjectBranch] = useState('');
    const [subjectYear, setSubjectYear] = useState('FIRST');

    // Schedule state
    const [scheduleBatch, setScheduleBatch] = useState('');
    const [scheduleSubject, setScheduleSubject] = useState('');
    const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState('MONDAY');
    const [scheduleStartTime, setScheduleStartTime] = useState('');
    const [scheduleEndTime, setScheduleEndTime] = useState('');
    const [scheduleValidFrom, setScheduleValidFrom] = useState('');
    const [scheduleValidTo, setScheduleValidTo] = useState('');

    // System state
    const [resetConfirm, setResetConfirm] = useState('');

    const years = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !authenticated) {
            router.push('/admin/login');
        }
    }, [authLoading, authenticated, router]);

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

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();

        try {
            const response = await fetch('/api/admin/branches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: branchName,
                    code: branchCode
                }),
            });

            if (response.ok) {
                setSuccess('Branch created successfully!');
                setBranchName('');
                setBranchCode('');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create branch');
            }
        } catch (error) {
            console.error('Error creating branch:', error);
            setError('Error creating branch');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();

        try {
            const response = await fetch('/api/admin/batches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: batchName,
                    branchId: selectedBranch,
                    year: selectedYear
                }),
            });

            if (response.ok) {
                setSuccess('Batch created successfully!');
                setBatchName('');
                setSelectedBranch('');
                setSelectedYear('FIRST');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create batch');
            }
        } catch (error) {
            console.error('Error creating batch:', error);
            setError('Error creating batch');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();

        try {
            const response = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: subjectName,
                    code: subjectCode,
                    branchId: subjectBranch,
                    year: subjectYear
                }),
            });

            if (response.ok) {
                setSuccess('Subject created successfully!');
                setSubjectName('');
                setSubjectCode('');
                setSubjectBranch('');
                setSubjectYear('FIRST');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create subject');
            }
        } catch (error) {
            console.error('Error creating subject:', error);
            setError('Error creating subject');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();

        try {
            const response = await fetch('/api/admin/schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batchId: scheduleBatch,
                    subjectId: scheduleSubject,
                    dayOfWeek: scheduleDayOfWeek,
                    startTime: scheduleStartTime,
                    endTime: scheduleEndTime,
                    validFrom: scheduleValidFrom,
                    validTo: scheduleValidTo || null
                }),
            });

            if (response.ok) {
                setSuccess('Schedule created successfully!');
                setScheduleBatch('');
                setScheduleSubject('');
                setScheduleDayOfWeek('MONDAY');
                setScheduleStartTime('');
                setScheduleEndTime('');
                setScheduleValidFrom('');
                setScheduleValidTo('');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create schedule');
            }
        } catch (error) {
            console.error('Error creating schedule:', error);
            setError('Error creating schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBranch = async (branchId) => {
        if (!confirm('Are you sure you want to delete this branch? This will also delete all associated batches and subjects.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/branches?id=${branchId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess('Branch deleted successfully!');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete branch');
            }
        } catch (error) {
            console.error('Error deleting branch:', error);
            setError('Error deleting branch');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBatch = async (batchId) => {
        if (!confirm('Are you sure you want to delete this batch? This will also delete all associated schedules.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/batches?id=${batchId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess('Batch deleted successfully!');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete batch');
            }
        } catch (error) {
            console.error('Error deleting batch:', error);
            setError('Error deleting batch');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!confirm('Are you sure you want to delete this subject? This will also delete all associated schedules.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/subjects?id=${subjectId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess('Subject deleted successfully!');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete subject');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            setError('Error deleting subject');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/schedules?id=${scheduleId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess('Schedule deleted successfully!');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete schedule');
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            setError('Error deleting schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleResetDatabase = async () => {
        if (resetConfirm !== 'RESET ALL DATA') {
            setError('Please type "RESET ALL DATA" exactly to confirm database reset');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/reset-database', {
                method: 'POST',
            });

            if (response.ok) {
                setSuccess('Database reset successfully! All data has been cleared.');
                setResetConfirm('');
                await refetch(); // Use optimized refetch
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to reset database');
            }
        } catch (error) {
            console.error('Error resetting database:', error);
            setError('Error resetting database');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (authLoading || dataLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    // Calculate summary stats
    const totalAttendance = users.reduce((sum, user) => sum + (user._count?.attendanceRecords || 0), 0);
    const activeSchedules = schedules.filter(s => !s.validTo || new Date(s.validTo) >= new Date()).length;
    const activeUsers = users.filter(u => u.role === 'STUDENT').length;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-sm text-gray-600">Welcome back, {admin?.name || 'Admin'}!</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                Performance: Optimized 🚀
                            </div>
                            <button
                                onClick={handleAdminLogout}
                                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600">{activeUsers}</div>
                        <div className="text-sm text-gray-600">Active Users</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600">{activeSchedules}</div>
                        <div className="text-sm text-gray-600">Active Schedules</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
                        <div className="text-sm text-gray-600">Total Subjects</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-2xl font-bold text-orange-600">{totalAttendance}</div>
                        <div className="text-sm text-gray-600">Total Attendance</div>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'branches', name: 'Branches', count: branches.length },
                                { id: 'batches', name: 'Batches', count: batches.length },
                                { id: 'subjects', name: 'Subjects', count: subjects.length },
                                { id: 'schedules', name: 'Schedules', count: schedules.length },
                                { id: 'users', name: 'Users', count: users.length },
                                { id: 'system', name: 'System', count: null }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.name}
                                    {tab.count !== null && (
                                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Branches Tab */}
                        {activeTab === 'branches' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Branch Management</h2>
                                
                                <form onSubmit={handleCreateBranch} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-lg font-medium mb-3">Create New Branch</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Branch Name"
                                            value={branchName}
                                            onChange={(e) => setBranchName(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Branch Code"
                                            value={branchCode}
                                            onChange={(e) => setBranchCode(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Branch'}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-4">
                                    {branches.map((branch) => (
                                        <div key={branch.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">{branch.name}</h4>
                                                <p className="text-sm text-gray-600">Code: {branch.code}</p>
                                                <p className="text-xs text-gray-500">
                                                    {branch._count?.batches || 0} batches, {branch._count?.subjects || 0} subjects
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBranch(branch.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Batches Tab */}
                        {activeTab === 'batches' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Batch Management</h2>
                                
                                <form onSubmit={handleCreateBatch} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-lg font-medium mb-3">Create New Batch</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Batch Name"
                                            value={batchName}
                                            onChange={(e) => setBatchName(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <select
                                            value={selectedBranch}
                                            onChange={(e) => setSelectedBranch(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Batch'}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-4">
                                    {batches.map((batch) => (
                                        <div key={batch.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">{batch.name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {batch.branch?.name} - {batch.year} Year
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {batch._count?.users || 0} students, {batch._count?.schedules || 0} schedules
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBatch(batch.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subjects Tab */}
                        {activeTab === 'subjects' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Subject Management</h2>
                                
                                <form onSubmit={handleCreateSubject} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-lg font-medium mb-3">Create New Subject</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Subject Name"
                                            value={subjectName}
                                            onChange={(e) => setSubjectName(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Subject Code"
                                            value={subjectCode}
                                            onChange={(e) => setSubjectCode(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <select
                                            value={subjectBranch}
                                            onChange={(e) => setSubjectBranch(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={subjectYear}
                                            onChange={(e) => setSubjectYear(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Subject'}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-4">
                                    {subjects.map((subject) => (
                                        <div key={subject.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">{subject.name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Code: {subject.code} | {subject.branch?.name} - {subject.year} Year
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {subject._count?.schedules || 0} schedules
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSubject(subject.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schedules Tab */}
                        {activeTab === 'schedules' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Schedule Management</h2>
                                
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        💡 <strong>Pro Tip:</strong> Use the dedicated{' '}
                                        <button 
                                            onClick={() => router.push('/admin/timetable')}
                                            className="underline hover:text-blue-900"
                                        >
                                            Schedule Management Page
                                        </button>
                                        {' '}for advanced schedule features with date ranges and bulk operations.
                                    </p>
                                </div>

                                <form onSubmit={handleCreateSchedule} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-lg font-medium mb-3">Create New Schedule</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <select
                                            value={scheduleBatch}
                                            onChange={(e) => setScheduleBatch(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map(batch => (
                                                <option key={batch.id} value={batch.id}>
                                                    {batch.name} - {batch.branch?.name} ({batch.year})
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={scheduleSubject}
                                            onChange={(e) => setScheduleSubject(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(subject => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.name} ({subject.code})
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={scheduleDayOfWeek}
                                            onChange={(e) => setScheduleDayOfWeek(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {daysOfWeek.map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <input
                                            type="time"
                                            value={scheduleStartTime}
                                            onChange={(e) => setScheduleStartTime(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="time"
                                            value={scheduleEndTime}
                                            onChange={(e) => setScheduleEndTime(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="date"
                                            value={scheduleValidFrom}
                                            onChange={(e) => setScheduleValidFrom(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            title="Valid From Date"
                                        />
                                        <input
                                            type="date"
                                            value={scheduleValidTo}
                                            onChange={(e) => setScheduleValidTo(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            title="Valid To Date (Optional)"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Schedule'}
                                    </button>
                                </form>

                                <div className="space-y-4">
                                    {schedules.map((schedule) => (
                                        <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">{schedule.subject?.name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {schedule.batch?.name} - {schedule.dayOfWeek} ({schedule.startTime} - {schedule.endTime})
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Valid: {schedule.validFrom ? new Date(schedule.validFrom).toLocaleDateString() : 'N/A'} to{' '}
                                                    {schedule.validTo ? new Date(schedule.validTo).toLocaleDateString() : 'Ongoing'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSchedule(schedule.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                                
                                <div className="space-y-4">
                                    {users.map((user) => (
                                        <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium">{user.name}</h4>
                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {user.batch} - {user.branch} ({user.year} Year)
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {user._count?.attendanceRecords || 0} attendance records
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* System Tab */}
                        {activeTab === 'system' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">System Management</h2>
                                
                                <div className="space-y-6">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <h3 className="text-lg font-medium text-red-800 mb-3">⚠️ Danger Zone</h3>
                                        <p className="text-sm text-red-700 mb-4">
                                            This will permanently delete ALL data from the database including users, branches, batches, subjects, schedules, and attendance records. This action cannot be undone!
                                        </p>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-red-700 mb-2">
                                                    Type "RESET ALL DATA" to confirm:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={resetConfirm}
                                                    onChange={(e) => setResetConfirm(e.target.value)}
                                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    placeholder="Type exactly: RESET ALL DATA"
                                                />
                                            </div>
                                            <button
                                                onClick={handleResetDatabase}
                                                disabled={loading || resetConfirm !== 'RESET ALL DATA'}
                                                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Resetting Database...' : 'Reset Database'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                        <h3 className="text-lg font-medium text-blue-800 mb-3">📊 Performance Info</h3>
                                        <div className="text-sm text-blue-700 space-y-2">
                                            <p>✅ Using optimized dashboard API (single request instead of 5+ separate calls)</p>
                                            <p>✅ Client-side caching enabled</p>
                                            <p>✅ Reduced database queries with proper includes</p>
                                            <p>✅ Background data fetching</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptimizedAdminPanel;
