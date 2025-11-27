import { GoogleGenAI } from "@google/genai";
import { AIRequestParams } from '../types';
import { getActiveApiConfig, getLanguage } from './storageService';

// Fallback / System Default
const systemAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generic fetcher for OpenAI-compatible APIs (DeepSeek, ChatGPT, Custom)
async function fetchOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  // Ensure baseUrl ends with /v1 or correct endpoint if user just put domain
  let endpoint = baseUrl;
  if (!endpoint.includes('/chat/completions')) {
    endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo', // default fallback
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export const generateScript = async (params: AIRequestParams): Promise<string> => {
  const customConfig = getActiveApiConfig();
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
    // 1. If User has a Custom API Config set as default
    if (customConfig) {
      if (customConfig.provider === 'gemini') {
        // Use user's Gemini Key
        const userAi = new GoogleGenAI({ apiKey: customConfig.apiKey });
        const response = await userAi.models.generateContent({
          model: customConfig.modelName || 'gemini-2.5-flash',
          contents: systemPrompt
        });
        return response.text || (isFa ? "خطا در تولید متن." : "Error generating script.");
      } else {
        // Use OpenAI/DeepSeek/Custom
        return await fetchOpenAICompatible(
          customConfig.baseUrl || 'https://api.openai.com/v1',
          customConfig.apiKey,
          customConfig.modelName || 'gpt-3.5-turbo',
          [{ role: 'user', content: systemPrompt }]
        );
      }
    }

    // 2. Fallback to System Gemini
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
  const customConfig = getActiveApiConfig();
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
    if (customConfig) {
      if (customConfig.provider === 'gemini') {
        const userAi = new GoogleGenAI({ apiKey: customConfig.apiKey });
        const response = await userAi.models.generateContent({
          model: customConfig.modelName || 'gemini-2.5-flash',
          contents: prompt
        });
        return response.text || "";
      } else {
        return await fetchOpenAICompatible(
          customConfig.baseUrl || 'https://api.openai.com/v1',
          customConfig.apiKey,
          customConfig.modelName || 'gpt-3.5-turbo',
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