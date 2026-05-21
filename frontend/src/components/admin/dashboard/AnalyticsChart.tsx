
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartProps {
  data: Array<{ date: string; [key: string]: any }>;
  title: string;
  description?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, title, description }) => {
  const buttonNames = data.length > 0 
    ? Object.keys(data[0]).filter(key => key !== 'date')
    : [];

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
    '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1', '#d084d0'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {buttonNames.map((buttonName, index) => (
              <Bar
                key={buttonName}
                dataKey={buttonName}
                fill={colors[index % colors.length]}
                name={buttonName.replace(/_/g, ' ')}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
