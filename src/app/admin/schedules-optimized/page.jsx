'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminDashboard, useBatchedAuth } from '../../hooks/useOptimizedFetch';

const ScheduleManagementPage = () => {
    // Use optimized hooks
    const { user: admin, loading: authLoading, authenticated } = useBatchedAuth();
    const { subjects, batches, schedules, loading: dataLoading, refetch } = useAdminDashboard();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [filterBatch, setFilterBatch] = useState('');
    
    const [formData, setFormData] = useState({
        batchIds: [],
        subjectId: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        validFrom: '',
        validTo: ''
    });

    const router = useRouter();
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !authenticated) {
            router.push('/admin/login');
        }
    }, [authLoading, authenticated, router]);

    // Filter and paginate schedules
    const filteredSchedules = schedules.filter(schedule => {
        const matchesSearch = !searchTerm || 
            schedule.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.batch?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDay = !filterDay || schedule.dayOfWeek === filterDay;
        const matchesBatch = !filterBatch || schedule.batchId === filterBatch;
        
        return matchesSearch && matchesDay && matchesBatch;
    });

    const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);

    // Group schedules by day for better organization
    const schedulesByDay = paginatedSchedules.reduce((acc, schedule) => {
        if (!acc[schedule.dayOfWeek]) {
            acc[schedule.dayOfWeek] = [];
        }
        acc[schedule.dayOfWeek].push(schedule);
        return acc;
    }, {});

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
                    await refetch(); // Use optimized refetch
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
                    setSuccess(`Successfully created schedules for ${formData.batchIds.length} batch(es)!`);
                    await refetch(); // Use optimized refetch
                    closeModal();
                } else {
                    setError(`Failed to create ${failedResponses.length} out of ${responses.length} schedules`);
                }
            }
        } catch (error) {
            console.error('Error submitting schedule:', error);
            setError('An error occurred while submitting the schedule');
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

    // Show loading state
    if (authLoading || dataLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Manage class schedules with date ranges for historical accuracy
                                </p>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Schedule
                            </button>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search subjects or batches..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Day</label>
                                <select
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Days</option>
                                    {daysOfWeek.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Batch</label>
                                <select
                                    value={filterBatch}
                                    onChange={(e) => setFilterBatch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Batches</option>
                                    {batches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {getBatchName(batch.id)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterDay('');
                                        setFilterBatch('');
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mx-6 mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    {/* Summary Stats */}
                    <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
                                <div className="text-sm text-gray-600">Total Schedules</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">{batches.length}</div>
                                <div className="text-sm text-gray-600">Batches</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
                                <div className="text-sm text-gray-600">Subjects</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-600">{filteredSchedules.length}</div>
                                <div className="text-sm text-gray-600">Filtered Results</div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule List */}
                    <div className="px-6 py-4">
                        {Object.keys(schedulesByDay).length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                                <p className="text-gray-500">
                                    {searchTerm || filterDay || filterBatch 
                                        ? 'Try adjusting your filters or search term.' 
                                        : 'Get started by creating your first schedule.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                {Object.entries(schedulesByDay).map(([day, daySchedules]) => (
                                    <div key={day} className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
                                                {day}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {daySchedules.length} schedule{daySchedules.length !== 1 ? 's' : ''}
                                            </span>
                                        </h3>
                                        
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {daySchedules.map((schedule) => (
                                                <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{schedule.subject?.name}</h4>
                                                            <p className="text-sm text-gray-600">{schedule.subject?.code}</p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(schedule)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                                title="Edit Schedule"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(schedule.id)}
                                                                className="text-red-600 hover:text-red-800 text-sm"
                                                                title="Delete Schedule"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Batch:</span>
                                                            <span className="font-medium">{getBatchName(schedule.batchId)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Time:</span>
                                                            <span className="font-medium">{schedule.startTime} - {schedule.endTime}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Valid From:</span>
                                                            <span className="font-medium">
                                                                {schedule.validFrom ? new Date(schedule.validFrom).toLocaleDateString() : 'Not set'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Valid To:</span>
                                                            <span className="font-medium">
                                                                {schedule.validTo ? new Date(schedule.validTo).toLocaleDateString() : 'Ongoing'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-700">
                                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSchedules.length)} of {filteredSchedules.length} results
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                                if (pageNum > totalPages) return null;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-1 border text-sm rounded ${
                                                            currentPage === pageNum 
                                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Create/Edit Schedule */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                            </h2>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-6">
                                    {/* Batch Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {editingSchedule ? 'Batch *' : 'Select Batches *'}
                                        </label>
                                        {editingSchedule ? (
                                            // For editing, show single batch selection
                                            <select
                                                value={formData.batchIds[0] || ''}
                                                onChange={(e) => setFormData({ ...formData, batchIds: [e.target.value] })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Select a batch</option>
                                                {batches.map(batch => (
                                                    <option key={batch.id} value={batch.id}>
                                                        {getBatchName(batch.id)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            // For creating, show multiple batch selection
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[3rem] bg-gray-50">
                                                    {formData.batchIds.length === 0 ? (
                                                        <span className="text-gray-500 italic">No batches selected</span>
                                                    ) : (
                                                        formData.batchIds.map(batchId => {
                                                            const batch = batches.find(b => b.id === batchId);
                                                            return batch ? (
                                                                <span
                                                                    key={batchId}
                                                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                                                                >
                                                                    {batch.name} - {batch.branch?.name}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData({ 
                                                                            ...formData, 
                                                                            batchIds: formData.batchIds.filter(id => id !== batchId) 
                                                                        })}
                                                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ) : null;
                                                        })
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {batches.map(batch => (
                                                        <label key={batch.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
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
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm">{getBatchName(batch.id)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, batchIds: batches.map(b => b.id) })}
                                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, batchIds: [] })}
                                                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
                                                    >
                                                        Clear All
                                                    </button>
                                                    {['FIRST', 'SECOND', 'THIRD', 'FOURTH'].map(year => {
                                                        const yearBatches = batches.filter(b => b.year === year).map(b => b.id);
                                                        return yearBatches.length > 0 ? (
                                                            <button
                                                                key={year}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, batchIds: yearBatches });
                                                                }}
                                                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                                                            >
                                                                {year} Year
                                                            </button>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Subject Selection */}
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
                                            <option value="">Select a subject</option>
                                            {subjects.map(subject => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.name} ({subject.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Day of Week */}
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
                                            <option value="">Select day</option>
                                            {daysOfWeek.map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Time Selection */}
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

                                    {/* Date Range */}
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
                </div>
            )}
        </div>
    );
};

export default ScheduleManagementPage;
