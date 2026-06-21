import nodemailer from 'nodemailer';
import { User } from '../models/User.js';
import { buildTrendPdfBuffer } from './pdfService.js';

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function matchesPreference(user, trend) {
  const countries = user.preferredCountries || [];
  const categories = user.preferredCategories || [];
  const countryMatch = countries.length === 0 || countries.includes('Global') || countries.includes(trend.country);
  const categoryMatch = categories.length === 0 || categories.includes(trend.category);
  return countryMatch && categoryMatch;
}

export async function sendTrendEmailAlerts(trend, message) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Skipping trend email alerts: SMTP_HOST, SMTP_USER, and SMTP_PASS are required.');
    return { sent: 0, skipped: true };
  }

  const users = await User.find({ emailAlertsEnabled: true, notificationsEnabled: true }).select('email name preferredCountries preferredCategories pdfAlertsEnabled');
  const recipients = users.filter((user) => matchesPreference(user, trend));
  const from = process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER;
  let sent = 0;

  for (const user of recipients) {
    const attachments = [];
    if (user.pdfAlertsEnabled) {
      const content = await buildTrendPdfBuffer({
        title: `Breaking Trend: ${trend.topic}`,
        summary: message,
        trends: [trend]
      });
      attachments.push({ filename: `trend-${String(trend.topic).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, content });
    }

    await transporter.sendMail({
      from,
      to: user.email,
      subject: `Breaking trend: ${trend.topic}`,
      text: `${message}\n\nCategory: ${trend.category}\nCountry: ${trend.country}\nMentions: ${trend.mentions}`,
      html: `<p>${message}</p><p><strong>Category:</strong> ${trend.category}<br><strong>Country:</strong> ${trend.country}<br><strong>Mentions:</strong> ${trend.mentions}</p>`,
      attachments
    });
    sent += 1;
  }

  return { sent, skipped: false };
}
