import { ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Empty, Loader, Pill } from '../components/Ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { dateTime, toneClass } from '../utils/format.js';

export default function NewsFeed() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const q = params.get('q') || '';
  const { data, loading } = useAsync(async () => (await api.get('/articles', { params: { page, q } })).data, [page, q]);
  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="page-kicker">Live feed</p>
          <h2 className="page-title">News Feed</h2>
        </div>
        <p className="text-sm text-slate-500">{data.total} articles</p>
      </div>
      {!data.items.length && <Empty label="No articles found yet. The backend will populate this after RSS fetching runs." />}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.items.map((article, index) => (
          <article key={article._id} className="card-surface animate-in hover-lift" style={{ animationDelay: `${index * 35}ms` }}>
            <div className="flex gap-4">
              {article.image && <img src={article.image} alt="" className="h-24 w-28 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Pill className="bg-cyan-500/12 text-cyan-700 dark:text-cyan-300">{article.category || 'General'}</Pill>
                  <Pill className={toneClass(article.sentiment)}>{article.sentiment}</Pill>
                </div>
                <h3 className="line-clamp-2 font-semibold">{article.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{article.summary || article.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{article.source} - {dateTime(article.publishedAt)}</span>
                  <a className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-900 dark:text-cyan-300" href={article.link} target="_blank" rel="noreferrer">Read More <ExternalLink size={14} /></a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button disabled={page <= 1} onClick={() => setParams({ page: String(page - 1), q })} className="btn-secondary disabled:opacity-40">Previous</button>
        <button disabled={page >= data.pages} onClick={() => setParams({ page: String(page + 1), q })} className="btn-primary disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
