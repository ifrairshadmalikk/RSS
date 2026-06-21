import { AlertTriangle, Newspaper, RadioTower, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';
import { Card, Loader } from '../components/Ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { compact } from '../utils/format.js';

const palette = ['#0f766e', '#4f46e5', '#d97706', '#be123c', '#059669', '#64748b'];
const axisTick = { fontSize: 11, fill: 'var(--chart-text)' };
const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 8,
  color: 'var(--chart-text)',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)'
};

export default function Dashboard() {
  const { data, loading } = useAsync(async () => (await api.get('/dashboard')).data, []);
  if (loading) return <Loader />;

  const cards = [
    { label: 'Total Articles Today', value: data.cards.totalArticlesToday, icon: Newspaper },
    { label: 'Total Sources', value: data.cards.totalSources, icon: RadioTower },
    { label: 'Trending Topics', value: data.cards.trendingTopicsCount, icon: TrendingUp },
    { label: 'Breaking News', value: data.cards.breakingNewsCount, icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Global intelligence</p>
        <h2 className="page-title">Trend Monitoring Dashboard</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }, index) => (
          <Card key={label} className="hover-lift" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-normal">{compact(value)}</p>
              </div>
              <div className="icon-tile h-11 w-11"><Icon size={20} /></div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Articles Per Hour"><ChartWrap><AreaChart data={data.charts.articlesPerHour}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} /><YAxis tick={axisTick} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="articles" stroke="#0f766e" strokeWidth={2} fill="#0f766e" fillOpacity={0.12} /></AreaChart></ChartWrap></ChartCard>
        <ChartCard title="Trend Growth"><ChartWrap><BarChart data={data.charts.trendGrowth}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="topic" tick={axisTick} tickLine={false} axisLine={false} /><YAxis tick={axisTick} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="growth" fill="#4f46e5" radius={[5, 5, 0, 0]} /></BarChart></ChartWrap></ChartCard>
        <ChartCard title="Sentiment Analysis"><ChartWrap><PieChart><Pie data={data.charts.sentiment} dataKey="value" nameKey="name" outerRadius={92} label>{data.charts.sentiment.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ChartWrap></ChartCard>
        <ChartCard title="Category Distribution"><ChartWrap><BarChart data={data.charts.categories}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} /><YAxis tick={axisTick} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="#d97706" radius={[5, 5, 0, 0]} /></BarChart></ChartWrap></ChartCard>
      </div>
    </div>
  );
}

function ChartWrap({ children }) {
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function ChartCard({ title, children }) {
  return (
    <section className="chart-surface animate-in">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  );
}
