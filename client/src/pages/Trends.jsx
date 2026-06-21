import { ArrowUpRight, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Card, Empty, Loader, Pill } from '../components/Ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { compact, dateTime, toneClass } from '../utils/format.js';

export default function Trends() {
  const [country, setCountry] = useState('Global');
  const [category, setCategory] = useState('');
  const trends = useAsync(async () => (await api.get('/trends', { params: { country: country !== '' ? country : undefined, category: category !== '' ? category : undefined } })).data, [country, category]);
  const countries = useAsync(async () => (await api.get('/trends/countries')).data, []);
  const categories = useAsync(async () => (await api.get('/trends/categories')).data, []);

  if (trends.loading || countries.loading || categories.loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <p className="page-kicker">Live from Google</p>
        <h2 className="page-title">Global Trends</h2>
        <p className="mt-1 text-sm text-slate-500">Real-time trending topics from Google Trends & Google News RSS</p>
      </div>
      
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="field w-full">
              <option value="Global">Worldwide</option>
              {countries.data?.countries?.filter(c => c !== 'Global').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-full">
              <option value="">All Categories</option>
              {categories.data?.categories?.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {!trends.data?.items?.length && <Empty label="No live trends found for this country or category. Try another filter." />}
      <div className="grid gap-4 xl:grid-cols-2">
        {trends.data?.items?.map((trend, index) => (
          <Card key={`${trend._id}`} className="hover-lift" style={{ animationDelay: `${index * 35}ms` }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold capitalize">{trend.topic}</h3>
                  {trend.country !== 'Global' && <Pill className="bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 text-xs"><Globe size={12} className="inline mr-1" />{trend.country}</Pill>}
                </div>
                <p className="mt-1 text-sm text-slate-500">Updated {dateTime(trend.lastUpdated)}</p>
              </div>
              <div className="flex gap-2">
                <Pill className={toneClass(trend.sentiment)}>{trend.sentiment}</Pill>
                {trend.isBreaking && <Pill className="bg-amber-500/15 text-amber-700 dark:text-amber-300">Breaking</Pill>}
                <Pill className="bg-slate-500/12 text-slate-700 dark:text-slate-300">{trend.category}</Pill>
                {trend.source && <Pill className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">{trend.source}</Pill>}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Metric label="Mentions" value={compact(trend.mentions)} />
              <Metric label="Growth" value={`${trend.growthRate > 0 ? '+' : ''}${trend.growthRate}%`} />
              <Metric label="Score" value={compact(trend.score)} />
            </div>
            <div className="mt-5 space-y-2">
              {trend.relatedArticles?.map((article) => (
                <a key={article.link} href={article.link} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded border border-slate-200/70 p-3 text-sm hover:border-cyan-400 dark:border-slate-800">
                  <span className="line-clamp-1">{article.title}</span>
                  <ArrowUpRight size={16} className="shrink-0 text-cyan-600" />
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded bg-slate-100/70 p-3 dark:bg-slate-900/60"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}
