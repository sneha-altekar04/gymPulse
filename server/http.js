export function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

export function handleApiError(response, error) {
  console.error('Messaging API error:', error.message);
  sendJson(response, error.statusCode || 500, {
    error: error.statusCode ? error.message : 'Messaging service is temporarily unavailable.'
  });
}