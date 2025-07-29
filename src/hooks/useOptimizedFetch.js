// Custom hook for optimized data fetching with caching
import { useState, useEffect, useCallback } from 'react';

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(timestamp) {
    return Date.now() - timestamp < CACHE_TTL;
}

function getFromCache(key) {
    const cached = cache.get(key);
    if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

export function useOptimizedFetch(url, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first (unless bypassed)
            if (!bypassCache) {
                const cached = getFromCache(url);
                if (cached) {
                    setData(cached);
                    setLoading(false);
                    return cached;
                }
            }

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Cache the result
            setCache(url, result);
            setData(result);
            
            return result;
        } catch (err) {
            setError(err.message);
            console.error(`Error fetching ${url}:`, err);
        } finally {
            setLoading(false);
        }
    }, [url, options]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = useCallback(() => fetchData(true), [fetchData]);

    return { data, loading, error, refetch };
}

// Optimized admin dashboard hook
export function useAdminDashboard() {
    const { data, loading, error, refetch } = useOptimizedFetch('/api/admin/dashboard');
    
    return {
        subjects: data?.subjects || [],
        branches: data?.branches || [],
        batches: data?.batches || [],
        schedules: data?.schedules || [],
        loading,
        error,
        refetch
    };
}

// Batch multiple API calls into single requests
export function useBatchedAuth() {
    const [authState, setAuthState] = useState({
        user: null,
        loading: true,
        authenticated: false
    });

    const checkAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            if (!token) {
                setAuthState({ user: null, loading: false, authenticated: false });
                return;
            }

            // Check cache first
            const cached = getFromCache('auth-verify');
            if (cached) {
                setAuthState({ user: cached, loading: false, authenticated: true });
                return;
            }

            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                setCache('auth-verify', user);
                setAuthState({ user, loading: false, authenticated: true });
            } else {
                // Clear invalid tokens
                localStorage.removeItem('adminToken');
                localStorage.removeItem('token');
                setAuthState({ user: null, loading: false, authenticated: false });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setAuthState({ user: null, loading: false, authenticated: false });
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return { ...authState, refetch: checkAuth };
}

// Debounced API calls for search/filter operations
export function useDebouncedApi(url, params, delay = 500) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!params) return;

            setLoading(true);
            setError(null);

            try {
                const queryString = new URLSearchParams(params).toString();
                const fullUrl = queryString ? `${url}?${queryString}` : url;
                
                const response = await fetch(fullUrl);
                if (!response.ok) throw new Error('Failed to fetch');
                
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [url, params, delay]);

    return { data, loading, error };
}
