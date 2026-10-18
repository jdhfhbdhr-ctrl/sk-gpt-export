import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const clientToken = secrets.get('PADDLE_CLIENT_TOKEN');
    if (!clientToken) {
      return Response.json({ error: 'Paddle client token is not configured' }, { status: 500 });
    }
    // Auto-detect the Paddle environment from the client-side token prefix.
    // Paddle sandbox tokens begin with "test_"; live/production tokens begin with "live_".
    // The frontend only switches Paddle.js into sandbox mode when this returns "sandbox";
    // for "live" it uses Paddle's default production environment.
    const environment = clientToken.startsWith('live_') ? 'live' : 'sandbox';
    // The client token is designed to be used client-side (Paddle.js), so it is safe to return.
    // Paddle API keys and webhook secrets are NEVER returned here — they stay server-side.
    return Response.json({ clientToken, environment });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}