
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchButtonClickAnalytics, fetchButtonClickChartData, ButtonClickStats } from '@/services/buttonClickService';
import AnalyticsChart from '@/components/admin/dashboard/AnalyticsChart';
import AnalyticsTable from '@/components/admin/dashboard/AnalyticsTable';
import DashboardFilters from '@/components/admin/dashboard/DashboardFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Clock, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [buttonName, setButtonName] = useState<string>('all');

  const {
    data: analyticsData = [],
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['buttonClickAnalytics', startDate?.toISOString(), endDate?.toISOString(), buttonName],
    queryFn: () => fetchButtonClickAnalytics(
      startDate?.toISOString(),
      endDate?.toISOString(),
      buttonName === 'all' ? undefined : buttonName
    ),
  });

  const {
    data: chartData = [],
    isLoading: chartLoading,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ['buttonClickChart', startDate?.toISOString(), endDate?.toISOString(), groupBy],
    queryFn: () => fetchButtonClickChartData(
      startDate?.toISOString(),
      endDate?.toISOString(),
      groupBy
    ),
  });

  const buttonNames = [...new Set(analyticsData.map(stat => stat.button_name))];

  const totalClicks = analyticsData.reduce((sum, stat) => sum + stat.total_clicks, 0);
  const uniqueButtons = analyticsData.length;
  const mostClickedButton = analyticsData[0]?.button_name || 'None';
  const recentActivity = analyticsData.reduce((sum, stat) => 
    sum + stat.daily_clicks.slice(-7).reduce((daySum, day) => daySum + day.clicks, 0), 0
  );

  const handleRefresh = () => {
    refetchAnalytics();
    refetchChart();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Track and analyze button click interactions across the admin panel
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time button clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Buttons</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueButtons}</div>
            <p className="text-xs text-muted-foreground">Different buttons tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{mostClickedButton.replace(/_/g, ' ')}</div>
            <p className="text-xs text-muted-foreground">Most clicked button</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity}</div>
            <p className="text-xs text-muted-foreground">Clicks in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DashboardFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        buttonName={buttonName}
        onButtonNameChange={setButtonName}
        buttonNames={buttonNames}
        onRefresh={handleRefresh}
      />

      {/* Chart */}
      <AnalyticsChart
        data={chartData}
        title="Button Clicks Over Time"
        description={`${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} breakdown of button interactions`}
      />

      {/* Table */}
      <AnalyticsTable data={analyticsData} />
    </div>
  );
};

export default AdminDashboard;
