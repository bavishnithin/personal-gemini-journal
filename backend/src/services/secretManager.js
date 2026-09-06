import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Create the client at the module level
const client = new SecretManagerServiceClient();

let cachedApiKey = null;

/**
 * Retrieves the Gemini API Key.
 * Fail-closed behavior: If the Secret Manager is unreachable or fails to return the key,
 * this function throws an error, leaving the cached key null. All routes depending
 * on the Gemini API will return a 503 Service Unavailable status to prevent unauthorized
 * access or unhandled failures.
 */
export async function getGeminiApiKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // Local development override
  if (process.env.GEMINI_API_KEY) {
    console.warn('WARNING: Using GEMINI_API_KEY from environment variables instead of Secret Manager.');
    cachedApiKey = process.env.GEMINI_API_KEY;
    return cachedApiKey;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable is not set');
  }

  try {
    const name = `projects/${projectId}/secrets/gemini-api-key/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    
    const payload = version.payload.data.toString('utf8');
    cachedApiKey = payload;
    return cachedApiKey;
  } catch (error) {
    console.error('Failed to retrieve Gemini API key from Secret Manager');
    throw new Error('Failed to retrieve secrets required for AI functionality.');
  }
}
