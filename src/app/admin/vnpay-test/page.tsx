'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export default function VNPayTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testOrderData, setTestOrderData] = useState({
    amount: 100000,
    orderDescription: 'Test payment for VNPay integration'
  });

  const runConfigTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vnpay/test-config');
      const result = await response.json();
      
      setTestResults(prev => [...prev, {
        success: response.ok,
        message: response.ok ? 'VNPay configuration is valid' : result.error,
        data: result
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        message: 'Failed to test configuration: ' + (error as Error).message
      }]);
    }
    setIsLoading(false);
  };

  const createTestPayment = async () => {
    setIsLoading(true);
    try {
      // First create a test order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            productId: 'test-product',
            quantity: 1,
            price: testOrderData.amount
          }],
          shippingAddress: {
            fullName: 'Test User',
            phone: '0123456789',
            address: 'Test Address',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'vnpay'
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create test order');
      }

      const orderData = await orderResponse.json();
      
      // Then create payment URL
      const paymentResponse = await fetch('/api/vnpay/create-payment-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderData.order.id,
          amount: testOrderData.amount,
          orderDescription: testOrderData.orderDescription,
          language: 'vn'
        })
      });

      const paymentResult = await paymentResponse.json();
      
      setTestResults(prev => [...prev, {
        success: paymentResponse.ok,
        message: paymentResponse.ok 
          ? 'Payment URL created successfully' 
          : paymentResult.error,
        data: paymentResult
      }]);

      if (paymentResponse.ok && paymentResult.paymentUrl) {
        // Open payment URL in new tab for testing
        window.open(paymentResult.paymentUrl, '_blank');
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        message: 'Failed to create test payment: ' + (error as Error).message
      }]);
    }
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">VNPay Integration Test</h1>
          <p className="text-gray-600 mt-2">Test VNPay sandbox configuration and payment flow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Test */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Test</CardTitle>
            <CardDescription>
              Test VNPay sandbox configuration and environment variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runConfigTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Configuration'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Test */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Flow Test</CardTitle>
            <CardDescription>
              Create a test payment and redirect to VNPay sandbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (VND)</Label>
              <Input
                id="amount"
                type="number"
                value={testOrderData.amount}
                onChange={(e) => setTestOrderData(prev => ({
                  ...prev,
                  amount: parseInt(e.target.value) || 0
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Order Description</Label>
              <Input
                id="description"
                value={testOrderData.orderDescription}
                onChange={(e) => setTestOrderData(prev => ({
                  ...prev,
                  orderDescription: e.target.value
                }))}
              />
            </div>
            <Button 
              onClick={createTestPayment} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating...' : 'Create Test Payment'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Results from VNPay integration tests</CardDescription>
            </div>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                <div className="flex items-start space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className="text-sm">
                      {result.message}
                    </AlertDescription>
                    {result.data && (
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* VNPay Information */}
      <Card>
        <CardHeader>
          <CardTitle>VNPay Sandbox Information</CardTitle>
          <CardDescription>Current VNPay sandbox configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Terminal ID:</strong> 1BB9SZY8
            </div>
            <div>
              <strong>Environment:</strong> Sandbox
            </div>
            <div>
              <strong>Payment URL:</strong> https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
            </div>
            <div>
              <strong>Merchant Portal:</strong> https://sandbox.vnpayment.vn/merchantv2/
            </div>
            <div className="md:col-span-2">
              <strong>Test Login:</strong> https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
