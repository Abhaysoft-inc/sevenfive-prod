'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleMinus, CircleX, LogOut, Home, Calendar, BarChart3 } from 'lucide-react';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [user, setUser] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [attendanceStats, setAttendanceStats] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDateSchedules, setSelectedDateSchedules] = useState([]);
    const [selectedDateAttendance, setSelectedDateAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchUserSchedules();
        fetchAttendanceStats();
    }, []);

    useEffect(() => {
        if (schedules.length > 0) {
            fetchAttendanceForDate(selectedDate);
        }
    }, [schedules, selectedDate]);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/login');
        }
    };

    const fetchUserSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/user/schedules', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSchedules(data.schedules);

                // Fetch attendance for today's classes
                const today = new Date().toISOString().split('T')[0];
                const todaySchedules = getTodaySchedules(data.schedules);

                for (const schedule of todaySchedules) {
                    await fetchAttendance(schedule.subject.id, today);
                }
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setError('Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceStats = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/user/attendance-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAttendanceStats(data.statistics);
            }
        } catch (error) {
            console.error('Error fetching attendance stats:', error);
        }
    };

    const fetchAttendance = async (subjectId, date) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/user/attendance?subjectId=${subjectId}&date=${date}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.attendance) {
                    setAttendance(prev => ({
                        ...prev,
                        [subjectId]: data.attendance.status
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const markAttendance = async (subjectId, status, date = null) => {
        try {
            const token = localStorage.getItem('token');
            const attendanceDate = date || new Date().toISOString().split('T')[0];

            const response = await fetch('/api/user/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subjectId,
                    status,
                    date: attendanceDate
                })
            });

            if (response.ok) {
                if (date) {
                    // Update selected date attendance
                    setSelectedDateAttendance(prev => ({
                        ...prev,
                        [subjectId]: status
                    }));
                } else {
                    // Update today's attendance
                    setAttendance(prev => ({
                        ...prev,
                        [subjectId]: status
                    }));
                }
                // Refresh attendance stats after marking attendance
                fetchAttendanceStats();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to mark attendance');
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            setError('Failed to mark attendance');
        }
    };

    const getSchedulesForDate = (allSchedules, date) => {
        const dateObj = new Date(date);
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayName = dayNames[dateObj.getDay()];

        return allSchedules.filter(schedule => schedule.dayOfWeek === dayName);
    };

    const fetchAttendanceForDate = async (date) => {
        try {
            const token = localStorage.getItem('token');
            const dateSchedules = getSchedulesForDate(schedules, date);
            const dateAttendance = {};

            for (const schedule of dateSchedules) {
                const response = await fetch(`/api/user/attendance?subjectId=${schedule.subject.id}&date=${date}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.attendance) {
                        dateAttendance[schedule.subject.id] = data.attendance.status;
                    }
                }
            }

            setSelectedDateSchedules(dateSchedules);
            setSelectedDateAttendance(dateAttendance);
        } catch (error) {
            console.error('Error fetching attendance for date:', error);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchAttendanceForDate(date);
    };

    const generateCalendarDays = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            days.push(new Date(date));
        }

        return days;
    };

    const getTodaySchedules = (allSchedules) => {
        const today = new Date();
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const todayName = dayNames[today.getDay()];

        return allSchedules.filter(schedule => schedule.dayOfWeek === todayName);
    };

    const calculateAttendanceRequirement = (stat) => {
        const targetPercentage = 75;
        const totalValidClasses = stat.totalClasses - stat.cancelledClasses;
        const presentClasses = stat.presentClasses;
        const currentPercentage = stat.attendancePercentage;

        if (currentPercentage >= targetPercentage) {
            // Calculate how many classes can be missed while maintaining 75%
            const requiredPresentClasses = Math.ceil((totalValidClasses * targetPercentage) / 100);
            const canMiss = presentClasses - requiredPresentClasses;
            return {
                type: 'maintain',
                count: Math.max(0, canMiss),
                message: canMiss > 0 ? `You can miss ${canMiss} more class${canMiss !== 1 ? 'es' : ''}` : 'Attend all remaining classes'
            };
        } else {
            // Calculate how many classes need to attend to reach 75%
            const requiredPresentClasses = Math.ceil((totalValidClasses * targetPercentage) / 100);
            const needToAttend = requiredPresentClasses - presentClasses;
            return {
                type: 'need',
                count: Math.max(0, needToAttend),
                message: `Need to attend ${needToAttend} more class${needToAttend !== 1 ? 'es' : ''} to reach 75%`
            };
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading dashboard...</div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    const todaySchedules = getTodaySchedules(schedules);

    const renderHomeTab = () => (
        <>
            <div className="mt-6 scheduletoday">
                <p className="text-xl font-semibold">Today's Schedule</p>

                {todaySchedules.length === 0 ? (
                    <div className="bg-slate-200 w-full py-10 mt-3 rounded">
                        <p className="text-center">No classes today, chill!</p>
                    </div>
                ) : (
                    todaySchedules.map((schedule) => (
                        <div key={schedule.id} className="w-full py-0.5 mt-1 rounded px-2">
                            <div className="bg-white shadow-lg border border-gray-200 flex justify-between px-6 py-4 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <CircleMinus size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[20px] rounded font-[500] text-gray-800">{schedule.subject.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {schedule.startTime} - {schedule.endTime}
                                        </p>
                                    </div>
                                </div>
                                <div className="icons flex gap-3 items-center">
                                    <button
                                        onClick={() => markAttendance(schedule.subject.id, 'CANCELLED')}
                                        className={`p-2 rounded-lg transition-all ${attendance[schedule.subject.id] === 'CANCELLED'
                                                ? 'bg-amber-200 shadow-md border-2 border-amber-400'
                                                : 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                            }`}
                                        title="Class Cancelled"
                                    >
                                        <CircleMinus color="#f59e0b" size={24} />
                                    </button>
                                    <button
                                        onClick={() => markAttendance(schedule.subject.id, 'PRESENT')}
                                        className={`p-2 rounded-lg transition-all ${attendance[schedule.subject.id] === 'PRESENT'
                                                ? 'bg-emerald-200 shadow-md border-2 border-emerald-400'
                                                : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                            }`}
                                        title="Present"
                                    >
                                        <CircleCheck color="#10b981" size={24} />
                                    </button>
                                    <button
                                        onClick={() => markAttendance(schedule.subject.id, 'ABSENT')}
                                        className={`p-2 rounded-lg transition-all ${attendance[schedule.subject.id] === 'ABSENT'
                                                ? 'bg-rose-200 shadow-md border-2 border-rose-400'
                                                : 'bg-rose-50 hover:bg-rose-100 border border-rose-200'
                                            }`}
                                        title="Absent"
                                    >
                                        <CircleX color="#f43f5e" size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Attendance Overview */}
            <div className="mt-8">
                <p className="text-xl font-semibold mb-4">Attendance Overview</p>

                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    {attendanceStats.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No attendance data available yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attendanceStats.map((stat, index) => {
                                const requirement = calculateAttendanceRequirement(stat);
                                const getStatusColor = (percentage) => {
                                    if (percentage >= 85) return 'text-green-600 bg-green-100';
                                    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
                                    return 'text-red-600 bg-red-100';
                                };

                                return (
                                    <div key={index} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg">{stat.subject.name}</p>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {stat.presentClasses}/{stat.totalClasses - stat.cancelledClasses} classes attended
                                                </p>
                                                <p className={`text-sm px-2 py-1 rounded-full inline-block ${requirement.type === 'maintain' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {requirement.message}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold px-3 py-1 rounded-full ${getStatusColor(stat.attendancePercentage)}`}>
                                                    {stat.attendancePercentage}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderCalendarTab = () => {
        const calendarDays = generateCalendarDays();
        const today = new Date();
        const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return (
            <>
                <div className="mt-6">
                    <p className="text-xl font-semibold mb-4">Select Date for Attendance</p>

                    {/* Calendar Header */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                        <h3 className="text-lg font-semibold text-center mb-4">{currentMonth}</h3>

                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center font-medium text-gray-600 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((date, index) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                const isSelected = dateStr === selectedDate;
                                const isCurrentMonth = date.getMonth() === today.getMonth();

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateChange(dateStr)}
                                        className={`
                                            p-2 text-sm rounded transition-colors
                                            ${isSelected ? 'bg-blue-500 text-white' : ''}
                                            ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                                            ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                                            ${isCurrentMonth && !isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Date Schedule */}
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <h3 className="text-lg font-semibold mb-4">
                            Schedule for {new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </h3>

                        {selectedDateSchedules.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No classes scheduled for this date
                            </div>
                        ) : (
                            selectedDateSchedules.map((schedule) => (
                                <div key={schedule.id} className="mb-3 p-4 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{schedule.subject.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {schedule.startTime} - {schedule.endTime}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => markAttendance(schedule.subject.id, 'CANCELLED', selectedDate)}
                                                className={`p-2 rounded ${selectedDateAttendance[schedule.subject.id] === 'CANCELLED' ? 'bg-yellow-200' : 'hover:bg-yellow-100'}`}
                                                title="Class Cancelled"
                                            >
                                                <CircleMinus color="orange" size={20} />
                                            </button>
                                            <button
                                                onClick={() => markAttendance(schedule.subject.id, 'PRESENT', selectedDate)}
                                                className={`p-2 rounded ${selectedDateAttendance[schedule.subject.id] === 'PRESENT' ? 'bg-green-200' : 'hover:bg-green-100'}`}
                                                title="Present"
                                            >
                                                <CircleCheck color="green" size={20} />
                                            </button>
                                            <button
                                                onClick={() => markAttendance(schedule.subject.id, 'ABSENT', selectedDate)}
                                                className={`p-2 rounded ${selectedDateAttendance[schedule.subject.id] === 'ABSENT' ? 'bg-red-200' : 'hover:bg-red-100'}`}
                                                title="Absent"
                                            >
                                                <CircleX color="red" size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </>
        );
    };

    const renderStatsTab = () => (
        <div className="mt-6">
            <p className="text-xl font-semibold mb-4">Attendance Statistics</p>

            <div className="bg-white rounded-lg shadow-md p-4">
                {attendanceStats.map((stat, index) => {
                    const getStatusColor = (percentage) => {
                        if (percentage >= 85) return 'bg-green-300';
                        if (percentage >= 75) return 'bg-yellow-300';
                        return 'bg-red-300';
                    };

                    return (
                        <div className="flex justify-between items-center p-3 border-b last:border-b-0" key={index}>
                            <div>
                                <p className="font-semibold">{stat.subject.name}</p>
                                <p className="text-sm text-gray-600">Code: {stat.subject.code}</p>
                                <p className="text-xs text-gray-500">
                                    {stat.presentClasses}/{stat.totalClasses - stat.cancelledClasses} classes attended
                                </p>
                            </div>
                            <p className={`px-3 py-2 rounded-full font-semibold ${getStatusColor(stat.attendancePercentage)}`}>
                                {stat.attendancePercentage}%
                            </p>
                        </div>
                    );
                })}

                {attendanceStats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No attendance data available
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 pb-20">
            <div className="px-4 pt-4">
                <div className="flex justify-between items-center">
                    <p className="text-3xl font-semibold">Dashboard</p>
                    <div className="flex items-center gap-4">
                        <p className="text-lg">{user.name}</p>
                        <button
                            onClick={handleLogout}
                            className="text-xl bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mt-4">
                        {error}
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'home' && renderHomeTab()}
                {activeTab === 'calendar' && renderCalendarTab()}
                {activeTab === 'stats' && renderStatsTab()}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
                <div className="flex justify-around">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center py-2 px-4 rounded-lg transition ${activeTab === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                            }`}
                    >
                        <Home size={24} />
                        <span className="text-xs mt-1">Home</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex flex-col items-center py-2 px-4 rounded-lg transition ${activeTab === 'calendar' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                            }`}
                    >
                        <Calendar size={24} />
                        <span className="text-xs mt-1">Calendar</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex flex-col items-center py-2 px-4 rounded-lg transition ${activeTab === 'stats' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                            }`}
                    >
                        <BarChart3 size={24} />
                        <span className="text-xs mt-1">Stats</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;