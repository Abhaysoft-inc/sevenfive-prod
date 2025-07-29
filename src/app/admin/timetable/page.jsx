'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TimetablePage = () => {
    const [admin, setAdmin] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [editForm, setEditForm] = useState({
        batchId: '',
        subjectId: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        validFrom: '',
        validTo: ''
    });
    const router = useRouter();

    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const timeSlots = [
        { start: '09:30', end: '10:20', label: '09:30 AM - 10:20 AM' },
        { start: '10:20', end: '11:10', label: '10:20 AM - 11:10 AM' },
        { start: '11:10', end: '12:00', label: '11:10 AM - 12:00 PM' },
        { start: '12:00', end: '12:50', label: '12:00 PM - 12:50 PM' },
        { start: '12:50', end: '14:00', label: '12:50 PM - 02:00 PM' },
        { start: '14:00', end: '14:50', label: '02:00 PM - 02:50 PM' },
        { start: '14:50', end: '15:40', label: '02:50 PM - 03:40 PM' }
    ];

    useEffect(() => {
        checkAdminAuth();
    }, []);

    useEffect(() => {
        if (admin) {
            fetchBatches();
            fetchSubjects();
            fetchSchedules();
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
        setLoading(true);
        try {
            const response = await fetch('/api/admin/schedules');
            if (response.ok) {
                const data = await response.json();
                setSchedules(data);
            } else {
                setError('Failed to fetch schedules');
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setError('Error fetching schedules');
        } finally {
            setLoading(false);
        }
    };

    // Filter schedules by selected batch
    const filteredSchedules = selectedBatch
        ? schedules.filter(schedule => schedule.batchId === selectedBatch)
        : schedules;

    // Group schedules by day and time
    const getScheduleForSlot = (day, timeSlot) => {
        return filteredSchedules.find(schedule => {
            if (schedule.dayOfWeek !== day) return false;
            const scheduleStart = schedule.startTime;
            const scheduleEnd = schedule.endTime;

            // Check if the schedule overlaps with this time slot
            return (scheduleStart < timeSlot.end && scheduleEnd > timeSlot.start);
        });
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setEditForm({
            batchId: schedule.batchId,
            subjectId: schedule.subjectId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            validFrom: schedule.validFrom ? new Date(schedule.validFrom).toISOString().split('T')[0] : '',
            validTo: schedule.validTo ? new Date(schedule.validTo).toISOString().split('T')[0] : ''
        });
    };

    const handleUpdateSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/schedules', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: editingSchedule.id,
                    ...editForm
                }),
            });

            if (response.ok) {
                await fetchSchedules();
                setEditingSchedule(null);
                setEditForm({
                    batchId: '',
                    subjectId: '',
                    dayOfWeek: '',
                    startTime: '',
                    endTime: '',
                    validFrom: '',
                    validTo: ''
                });
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update schedule');
            }
        } catch (error) {
            console.error('Error updating schedule:', error);
            setError('Error updating schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/schedules?id=${scheduleId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchSchedules();
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

    const cancelEdit = () => {
        setEditingSchedule(null);
        setEditForm({
            batchId: '',
            subjectId: '',
            dayOfWeek: '',
            startTime: '',
            endTime: ''
        });
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading timetable...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Timetable View</h1>
                    <a
                        href="/admin"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Back to Admin
                    </a>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4">
                        {error}
                    </div>
                )}

                {/* Batch Filter */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <label className="font-medium">Filter by Batch:</label>
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Batches</option>
                            {batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name} - {batch.branch?.name} ({batch.year} Year)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Timetable Grid */}
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Time</th>
                                {daysOfWeek.map((day) => (
                                    <th key={day} className="px-4 py-3 text-center font-medium text-gray-900 border-b">
                                        {day.charAt(0) + day.slice(1).toLowerCase()}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((timeSlot) => (
                                <tr key={timeSlot.start} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50">
                                        {timeSlot.label}
                                    </td>
                                    {daysOfWeek.map((day) => {
                                        const schedule = getScheduleForSlot(day, timeSlot);
                                        return (
                                            <td key={`${day}-${timeSlot.start}`} className="px-2 py-3 text-center border-l">
                                                {schedule ? (
                                                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 text-sm relative group">
                                                        <div className="font-semibold text-blue-900">
                                                            {schedule.subject.name}
                                                        </div>
                                                        <div className="text-blue-700 text-xs">
                                                            {schedule.subject.code}
                                                        </div>
                                                        <div className="text-blue-600 text-xs">
                                                            {schedule.startTime} - {schedule.endTime}
                                                        </div>
                                                        {!selectedBatch && (
                                                            <div className="text-blue-500 text-xs mt-1">
                                                                {schedule.batch.name}
                                                            </div>
                                                        )}
                                                        {/* Edit/Delete buttons - shown on hover */}
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditSchedule(schedule)}
                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-1 py-0.5 rounded mr-1"
                                                                title="Edit Schedule"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSchedule(schedule.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-1 py-0.5 rounded"
                                                                title="Delete Schedule"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-16 flex items-center justify-center text-gray-400">
                                                        -
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSchedules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        {selectedBatch ? 'No schedules found for selected batch' : 'No schedules created yet'}
                    </div>
                )}

                {/* Edit Schedule Modal */}
                {editingSchedule && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Edit Schedule</h2>

                            <form onSubmit={handleUpdateSchedule}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Batch
                                        </label>
                                        <select
                                            value={editForm.batchId}
                                            onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject
                                        </label>
                                        <select
                                            value={editForm.subjectId}
                                            onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Day of Week
                                        </label>
                                        <select
                                            value={editForm.dayOfWeek}
                                            onChange={(e) => setEditForm({ ...editForm, dayOfWeek: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Day</option>
                                            {daysOfWeek.map((day) => (
                                                <option key={day} value={day}>
                                                    {day.charAt(0) + day.slice(1).toLowerCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Time
                                            </label>
                                            <input
                                                type="time"
                                                value={editForm.startTime}
                                                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Time
                                            </label>
                                            <input
                                                type="time"
                                                value={editForm.endTime}
                                                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valid From <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={editForm.validFrom}
                                                onChange={(e) => setEditForm({ ...editForm, validFrom: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">When this schedule becomes effective</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valid To (Optional)
                                            </label>
                                            <input
                                                type="date"
                                                value={editForm.validTo}
                                                onChange={(e) => setEditForm({ ...editForm, validTo: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing schedule</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Updating...' : 'Update Schedule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimetablePage;
