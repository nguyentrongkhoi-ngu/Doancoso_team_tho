'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, BarChart3, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import PerformanceChart from './PerformanceChart';

export default function RecommendationPerformance() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [report, setReport] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [customLoading, setCustomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (selectedPeriod: 'day' | 'week' | 'month') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/recommendation-performance?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Không thể tải báo cáo hiệu suất. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomReport = async () => {
    if (!startDate || !endDate) {
      setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
      return;
    }

    if (startDate > endDate) {
      setError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      return;
    }

    setCustomLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/recommendation-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      fetchReport(period); // Refresh current report after generating custom report
    } catch (error) {
      console.error('Error generating custom report:', error);
      setError('Không thể tạo báo cáo tùy chỉnh. Vui lòng thử lại sau.');
    } finally {
      setCustomLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Báo Cáo Hiệu Suất Gợi Ý Sản Phẩm</h1>
          <Button
            variant="outline"
            onClick={() => fetchReport(period)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="preset" className="space-y-4">
          <TabsList>
            <TabsTrigger value="preset">Báo cáo định sẵn</TabsTrigger>
            <TabsTrigger value="custom">Báo cáo tùy chỉnh</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Button
                variant={period === 'day' ? 'default' : 'outline'}
                onClick={() => setPeriod('day')}
                disabled={loading}
              >
                24 giờ qua
              </Button>
              <Button
                variant={period === 'week' ? 'default' : 'outline'}
                onClick={() => setPeriod('week')}
                disabled={loading}
              >
                7 ngày qua
              </Button>
              <Button
                variant={period === 'month' ? 'default' : 'outline'}
                onClick={() => setPeriod('month')}
                disabled={loading}
              >
                30 ngày qua
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : report ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tổng lượt xem</CardTitle>
                      <CardDescription>
                        {report.startDate && report.endDate ? (
                          <span className="text-xs">
                            {formatDate(report.startDate)} - {formatDate(report.endDate)}
                          </span>
                        ) : null}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{report.totalImpressions || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tổng lượt mua</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{report.totalConversions || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tỷ lệ chuyển đổi trung bình</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {report.averageConversionRate ? report.averageConversionRate.toFixed(2) : 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>So sánh hiệu suất thuật toán gợi ý</CardTitle>
                    <CardDescription>
                      {report.algorithms && report.algorithms.length > 0
                        ? 'Phân tích hiệu quả của từng thuật toán gợi ý'
                        : 'Không có đủ dữ liệu để hiển thị'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {report.algorithms && report.algorithms.length > 0 ? (
                      <div className="h-[300px]">
                        <PerformanceChart data={report.algorithms} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-muted-foreground">
                          Chưa có đủ dữ liệu để hiển thị biểu đồ hiệu suất.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Chi tiết theo thuật toán</h2>
                  <div className="grid gap-4">
                    {report.algorithms && report.algorithms.length > 0 ? (
                      report.algorithms.map((algorithm: any, index: number) => (
                        <Card key={index} className={algorithm === report.bestPerforming ? 'border-green-500' : ''}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg capitalize">
                                {algorithm.algorithmType}
                                {algorithm === report.bestPerforming && (
                                  <span className="ml-2 text-sm text-green-500 font-normal">
                                    (Hiệu quả nhất)
                                  </span>
                                )}
                              </CardTitle>
                              <span className="text-2xl font-bold">{algorithm.conversionRate.toFixed(2)}%</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Lượt xem</p>
                                <p className="font-medium">{algorithm.viewCount}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Thêm vào giỏ</p>
                                <p className="font-medium">{algorithm.cartCount}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Đã mua</p>
                                <p className="font-medium">{algorithm.purchaseCount}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Không có dữ liệu thuật toán</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">Không có dữ liệu báo cáo</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Tạo báo cáo hiệu suất tùy chỉnh</CardTitle>
                <CardDescription>
                  Tính toán hiệu suất gợi ý sản phẩm trong khoảng thời gian tùy chọn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Từ ngày</label>
                    <DatePicker
                      date={startDate}
                      setDate={setStartDate}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Đến ngày</label>
                    <DatePicker
                      date={endDate}
                      setDate={setEndDate}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button
                  onClick={generateCustomReport}
                  disabled={customLoading || !startDate || !endDate}
                  className="mt-6 w-full"
                >
                  {customLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tính toán...
                    </>
                  ) : (
                    'Tạo báo cáo'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 