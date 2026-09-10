export function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function' && typeof response.json === 'function') {
    response.status(statusCode).json(payload);
    return;
  }

  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

export function handleApiError(response, error) {
  console.error('Messaging API error:', error.message);
  sendJson(response, error.statusCode || 500, {
    error: error.statusCode ? error.message : 'Messaging service is temporarily unavailable.'
  });
}