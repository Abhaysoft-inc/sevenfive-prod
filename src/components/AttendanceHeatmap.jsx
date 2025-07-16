'use client';

import React, { useEffect, useRef } from 'react';
import CalHeatmap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';

const AttendanceHeatmap = ({ attendanceData, className = '' }) => {
    const calRef = useRef(null);
    const heatmapRef = useRef(null);

    useEffect(() => {
        if (!attendanceData || !calRef.current) return;

        // Clear previous heatmap
        if (heatmapRef.current) {
            heatmapRef.current.destroy();
        }

        // Process attendance data for Cal-Heatmap
        const processedData = {};

        attendanceData.forEach(record => {
            const date = record.date;

            // Count classes attended that day
            if (!processedData[date]) {
                processedData[date] = 0;
            }

            // Add 1 for each class attended (only count PRESENT status)
            if (record.status === 'PRESENT') {
                processedData[date] += 1;
            }
        });

        // Create new heatmap
        const cal = new CalHeatmap();
        heatmapRef.current = cal;

        cal.paint({
            element: calRef.current,
            data: {
                source: processedData,
                type: 'json'
            },
            date: {
                start: new Date(new Date().getFullYear(), 0, 1), // Start of current year
                max: new Date()
            },
            range: 12, // Show 12 months
            scale: {
                color: {
                    type: 'threshold',
                    range: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'],
                    domain: [1, 2, 4, 6]
                }
            },
            domain: {
                type: 'month',
                gutter: 4,
                label: {
                    text: 'MMM',
                    textAlign: 'start',
                    position: 'top'
                }
            },
            subDomain: {
                type: 'day',
                radius: 2,
                width: 11,
                height: 11,
                gutter: 2
            }
        });

        return () => {
            if (heatmapRef.current) {
                heatmapRef.current.destroy();
            }
        };
    }, [attendanceData]);

    return (
        <div className={`attendance-heatmap ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    📊 Attendance Heat Map
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Visual representation of your daily attendance throughout the year. Darker colors indicate more classes attended on that day.
                </p>

                {/* Legend */}
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Less</span>
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gray-200 rounded-sm border"></div>
                        <div className="w-3 h-3 bg-green-200 rounded-sm border"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-sm border"></div>
                        <div className="w-3 h-3 bg-green-600 rounded-sm border"></div>
                        <div className="w-3 h-3 bg-green-800 rounded-sm border"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div
                ref={calRef}
                className="cal-heatmap-container bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto"
                style={{ minHeight: '200px' }}
            />

            <div className="mt-2 text-xs text-gray-500">
                💡 Tip: Hover over each day to see detailed attendance information
            </div>
        </div>
    );
};

export default AttendanceHeatmap;
