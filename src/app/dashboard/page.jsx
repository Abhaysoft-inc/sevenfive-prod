'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleMinus, CircleX, LogOut } from 'lucide-react';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [attendanceStats, setAttendanceStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchUserSchedules();
        fetchAttendanceStats();
    }, []);

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

    const markAttendance = async (subjectId, status) => {
        try {
            const token = localStorage.getItem('token');
            const today = new Date().toISOString().split('T')[0];

            const response = await fetch('/api/user/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subjectId,
                    status,
                    date: today
                })
            });

            if (response.ok) {
                setAttendance(prev => ({
                    ...prev,
                    [subjectId]: status
                }));
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

    const getTodaySchedules = (allSchedules) => {
        const today = new Date();
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const todayName = dayNames[today.getDay()];

        return allSchedules.filter(schedule => schedule.dayOfWeek === todayName);
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

    return (
        <div className="px-4 my-4">
            <div className="flex justify-between items-center">
                <p className="text-3xl font-semibold">Home</p>
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

            <div className="mt-6 scheduletoday">
                <p className="text-xl font-semibold">Today's Schedule</p>

                {todaySchedules.length === 0 ? (
                    <div className="bg-slate-200 w-full py-10 mt-3 rounded">
                        <p className="text-center">No classes today, chill!</p>
                    </div>
                ) : (
                    todaySchedules.map((schedule) => (
                        <div key={schedule.id} className="w-full py-0.5 mt-1 rounded px-2">
                            <div className="shadow-md flex justify-between px-6 py-4 rounded">
                                <div className="flex items-center space-x-4">
                                    <CircleMinus size={30} />
                                    <div>
                                        <p className="text-[20px] rounded font-[400]">{schedule.subject.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {schedule.startTime} - {schedule.endTime}
                                        </p>
                                    </div>
                                </div>
                                <div className="icons flex gap-2 items-center">
                                    <button
                                        onClick={() => markAttendance(schedule.subject.id, 'CANCELLED')}
                                        className={`p-1 rounded ${attendance[schedule.subject.id] === 'CANCELLED' ? 'bg-yellow-200' : ''}`}
                                        title="Class Cancelled"
                                    >
                                        <CircleMinus color="orange" size={30} />
                                    </button>
                                    <button
                                        onClick={() => markAttendance(schedule.subject.id, 'PRESENT')}
                                        className={`p-1 rounded ${attendance[schedule.subject.id] === 'PRESENT' ? 'bg-green-200' : ''}`}
                                        title="Present"
                                    >
                                        <CircleCheck color="green" size={30} />
                                    </button>
                                    <button
                                        onClick={() => markAttendance(schedule.subject.id, 'ABSENT')}
                                        className={`p-1 rounded ${attendance[schedule.subject.id] === 'ABSENT' ? 'bg-red-200' : ''}`}
                                        title="Absent"
                                    >
                                        <CircleX color="red" size={30} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="attendance">
                <p className="mt-4 text-xl font-semibold">Attendance</p>

                {attendanceStats.map((stat, index) => {
                    const getStatusColor = (percentage) => {
                        if (percentage >= 85) return 'bg-green-300';
                        if (percentage >= 75) return 'bg-yellow-300';
                        return 'bg-red-300';
                    };

                    return (
                        <div className="flex justify-between mt-3" key={index}>
                            <p>{stat.subject.name} ({stat.subject.code})</p>
                            <p className={`mr-4 px-1.5 py-1.5 rounded-full ${getStatusColor(stat.attendancePercentage)}`}>
                                {stat.attendancePercentage}%
                            </p>
                        </div>
                    );
                })}

                {attendanceStats.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                        No attendance data available
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;