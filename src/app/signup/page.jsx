'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const branches = {
    'Electrical Engineering': ['EE1', 'EE2'],
    'Mechanical Engineering': ['ME1', 'ME2'],
    'Civil Engineering': ['CE1', 'CE2'],
    'Electronics Engineering': ['EL1', 'EL2'],
    'Computer Science': ['CS1', 'CS2'],
    'Information Technology': ['IT1', 'IT2'],
};

const years = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];

const Signup = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(true);

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await fetch('/api/auth/verify', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        // User is logged in, redirect to dashboard
                        router.push('/dashboard');
                        return;
                    }
                }
            } catch (error) {
                console.log('Auth check failed:', error);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedYear, setSelectedYear] = useState('FIRST');

    const handleBranchChange = (e) => {
        const branch = e.target.value;
        setSelectedBranch(branch);
        setSelectedBatch('');
    };

    const [name, setname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = {
                name,
                email,
                phone,
                password,
                branch: selectedBranch,
                batch: selectedBatch,
                year: selectedYear
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to register');
            }

            // Registration successful
            alert('Registration successful!');
            router.push('/dashboard'); // Redirect to dashboard
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }


    }

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
            <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-6">
                <div className="text-center mb-6">
                    <p className="text-2xl font-semibold">Welcome to SevenFive</p>
                    <p className="text-gray-600">Create an account to start tracking your attendance</p>
                </div>

                <form className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">Name</label>
                        <input
                            value={name}
                            onChange={(e) => setname(e.target.value)}
                            type="text"
                            placeholder="Your full name"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Phone</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            type="tel"
                            placeholder="9876543210"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="********"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Branch</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedBranch}
                            onChange={handleBranchChange}
                            required
                        >
                            <option value="">Select Branch</option>
                            {Object.keys(branches).map(branch => (
                                <option key={branch} value={branch}>
                                    {branch}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedBranch && (
                        <div>
                            <label className="block font-medium mb-1">Batch</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                required
                            >
                                <option value="">Select Batch</option>
                                {branches[selectedBranch].map(batch => (
                                    <option key={batch} value={batch}>
                                        {batch}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block font-medium mb-1">Year</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            required
                        >
                            {years.map(year => (
                                <option key={year} value={year}>
                                    {year} Year
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    {/* Login Link */}
                    <div className="text-center space-y-2 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Already have an account?
                        </p>
                        <Link
                            href="/login"
                            className="inline-block text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Sign in here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
