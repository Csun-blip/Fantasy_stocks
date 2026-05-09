import { Resend } from 'resend';
import type { LeaderboardEntry } from '@/types';
import { formatCurrency, formatPercent, durationLabel } from './utils';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '');
}

function medalIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function buildLeaderboardRows(entries: LeaderboardEntry[]): string {
  return entries
    .map(
      (e) => `
    <tr style="border-bottom: 1px solid #1a2d4a;">
      <td style="padding: 10px; color: #f9fafb; text-align:center;">${medalIcon(e.rank)}</td>
      <td style="padding: 10px; color: #f9fafb;">${e.displayName}</td>
      <td style="padding: 10px; color: #f9fafb; font-family: monospace; text-align:right;">${formatCurrency(e.totalValue)}</td>
      <td style="padding: 10px; text-align:right; color: ${e.returnPercent >= 0 ? '#10b981' : '#ef4444'};">
        ${formatPercent(e.returnPercent)}
      </td>
      <td style="padding: 10px; color: #4a6080; text-align:center;">${e.tradeCount}</td>
    </tr>`
    )
    .join('');
}

export async function sendRoomEndedEmail(params: {
  to: string;
  username: string;
  roomName: string;
  duration: string;
  userEntry: LeaderboardEntry;
  leaderboard: LeaderboardEntry[];
}) {
  const { to, username, roomName, duration, userEntry, leaderboard } = params;
  const won = userEntry.rank === 1;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#050d1a; font-family: Arial, sans-serif; padding: 0; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="background: linear-gradient(135deg, #d4af37, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Fantasy Stocks</h1>
      <p style="color: #4a6080; margin: 4px 0 0;">Competition Results</p>
    </div>

    <div style="background: #080f1e; border: 1px solid ${won ? 'rgba(212,175,55,0.3)' : '#1a2d4a'}; border-radius: 12px; padding: 24px; margin-bottom: 24px; ${won ? 'box-shadow: 0 0 30px rgba(212,175,55,0.1);' : ''}">
      <h2 style="color: #f9fafb; margin: 0 0 4px;">${won ? '🏆 You Won!' : `You finished #${userEntry.rank}`}</h2>
      <p style="color: #4a6080; margin: 0 0 20px;">Room: <strong style="color: #f9fafb;">${roomName}</strong> · Duration: ${durationLabel(duration)}</p>

      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="background: #0c1728; border-radius: 8px; padding: 16px; flex: 1; min-width: 120px;">
          <p style="color: #4a6080; margin: 0 0 4px; font-size: 12px;">FINAL VALUE</p>
          <p style="color: #f9fafb; margin: 0; font-size: 20px; font-family: monospace;">${formatCurrency(userEntry.totalValue)}</p>
        </div>
        <div style="background: #0c1728; border-radius: 8px; padding: 16px; flex: 1; min-width: 120px;">
          <p style="color: #4a6080; margin: 0 0 4px; font-size: 12px;">TOTAL RETURN</p>
          <p style="color: ${userEntry.returnPercent >= 0 ? '#10b981' : '#ef4444'}; margin: 0; font-size: 20px; font-family: monospace;">${formatPercent(userEntry.returnPercent)}</p>
        </div>
        <div style="background: #0c1728; border-radius: 8px; padding: 16px; flex: 1; min-width: 120px;">
          <p style="color: #4a6080; margin: 0 0 4px; font-size: 12px;">TRADES</p>
          <p style="color: #f9fafb; margin: 0; font-size: 20px; font-family: monospace;">${userEntry.tradeCount}</p>
        </div>
      </div>
    </div>

    <div style="background: #080f1e; border: 1px solid #1a2d4a; border-radius: 12px; padding: 24px;">
      <h3 style="color: #f9fafb; margin: 0 0 16px;">Final Leaderboard</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #1a2d4a;">
            <th style="padding: 8px; color: #4a6080; text-align:center;">Rank</th>
            <th style="padding: 8px; color: #4a6080; text-align:left;">Player</th>
            <th style="padding: 8px; color: #4a6080; text-align:right;">Value</th>
            <th style="padding: 8px; color: #4a6080; text-align:right;">Return</th>
            <th style="padding: 8px; color: #4a6080; text-align:center;">Trades</th>
          </tr>
        </thead>
        <tbody>
          ${buildLeaderboardRows(leaderboard)}
        </tbody>
      </table>
    </div>

    <p style="color: #4a6080; text-align: center; margin-top: 32px; font-size: 12px;">
      Fantasy Stocks · This is a simulated portfolio game using virtual money.
    </p>
  </div>
</body>
</html>`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? 'Fantasy Stocks <onboarding@resend.dev>',
    to,
    subject: `${won ? '🏆 You Won! ' : ''}${roomName} — Final Results`,
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  username: string;
  resetUrl: string;
}) {
  const { to, username, resetUrl } = params;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#050d1a; font-family: Arial, sans-serif; padding: 0; margin: 0;">
  <div style="max-width: 500px; margin: 0 auto; padding: 40px 16px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="background: linear-gradient(135deg, #d4af37, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 26px; margin: 0;">Fantasy Stocks</h1>
    </div>

    <div style="background: #080f1e; border: 1px solid #1a2d4a; border-radius: 12px; padding: 32px;">
      <h2 style="color: #f9fafb; margin: 0 0 8px;">Reset your password</h2>
      <p style="color: #4a6080; margin: 0 0 24px;">Hi ${username}, we received a request to reset your password.</p>

      <a href="${resetUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; font-weight: 600; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 24px;">
        Reset Password
      </a>

      <p style="color: #4a6080; font-size: 13px; margin: 0;">This link expires in <strong style="color: #64748b;">1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
    </div>

    <p style="color: #4a6080; text-align: center; margin-top: 24px; font-size: 11px;">
      Fantasy Stocks · This is a simulated portfolio game using virtual money.
    </p>
  </div>
</body>
</html>`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? 'Fantasy Stocks <onboarding@resend.dev>',
    to,
    subject: 'Reset your Fantasy Stocks password',
    html,
  });
}
