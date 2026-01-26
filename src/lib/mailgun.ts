import Mailgun from 'mailgun.js';
import FormData from 'form-data';

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return mailgun.client({
    username: 'api',
    key: apiKey,
  });
}

export async function sendEmail({ to, subject, html }: EmailData): Promise<boolean> {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const mg = getMailgunClient();

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [EMAIL] Starting email send`);
  console.log(`[${timestamp}] [EMAIL] Recipient: ${to}`);
  console.log(`[${timestamp}] [EMAIL] Subject: ${subject}`);
  console.log(`[${timestamp}] [EMAIL] Domain: ${domain || 'NOT SET'}`);
  console.log(`[${timestamp}] [EMAIL] API Key configured: ${!!apiKey}`);

  if (!mg || !domain) {
    console.warn(`[${timestamp}] [EMAIL] Mailgun not configured - domain or API key missing. Skipping email send.`);
    return false;
  }

  try {
    console.log(`[${timestamp}] [EMAIL] Sending email via Mailgun...`);
    const result = await mg.messages.create(domain, {
      from: `Follow-Up Health <noreply@${domain}>`,
      to: [to],
      subject,
      html,
    });
    
    const messageId = result?.id || 'unknown';
    console.log(`[${timestamp}] [EMAIL] ✓ Email sent successfully`);
    console.log(`[${timestamp}] [EMAIL] Message ID: ${messageId}`);
    console.log(`[${timestamp}] [EMAIL] Recipient: ${to}`);
    return true;
  } catch (error: unknown) {
    console.error(`[${timestamp}] [EMAIL] ✗ Failed to send email`);
    console.error(`[${timestamp}] [EMAIL] Recipient: ${to}`);
    console.error(`[${timestamp}] [EMAIL] Error:`, error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { body?: unknown } };
      console.error(`[${timestamp}] [EMAIL] Mailgun API response:`, err.response?.body);
    }
    return false;
  }
}

export interface SnapshotEmailData {
  grade: string;
  riskLow: number;
  riskHigh: number;
  dropoffPercent: number;
  drivers: string[];
  scores: {
    speed: number;
    persistence: number;
    coverage: number;
  };
}

/** Returns the stats block only (grade, revenue, drivers, scores) as HTML fragment. */
export function generateSnapshotBlock(data: SnapshotEmailData): string {
  const driversList = data.drivers
    .map((d) => `<li style="margin-bottom: 8px;">${d}</li>`)
    .join('');

  return `
    <div style="background-color: #F8FAFC; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h1 style="color: #1E3A5F; font-size: 24px; margin: 0 0 16px 0;">Your Follow-Up Health Snapshot</h1>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="background: white; border-radius: 8px; padding: 16px; flex: 1; min-width: 120px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #0D9488;">${data.grade}</div>
          <div style="color: #64748B; font-size: 14px;">Grade</div>
        </div>
        <div style="background: white; border-radius: 8px; padding: 16px; flex: 2; min-width: 200px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #E11D48;">$${data.riskLow.toLocaleString()} - $${data.riskHigh.toLocaleString()}</div>
          <div style="color: #64748B; font-size: 14px;">Monthly Revenue at Risk</div>
        </div>
      </div>
    </div>
    <div style="background-color: #F8FAFC; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #1E3A5F; font-size: 18px; margin: 0 0 16px 0;">Top Leakage Drivers</h2>
      <ul style="list-style: none; padding: 0; margin: 0;">${driversList}</ul>
    </div>
    <div style="background-color: #F8FAFC; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #1E3A5F; font-size: 18px; margin: 0 0 16px 0;">Component Scores</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Speed</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.scores.speed}/100</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Persistence</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.scores.persistence}/100</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Coverage</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.scores.coverage}/100</td>
        </tr>
      </table>
    </div>
  `;
}

export interface BuildEmailHtmlOptions {
  /** Admin-editable template body (plain text or HTML). Shown before stats. */
  customContent: string;
  /** Stats block from generateSnapshotBlock. */
  snapshotBlock: string;
  /** CTA URL for "Recalculate" link. */
  ctaUrl: string;
  /** Placeholder values for customContent. */
  placeholders: {
    grade: string;
    risk_low: string;
    risk_high: string;
    dropoff_percent: string;
  };
}

/**
 * Builds full email HTML: custom content (from template) + stats block + CTA + footer.
 * Always includes both configurable content and scores/stats.
 */
export function buildEmailHtml(opts: BuildEmailHtmlOptions): string {
  const { customContent, snapshotBlock, ctaUrl, placeholders } = opts;

  const replacePlaceholders = (text: string) =>
    text
      .replace(/\{\{grade\}\}/g, placeholders.grade)
      .replace(/\{\{risk_low\}\}/g, placeholders.risk_low)
      .replace(/\{\{risk_high\}\}/g, placeholders.risk_high)
      .replace(/\{\{dropoff_percent\}\}/g, placeholders.dropoff_percent)
      .replace(/\{\{cta_url\}\}/g, ctaUrl);

  const custom = replacePlaceholders(customContent.trim());
  const customHtml = custom.replace(/\n/g, '<br>');
  const hasSnapshotPlaceholder = /\{\{snapshot_html\}\}/.test(customContent);

  let main: string;
  if (hasSnapshotPlaceholder) {
    // If custom content contains {{snapshot_html}}, replace it and wrap the whole thing
    // Check if we should add a header for the custom content part
    const parts = customHtml.split(/\{\{snapshot_html\}\}/);
    if (parts[0].trim()) {
      // There's content before the snapshot, add header for it
      const beforeSnapshot = `<div style="background-color: #F8FAFC; border-radius: 8px; padding: 24px; margin-bottom: 24px; color: #1E3A5F; line-height: 1.6;">
        <h2 style="color: #1E3A5F; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Message</h2>
        <div>${parts[0]}</div>
      </div>`;
      const afterSnapshot = parts[1] ? `<div style="background-color: #F8FAFC; border-radius: 8px; padding: 24px; margin-bottom: 24px; color: #1E3A5F; line-height: 1.6;">
        <div>${parts[1]}</div>
      </div>` : '';
      main = `${beforeSnapshot}\n${snapshotBlock}${afterSnapshot ? '\n' + afterSnapshot : ''}`;
    } else {
      // No content before snapshot, just replace placeholder
      main = customHtml.replace(/\{\{snapshot_html\}\}/g, snapshotBlock);
    }
  } else if (custom) {
    // Custom content without snapshot placeholder - add header
    main = `<div style="background-color: #F8FAFC; border-radius: 8px; padding: 24px; margin-bottom: 24px; color: #1E3A5F; line-height: 1.6;">
      <h2 style="color: #1E3A5F; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Message</h2>
      <div>${customHtml}</div>
    </div>\n${snapshotBlock}`;
  } else {
    main = snapshotBlock;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1E3A5F; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${main}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: #0D9488; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Recalculate Your Score</a>
      </div>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; text-align: center; color: #64748B; font-size: 12px;">
        <p>This snapshot was generated by the Follow-Up Health Dashboard.</p>
      </div>
    </body>
    </html>
  `;
}

/** Legacy: full snapshot email (no custom content). Prefer buildEmailHtml for template support. */
export function generateSnapshotHtml(data: SnapshotEmailData): string {
  const block = generateSnapshotBlock(data);
  const ctaUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return buildEmailHtml({
    customContent: '',
    snapshotBlock: block,
    ctaUrl,
    placeholders: {
      grade: data.grade,
      risk_low: data.riskLow.toLocaleString(),
      risk_high: data.riskHigh.toLocaleString(),
      dropoff_percent: String(data.dropoffPercent),
    },
  });
}
