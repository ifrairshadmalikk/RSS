import { AlertTriangle, Newspaper, RadioTower, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';
import { Card, Loader } from '../components/Ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { compact } from '../utils/format.js';

const axisTick = { fontSize: 11, fill: 'var(--chart-text)', fontFamily: 'inherit' };

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 6,
  color: 'var(--chart-text)',
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.10)',
  padding: '8px 12px',
};

const CHART_COLORS = {
  area: '#2563eb',
  bar1: '#6366f1',
  bar2: '#f59e0b',
  pie: ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
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

      {/* stat cards — untouched */}
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

      {/* charts */}
      <div className="grid gap-5 xl:grid-cols-2">

        {/* Articles Per Hour — clean area line */}
        <ChartCard title="Articles Per Hour">
          <ChartWrap>
            <AreaChart data={data.charts.articlesPerHour} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART_COLORS.area, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="articles"
                stroke={CHART_COLORS.area}
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.area, strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartWrap>
        </ChartCard>

        {/* Trend Growth — slim vertical bars */}
        <ChartCard title="Trend Growth">
          <ChartWrap>
            <BarChart data={data.charts.trendGrowth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="topic" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--chart-grid)', opacity: 0.5 }} />
              <Bar dataKey="growth" fill={CHART_COLORS.bar1} radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ChartWrap>
        </ChartCard>

        {/* Sentiment — donut with legend */}
        <ChartCard title="Sentiment Analysis">
          <div className="flex items-center gap-6">
            <div className="h-64 w-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.sentiment}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {data.charts.sentiment.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.pie[i % CHART_COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm">
              {data.charts.sentiment.map((item, i) => (
                <li key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: CHART_COLORS.pie[i % CHART_COLORS.pie.length] }}
                  />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                  <span className="ml-auto pl-4 font-medium tabular-nums text-slate-900 dark:text-slate-100">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        {/* Category Distribution — horizontal bars */}
        <ChartCard title="Category Distribution">
          <ChartWrap>
            <BarChart
              data={data.charts.categories}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              barCategoryGap="35%"
            >
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={axisTick} tickLine={false} axisLine={false} width={72} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--chart-grid)', opacity: 0.5 }} />
              <Bar dataKey="value" fill={CHART_COLORS.bar2} radius={[0, 3, 3, 0]} maxBarSize={22} />
            </BarChart>
          </ChartWrap>
        </ChartCard>

      </div>
    </div>
  );
}

function ChartWrap({ children }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <section
      className="animate-in rounded-2xl p-5"
      style={{
        background: 'var(--chart-tooltip-bg, #fff)',
        border: '1px solid var(--chart-grid, #e2e8f0)',
      }}
    >
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
      {children}
    </section>
  );
}