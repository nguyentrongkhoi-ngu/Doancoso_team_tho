'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import UserBehaviorDashboard from '@/components/admin/UserBehaviorDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('user-behavior');
  
  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        
        <Tabs defaultValue="user-behavior" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendation Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user-behavior">
            <UserBehaviorDashboard />
          </TabsContent>
          
          <TabsContent value="sales">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6">Sales Analytics</h2>
              <p className="text-gray-500">Sales analytics dashboard is under development.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6">Recommendation Analytics</h2>
              <p className="text-gray-500">Recommendation analytics dashboard is under development.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 