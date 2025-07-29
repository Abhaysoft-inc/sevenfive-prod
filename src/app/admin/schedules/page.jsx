'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ScheduleManagementPage = () => {
    const [admin, setAdmin] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [formData, setFormData] = useState({
        batchIds: [], // Changed from batchId to batchIds array
        subjectId: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        validFrom: '',
        validTo: ''
    });

    const router = useRouter();
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    useEffect(() => {
        checkAdminAuth();
    }, []);

    useEffect(() => {
        if (admin) {
            fetchData();
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schedulesRes, batchesRes, subjectsRes] = await Promise.all([
                fetch('/api/admin/schedules'),
                fetch('/api/admin/batches'),
                fetch('/api/admin/subjects')
            ]);

            if (schedulesRes.ok) {
                const schedulesData = await schedulesRes.json();
                setSchedules(schedulesData);
            }

            if (batchesRes.ok) {
                const batchesData = await batchesRes.json();
                setBatches(batchesData);
            }

            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json();
                setSubjects(subjectsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (editingSchedule) {
                // For editing, use the existing single batch approach
                const response = await fetch('/api/admin/schedules', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: editingSchedule.id,
                        batchId: formData.batchIds[0], // Use first batch for editing
                        subjectId: formData.subjectId,
                        dayOfWeek: formData.dayOfWeek,
                        startTime: formData.startTime,
                        endTime: formData.endTime,
                        validFrom: formData.validFrom,
                        validTo: formData.validTo || null
                    }),
                });

                if (response.ok) {
                    setSuccess('Schedule updated successfully!');
                    await fetchData();
                    closeModal();
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to update schedule');
                }
            } else {
                // For creating, handle multiple batches
                const promises = formData.batchIds.map(batchId =>
                    fetch('/api/admin/schedules', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            batchId,
                            subjectId: formData.subjectId,
                            dayOfWeek: formData.dayOfWeek,
                            startTime: formData.startTime,
                            endTime: formData.endTime,
                            validFrom: formData.validFrom,
                            validTo: formData.validTo || null
                        }),
                    })
                );

                const responses = await Promise.all(promises);
                const failedResponses = responses.filter(response => !response.ok);

                if (failedResponses.length === 0) {
                    const batchCount = formData.batchIds.length;
                    setSuccess(`${batchCount} schedule${batchCount > 1 ? 's' : ''} created successfully!`);
                    await fetchData();
                    closeModal();
                } else {
                    const errorMessages = await Promise.all(
                        failedResponses.map(async response => {
                            const errorData = await response.json();
                            return errorData.error || 'Failed to create schedule';
                        })
                    );
                    setError(`Some schedules failed to create: ${errorMessages.join(', ')}`);
                }
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            setError('Error saving schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            batchIds: [schedule.batchId], // Convert single batch to array for consistency
            subjectId: schedule.subjectId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            validFrom: schedule.validFrom ? new Date(schedule.validFrom).toISOString().split('T')[0] : '',
            validTo: schedule.validTo ? new Date(schedule.validTo).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (scheduleId) => {
        if (!confirm('Are you sure you want to delete this schedule? This will NOT affect existing attendance records, but the class will no longer appear in the timetable.')) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/admin/schedules?id=${scheduleId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess('Schedule deleted successfully!');
                await fetchData();
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

    const openCreateModal = () => {
        setEditingSchedule(null);
        setFormData({
            batchIds: [],
            subjectId: '',
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            validFrom: '',
            validTo: ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSchedule(null);
        setFormData({
            batchIds: [],
            subjectId: '',
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            validFrom: '',
            validTo: ''
        });
    };

    const getBatchName = (batchId) => {
        const batch = batches.find(b => b.id === batchId);
        return batch ? `${batch.name} - ${batch.branch?.name} (${batch.year} Year)` : 'Unknown Batch';
    };

    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? `${subject.name} (${subject.code})` : 'Unknown Subject';
    };

    const formatDay = (day) => {
        return day.charAt(0) + day.slice(1).toLowerCase();
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Verifying admin access...</div>
            </div>
        );
    }

    if (!admin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Schedule Management</h1>
                    <div className="space-x-4">
                        <a
                            href="/admin/timetable"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            View Timetable
                        </a>
                        <a
                            href="/admin"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Admin
                        </a>
                    </div>
                </div>

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

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">All Schedules</h2>
                        <button
                            onClick={openCreateModal}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Add New Schedule
                        </button>
                    </div>

                    {/* Schedule Summary */}
                    {schedules.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                                {daysOfWeek.map(day => {
                                    const dayCount = schedules.filter(s => s.dayOfWeek === day).length;
                                    return (
                                        <div key={day} className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-sm font-medium text-gray-600">{formatDay(day)}</div>
                                            <div className="text-lg font-bold text-blue-600">{dayCount}</div>
                                            <div className="text-xs text-gray-500">schedule{dayCount !== 1 ? 's' : ''}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 mb-4">
                        <p className="text-sm mb-2">
                            <strong>Note:</strong> When you update or delete schedules, all existing attendance records are preserved.
                        </p>
                        <p className="text-sm">
                            <strong>Time Slots:</strong> 09:30-10:20, 10:20-11:10, 11:10-12:00, 12:00-12:50, 12:50-14:00, 14:00-14:50, 14:50-15:40
                        </p>
                    </div>

                    {loading && schedules.length === 0 ? (
                        <div className="text-center py-8">Loading schedules...</div>
                    ) : (
                        <div className="space-y-6">
                            {schedules.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No schedules found. Click "Add New Schedule" to create one.
                                </div>
                            ) : (
                                daysOfWeek.map((day) => {
                                    const daySchedules = schedules
                                        .filter(schedule => schedule.dayOfWeek === day)
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime));

                                    if (daySchedules.length === 0) return null;

                                    return (
                                        <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {formatDay(day)} ({daySchedules.length} schedule{daySchedules.length !== 1 ? 's' : ''})
                                                </h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subject</th>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Batch</th>
                                                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {daySchedules.map((schedule) => (
                                                            <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                    {schedule.startTime} - {schedule.endTime}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    <div className="font-medium">{getSubjectName(schedule.subjectId)}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                                    {getBatchName(schedule.batchId)}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={() => handleEdit(schedule)}
                                                                        className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600 transition text-sm"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(schedule.id)}
                                                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Modal for Create/Edit Schedule */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">
                                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editingSchedule ? 'Batch *' : 'Batches * (Hold Ctrl/Cmd to select multiple)'}
                                        </label>
                                        {editingSchedule ? (
                                            <select
                                                value={formData.batchIds[0] || ''}
                                                onChange={(e) => setFormData({ ...formData, batchIds: [e.target.value] })}
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
                                        ) : (
                                            <div>
                                                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                                                    {batches.map((batch) => (
                                                        <label key={batch.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.batchIds.includes(batch.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData({ ...formData, batchIds: [...formData.batchIds, batch.id] });
                                                                    } else {
                                                                        setFormData({ ...formData, batchIds: formData.batchIds.filter(id => id !== batch.id) });
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <span className="text-sm">
                                                                {batch.name} - {batch.branch?.name} ({batch.year} Year)
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {!editingSchedule && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, batchIds: batches.map(b => b.id) })}
                                                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, batchIds: [] })}
                                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                                                >
                                                    Clear All
                                                </button>
                                                {['FIRST', 'SECOND', 'THIRD', 'FOURTH'].map(year => (
                                                    <button
                                                        key={year}
                                                        type="button"
                                                        onClick={() => {
                                                            const yearBatches = batches.filter(b => b.year === year).map(b => b.id);
                                                            setFormData({ ...formData, batchIds: yearBatches });
                                                        }}
                                                        className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200"
                                                    >
                                                        {year} Year
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {!editingSchedule && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Selected: {formData.batchIds.length} batch{formData.batchIds.length !== 1 ? 'es' : ''}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject *
                                        </label>
                                        <select
                                            value={formData.subjectId}
                                            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
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
                                            Day of Week *
                                        </label>
                                        <select
                                            value={formData.dayOfWeek}
                                            onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Day</option>
                                            {daysOfWeek.map((day) => (
                                                <option key={day} value={day}>
                                                    {formatDay(day)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Time *
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Time *
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                                                value={formData.validFrom}
                                                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
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
                                                value={formData.validTo}
                                                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing schedule</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
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

export default ScheduleManagementPage;
