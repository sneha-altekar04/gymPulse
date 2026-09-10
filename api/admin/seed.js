import { requireOwnerUser } from '../../server/auth.js';
import { handleApiError, sendJson } from '../../server/http.js';
import { seedGymDatabase } from '../../server/adminSeed.js';

async function readJsonBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;

  return await new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });

  try {
    const user = await requireOwnerUser(request);
    const body = await readJsonBody(request);
    const requestedGymId = String(body.gymId || user.gymId || '').trim();

    if (!requestedGymId) return sendJson(response, 400, { error: 'Gym ID is required.' });
    if (requestedGymId !== user.gymId) return sendJson(response, 403, { error: 'You can only seed your own gym.' });

    const result = await seedGymDatabase(requestedGymId);
    return sendJson(response, 200, { ...result, gymId: requestedGymId });
  } catch (error) {
    return handleApiError(response, error);
  }
}
