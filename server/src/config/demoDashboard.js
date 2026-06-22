export const demoDashboard = {
  cards: {
    totalArticlesToday: 4,
    totalSources: 2,
    trendingTopicsCount: 3,
    breakingNewsCount: 1
  },
  charts: {
    sentiment: [
      { name: 'Positive', value: 2 },
      { name: 'Neutral', value: 2 }
    ],
    categories: [
      { name: 'Business', value: 1 },
      { name: 'Politics', value: 1 },
      { name: 'Health', value: 1 },
      { name: 'Sports', value: 1 }
    ],
    articlesPerHour: [
      { hour: '8:00', articles: 0 },
      { hour: '10:00', articles: 1 },
      { hour: '12:00', articles: 1 },
      { hour: '14:00', articles: 2 },
      { hour: '16:00', articles: 1 },
      { hour: '18:00', articles: 0 },
      { hour: '20:00', articles: 1 },
      { hour: '22:00', articles: 1 }
    ],
    trendGrowth: [
      { topic: 'Cloud infrastructure', score: 198, growth: 40 },
      { topic: 'Election security', score: 220, growth: 100 },
      { topic: 'Emergency room demand', score: 176, growth: 100 }
    ]
  }
};

export function withDemoDashboardFallback(cards, charts) {
  const chartsEmpty =
    !charts.sentiment.length &&
    !charts.categories.length &&
    !charts.articlesPerHour.length &&
    !charts.trendGrowth.length;

  if (!chartsEmpty) {
    return {
      cards,
      charts: {
        sentiment: charts.sentiment.length ? charts.sentiment : demoDashboard.charts.sentiment,
        categories: charts.categories.length ? charts.categories : demoDashboard.charts.categories,
        articlesPerHour: charts.articlesPerHour.length ? charts.articlesPerHour : demoDashboard.charts.articlesPerHour,
        trendGrowth: charts.trendGrowth.length ? charts.trendGrowth : demoDashboard.charts.trendGrowth
      }
    };
  }

  return { cards: demoDashboard.cards, charts: demoDashboard.charts };
}
