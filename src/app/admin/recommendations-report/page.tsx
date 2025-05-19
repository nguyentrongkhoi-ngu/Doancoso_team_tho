'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Đăng ký các thành phần Chart.js cần thiết
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type RecommendationMetrics = {
  totalImpressions: number;
  totalClicks: number;
  totalPurchases: number;
  clickThroughRate: number;
  conversionRate: number;
  typeMetrics: Record<string, {
    impressions: number;
    clicks: number;
    purchases: number;
    ctr: number;
    cr: number;
  }>;
};

type MetricsData = {
  period: string;
  startDate: string;
  endDate: string;
  metrics: RecommendationMetrics;
};

export default function RecommendationsReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [reportText, setReportText] = useState<string>('');
  const [showTextReport, setShowTextReport] = useState<boolean>(false);

  // Chuyển hướng nếu không phải là admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  // Lấy dữ liệu metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Lấy dữ liệu JSON
        const response = await axios.get(`/api/admin/recommendation-performance?period=${period}`);
        const data: MetricsData = response.data;
        setMetrics(data.metrics);
        
        // Lấy báo cáo văn bản
        const reportResponse = await axios.get(`/api/admin/recommendation-performance?period=${period}&format=report`, {
          responseType: 'text'
        });
        setReportText(reportResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu metrics:', err);
        setError('Không thể tải dữ liệu báo cáo: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user?.role === 'admin') {
      fetchMetrics();
    }
  }, [session, period]);

  // Tạo dữ liệu cho biểu đồ
  const createChartData = () => {
    if (!metrics || !metrics.typeMetrics) return null;
    
    const types = Object.keys(metrics.typeMetrics);
    
    return {
      labels: types,
      datasets: [
        {
          label: 'Lượt xem',
          data: types.map(type => metrics.typeMetrics[type].impressions),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Lượt click',
          data: types.map(type => metrics.typeMetrics[type].clicks),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Lượt mua',
          data: types.map(type => metrics.typeMetrics[type].purchases),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  };
  
  // Cấu hình cho biểu đồ
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hiệu quả các loại gợi ý sản phẩm',
      },
    },
  };
  
  const chartData = createChartData();

  // Nếu đang tải
  if (status === 'loading' || (session?.user?.role === 'admin' && loading)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Báo cáo hiệu quả hệ thống gợi ý</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        </div>
      </div>
    );
  }

  // Nếu không phải admin
  if (!session || session.user.role !== 'admin') {
    return null; // Sẽ chuyển hướng bởi useEffect
  }

  // Nếu có lỗi
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Báo cáo hiệu quả hệ thống gợi ý</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Lỗi! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Báo cáo hiệu quả hệ thống gợi ý</h1>
      
      {/* Bộ chọn thời gian */}
      <div className="mb-6">
        <label className="font-medium mr-2">Thời gian báo cáo:</label>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border ${period === 'day' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300'} rounded-l-lg`}
            onClick={() => setPeriod('day')}
          >
            Ngày
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${period === 'week' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setPeriod('week')}
          >
            Tuần
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${period === 'month' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300'} rounded-r-lg`}
            onClick={() => setPeriod('month')}
          >
            Tháng
          </button>
        </div>
      </div>
      
      {metrics && (
        <>
          {/* Thẻ tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-gray-500 text-sm font-medium">Tổng lượt xem</h2>
              <p className="text-3xl font-bold">{metrics.totalImpressions}</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-gray-500 text-sm font-medium">Tỷ lệ click (CTR)</h2>
              <p className="text-3xl font-bold">{(metrics.clickThroughRate * 100).toFixed(2)}%</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-gray-500 text-sm font-medium">Tỷ lệ chuyển đổi (CR)</h2>
              <p className="text-3xl font-bold">{(metrics.conversionRate * 100).toFixed(2)}%</p>
            </div>
          </div>
          
          {/* Biểu đồ */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">Phân tích theo loại gợi ý</h2>
            {chartData && <Bar options={chartOptions} data={chartData} height={80} />}
          </div>
          
          {/* Bảng chi tiết */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">Chi tiết theo loại gợi ý</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại gợi ý</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt xem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt click</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt mua</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(metrics.typeMetrics).map(([type, data]) => (
                    <tr key={type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.impressions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.clicks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.purchases}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(data.ctr * 100).toFixed(2)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(data.cr * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Báo cáo văn bản */}
          <div className="mb-4">
            <button
              onClick={() => setShowTextReport(!showTextReport)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              {showTextReport ? 'Ẩn báo cáo văn bản' : 'Hiện báo cáo văn bản'}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showTextReport ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          </div>
          
          {showTextReport && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Báo cáo văn bản</h2>
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm font-mono">
                {reportText}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
} 