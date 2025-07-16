'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TimetablePage = () => {
    const [admin, setAdmin] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    useEffect(() => {
        checkAdminAuth();
    }, []);

    useEffect(() => {
        if (admin) {
            fetchBatches();
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
    const getScheduleForSlot = (day, time) => {
        return filteredSchedules.find(schedule => {
            if (schedule.dayOfWeek !== day) return false;
            const scheduleStart = schedule.startTime;
            const scheduleEnd = schedule.endTime;
            const slotTime = time + ':00';
            return scheduleStart <= slotTime && scheduleEnd > slotTime;
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
                            {timeSlots.map((time) => (
                                <tr key={time} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50">
                                        {time}
                                    </td>
                                    {daysOfWeek.map((day) => {
                                        const schedule = getScheduleForSlot(day, time);
                                        return (
                                            <td key={`${day}-${time}`} className="px-2 py-3 text-center border-l">
                                                {schedule ? (
                                                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 text-sm">
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
            </div>
        </div>
    );
};

export default TimetablePage;
