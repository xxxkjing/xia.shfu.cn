import type { APIRoute } from 'astro';

// This is the GitHub OAuth callback route for Sveltia CMS
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // If the code is missing, return an error
  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  // Retrieve the OAuth credentials from environment variables
  const clientId = import.meta.env.OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('OAuth credentials are not configured in environment variables.', { status: 500 });
  }

  // Exchange the code for an access token
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });

  const data = await response.json();

  // If there's an error, return it
  if (data.error) {
    return new Response(JSON.stringify(data), { status: 400 });
  }

  // This is the standard HTML response that Sveltia CMS expects.
  // It posts a message back to the main window to complete the authentication flow.
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Authorizing...</title>
      </head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({
                provider: 'github',
                token: data.access_token,
              })}',
              window.location.origin
            );
            window.close();
          }
        </script>
      </body>
    </html>
  `;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html' },
  });
};