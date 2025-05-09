'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type UserBehaviorStats = {
  topCategories: {
    name: string;
    count: number;
  }[];
  searchTerms: {
    term: string;
    count: number;
  }[];
  viewsByTime: {
    timeOfDay: string;
    count: number;
  }[];
  viewsByDay: {
    day: string;
    count: number;
  }[];
  conversionRate: number;
  averageViewDuration: number;
  totalUsers: number;
  activeUsers: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C'];

export default function UserBehaviorDashboard() {
  const [stats, setStats] = useState<UserBehaviorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'year'
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/user-behavior-stats?timeRange=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user behavior statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching user behavior stats:', err);
        setError('Could not load user behavior statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [timeRange]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
        <p>No data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Behavior Analysis</h2>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded p-2 text-sm"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 365 Days</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">User Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-xl font-bold">{stats.activeUsers}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-xl font-bold">{(stats.conversionRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Avg. View Duration</p>
              <p className="text-xl font-bold">{stats.averageViewDuration}s</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Popular Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Views by Time of Day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.viewsByTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeOfDay" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Views by Day of Week</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.viewsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Popular Search Terms</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={stats.searchTerms}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="term" width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#FFBB28" name="Searches" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 