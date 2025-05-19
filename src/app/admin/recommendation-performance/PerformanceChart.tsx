'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PerformanceChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded shadow-md">
        <p className="text-sm font-semibold mb-2 capitalize">{label}</p>
        <div className="space-y-1">
          <p className="text-xs">
            <span className="inline-block w-3 h-3 bg-blue-500 mr-2 rounded-full"></span>
            Lượt xem: {payload[0].value}
          </p>
          <p className="text-xs">
            <span className="inline-block w-3 h-3 bg-green-500 mr-2 rounded-full"></span>
            Thêm vào giỏ: {payload[1].value}
          </p>
          <p className="text-xs">
            <span className="inline-block w-3 h-3 bg-purple-500 mr-2 rounded-full"></span>
            Đã mua: {payload[2].value}
          </p>
          <p className="text-xs font-semibold mt-2">
            Tỷ lệ chuyển đổi: {payload[3].value.toFixed(2)}%
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.algorithmType,
      views: item.viewCount,
      carts: item.cartCount,
      purchases: item.purchaseCount,
      conversionRate: item.conversionRate
    }));
  }, [data]);

  // Tính giá trị lớn nhất cho trục Y
  const maxValue = useMemo(() => {
    if (!data.length) return 100;
    const max = Math.max(...data.map(item => item.viewCount));
    return Math.ceil(max * 1.1); // Thêm 10% khoảng trống
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
        />
        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} domain={[0, maxValue]} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar yAxisId="left" dataKey="views" name="Lượt xem" fill="#3b82f6" />
        <Bar yAxisId="left" dataKey="carts" name="Thêm vào giỏ" fill="#10b981" />
        <Bar yAxisId="left" dataKey="purchases" name="Đã mua" fill="#8b5cf6" />
        <Bar yAxisId="right" dataKey="conversionRate" name="Tỷ lệ chuyển đổi (%)" fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  );
} 