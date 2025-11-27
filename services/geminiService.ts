import { GoogleGenAI } from "@google/genai";
import { AIRequestParams } from '../types';
import { getActiveApiConfig, getLanguage, getSystemApiConfig } from './storageService';

// Fallback / System Default
// Note: process.env.API_KEY is expected to be available in the environment
const systemAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Generic fetcher for OpenAI-compatible APIs (DeepSeek, ChatGPT, Custom)
async function fetchOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  // 1. Trim and Clean Inputs
  let endpoint = baseUrl.trim().replace(/\/+$/, '');
  const cleanApiKey = apiKey.trim();

  // 2. Ensure Protocol
  if (!endpoint.startsWith('http')) {
    endpoint = `https://${endpoint}`;
  }

  // 3. Construct Endpoint path
  // If user provided the full path to completions, use it. Otherwise append.
  if (!endpoint.includes('/chat/completions')) {
    endpoint = `${endpoint}/chat/completions`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanApiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo', // default fallback
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    console.error("API Request Failed:", error);
    // Provide a more descriptive error for "Failed to fetch" (usually CORS or Network)
    if (error.message === 'Failed to fetch') {
      throw new Error(`Connection failed. Please check your internet connection, API Key, or Base URL (CORS might be blocking ${endpoint}).`);
    }
    throw error;
  }
}

export const generateScript = async (params: AIRequestParams): Promise<string> => {
  const userConfig = getActiveApiConfig();
  const systemConfig = getSystemApiConfig();
  // User config takes precedence, then system config (set by admin)
  const activeConfig = userConfig || systemConfig;
  
  const lang = getLanguage();
  
  const isFa = lang === 'fa';
  
  const systemPrompt = isFa ? `
      شما یک دستیار حرفه‌ای نویسندگی برای تله‌پرامپتر و تولید محتوا هستید.
      لطفاً یک متن سخنرانی جذاب و خلاقانه به زبان فارسی بنویسید با مشخصات زیر:
      
      موضوع: ${params.topic}
      لحن: ${params.tone}
      مدت زمان تقریبی: ${params.duration}
      توضیحات تکمیلی: ${params.additionalInfo || 'ندارد'}

      قوانین:
      1. متن باید کاملاً فارسی و روان باشد.
      2. برای شبکه‌های اجتماعی (اینستاگرام/یوتیوب) مناسب باشد.
      3. شامل قلاب (Hook) جذاب در ابتدا باشد.
      4. خروجی فقط متن سخنرانی باشد.
  ` : `
      You are a professional script writing assistant for teleprompters and content creators.
      Please write an engaging speech script in English with the following specs:
      
      Topic: ${params.topic}
      Tone: ${params.tone}
      Estimated Duration: ${params.duration}
      Additional Info: ${params.additionalInfo || 'None'}

      Rules:
      1. Content must be fluent and engaging.
      2. Suitable for social media (Instagram/YouTube/TikTok).
      3. Include a catchy Hook at the beginning.
      4. Output ONLY the speech text.
  `;

  try {
    // 1. Use Active Config (User or System override)
    if (activeConfig) {
      if (activeConfig.provider === 'gemini') {
        // Use user's or system's Gemini Key
        const userAi = new GoogleGenAI({ apiKey: activeConfig.apiKey });
        const response = await userAi.models.generateContent({
          model: activeConfig.modelName || 'gemini-2.5-flash',
          contents: systemPrompt
        });
        return response.text || (isFa ? "خطا در تولید متن." : "Error generating script.");
      } else {
        // Use OpenAI/DeepSeek/Custom
        return await fetchOpenAICompatible(
          activeConfig.baseUrl || 'https://api.openai.com/v1',
          activeConfig.apiKey,
          activeConfig.modelName || 'gpt-3.5-turbo',
          [{ role: 'user', content: systemPrompt }]
        );
      }
    }

    // 2. Fallback to System Gemini (Hardcoded)
    const response = await systemAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || (isFa ? "متاسفانه خطایی در تولید متن رخ داد." : "Sorry, an error occurred while generating text.");

  } catch (error: any) {
    console.error("Error generating script:", error);
    throw new Error(isFa ? `خطا در ارتباط با هوش مصنوعی: ${error.message}` : `AI Connection Error: ${error.message}`);
  }
};

export const getLiveAssistantResponse = async (userQuery: string, history: string[]): Promise<string> => {
  const userConfig = getActiveApiConfig();
  const systemConfig = getSystemApiConfig();
  const activeConfig = userConfig || systemConfig;

  const lang = getLanguage();
  const isFa = lang === 'fa';
  
  const prompt = isFa ? `
      شما یک دستیار هوشمند در یک برنامه زنده هستید.
      تاریخچه: ${history.slice(-3).join('\n')}
      سوال مجری: ${userQuery}
      پاسخ کوتاه و جذاب بدهید.
  ` : `
      You are a smart assistant in a live broadcast.
      History: ${history.slice(-3).join('\n')}
      Host Question: ${userQuery}
      Give a short, engaging response.
  `;

  try {
    if (activeConfig) {
      if (activeConfig.provider === 'gemini') {
        const userAi = new GoogleGenAI({ apiKey: activeConfig.apiKey });
        const response = await userAi.models.generateContent({
          model: activeConfig.modelName || 'gemini-2.5-flash',
          contents: prompt
        });
        return response.text || "";
      } else {
        return await fetchOpenAICompatible(
          activeConfig.baseUrl || 'https://api.openai.com/v1',
          activeConfig.apiKey,
          activeConfig.modelName || 'gpt-3.5-turbo',
          [{ role: 'user', content: prompt }]
        );
      }
    }

    const response = await systemAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
       config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || (isFa ? "متاسفانه پاسخی دریافت نشد." : "No response received.");

  } catch (error) {
    console.error("Live Assistant Error:", error);
    return isFa ? "خطا در ارتباط با سرور." : "Server connection error.";
  }
}