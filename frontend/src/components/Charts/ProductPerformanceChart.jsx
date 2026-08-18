import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function ProductPerformanceChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                <Legend />
                <Bar dataKey="total_sold" fill="#3b82f6" name="Units Sold" />
                <Bar dataKey="total_revenue" fill="#10b981" name="Revenue (R)" />
            </BarChart>
        </ResponsiveContainer>
    );
}