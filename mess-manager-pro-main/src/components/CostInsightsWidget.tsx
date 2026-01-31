import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusinessIntelligence, CostAlert } from '@/hooks/useBusinessIntelligence';
import { useCurrency } from '@/hooks/useCurrency';
import { AlertTriangle, TrendingUp, Info, Lightbulb, Wrench, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';

function AlertCard({ alert }: { alert: CostAlert }) {
  const getIcon = () => {
    switch (alert.type) {
      case 'spending_spike':
        return <TrendingUp className="h-4 w-4" />;
      case 'frequent_repairs':
        return <Wrench className="h-4 w-4" />;
      case 'unnecessary_expense':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${
      alert.severity === 'warning' 
        ? 'bg-amber-500/10 border-amber-500/30' 
        : 'bg-primary/10 border-primary/30'
    }`}>
      <div className="flex items-start gap-2">
        <span className={alert.severity === 'warning' ? 'text-amber-500' : 'text-primary'}>
          {getIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            alert.severity === 'warning' ? 'text-amber-500' : 'text-primary'
          }`}>
            {alert.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CostInsightsWidget() {
  const { alerts, varianceData, isLoading } = useBusinessIntelligence();
  const { formatAmount } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Cost Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Don't render if no alerts and no meaningful variance data
  if (alerts.length === 0 && varianceData.every(d => d.current === 0 && d.average === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Cost Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Smart Alerts */}
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-500">
              <Info className="h-4 w-4" />
              <p className="text-sm font-medium">All Clear</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No spending anomalies detected this month.
            </p>
          </div>
        )}

        {/* Variance Chart */}
        {varianceData.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Spend vs 3-Month Average</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varianceData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatAmount(value),
                      name === 'current' ? 'This Month' : '3-Mo Avg'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="average" name="3-Mo Avg" fill="hsl(var(--muted-foreground))" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="current" name="This Month" radius={[0, 2, 2, 0]}>
                    {varianceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.variance > 15 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
