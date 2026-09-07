import { MockMessageProvider } from './MockMessageProvider.js';

export function createMessageProvider(providerName = 'MOCK') {
  if (providerName === 'MOCK') return new MockMessageProvider();
  throw new Error(`Messaging provider ${providerName} is not configured.`);
}