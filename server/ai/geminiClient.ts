import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Initializes and returns the Google Generative AI client.
 * Returns null if no API key is configured.
 */
export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }

  return geminiClient;
}

/**
 * Gets configured Gemini model name.
 */
export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
}
