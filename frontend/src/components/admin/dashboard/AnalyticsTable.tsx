
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonClickStats } from '@/services/buttonClickService.ts';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsTableProps {
  data: ButtonClickStats[];
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Button Click Statistics</CardTitle>
        <CardDescription>Detailed breakdown of button interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Button Name</TableHead>
              <TableHead className="text-right">Total Clicks</TableHead>
              <TableHead className="text-right">Last Clicked</TableHead>
              <TableHead className="text-right">Recent Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((stat) => (
              <TableRow key={stat.button_name}>
                <TableCell className="font-medium">
                  {stat.button_name.replace(/_/g, ' ')}
                </TableCell>
                <TableCell className="text-right">{stat.total_clicks}</TableCell>
                <TableCell className="text-right">
                  {stat.last_clicked 
                    ? formatDistanceToNow(new Date(stat.last_clicked), { addSuffix: true })
                    : 'Never'
                  }
                </TableCell>
                <TableCell className="text-right">
                  {stat.daily_clicks.slice(-7).reduce((sum, day) => sum + day.clicks, 0)} 
                  <span className="text-muted-foreground ml-1">(7 days)</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AnalyticsTable;
