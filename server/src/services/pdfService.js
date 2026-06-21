import PDFDocument from 'pdfkit';

function writeMetric(doc, label, value) {
  doc.fontSize(8).fillColor('#64748b').text(label.toUpperCase());
  doc.fontSize(16).fillColor('#0f172a').text(String(value || 0));
}

export function buildTrendPdfBuffer({ title = 'TrendWatch Report', summary = '', trends = [] }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#0f172a').text(title, { continued: false });
    doc.moveDown(0.35);
    doc.fontSize(9).fillColor('#64748b').text(`Generated ${new Date().toLocaleString()}`);
    if (summary) {
      doc.moveDown();
      doc.fontSize(11).fillColor('#334155').text(summary, { lineGap: 3 });
    }

    doc.moveDown(1.25);
    trends.forEach((trend, index) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(14).fillColor('#0891b2').text(`${index + 1}. ${trend.topic || 'Untitled trend'}`);
      doc.fontSize(9).fillColor('#475569').text(`${trend.category || 'General'} / ${trend.country || 'Global'} / ${trend.sentiment || 'Neutral'}`);
      doc.moveDown(0.6);
      const top = doc.y;
      writeMetric(doc, 'Mentions', trend.mentions);
      doc.y = top;
      doc.x = 180;
      writeMetric(doc, 'Growth', `${trend.growthRate > 0 ? '+' : ''}${trend.growthRate || 0}%`);
      doc.y = top;
      doc.x = 312;
      writeMetric(doc, 'Score', trend.score);
      doc.x = 48;
      doc.moveDown(0.85);

      const articles = trend.relatedArticles || [];
      articles.slice(0, 3).forEach((article) => {
        doc.fontSize(9).fillColor('#334155').text(`- ${article.title || article.link || 'Related article'}`, { lineGap: 2 });
      });
      doc.moveDown(1);
    });

    if (!trends.length) {
      doc.fontSize(11).fillColor('#64748b').text('No trends matched this export.');
    }

    doc.end();
  });
}
