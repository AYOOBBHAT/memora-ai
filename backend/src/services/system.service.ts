import { env } from '@/config/env';

import { generateGroqHealthCheckResponse } from '@/services/groq.service';

import type { ChatHealthResult } from '@/types';



function extractErrorMessage(error: unknown): string {

  if (error instanceof Error) {

    return error.message;

  }



  return String(error);

}



export async function checkChatHealth(): Promise<ChatHealthResult> {

  const model = env.GROQ_MODEL;



  if (!env.GROQ_API_KEY) {

    return {

      model,

      status: 'failed',

      error: 'GROQ_API_KEY is not configured',

    };

  }



  try {

    const response = await generateGroqHealthCheckResponse();



    return {

      model,

      status: 'ok',

      response,

    };

  } catch (error) {

    return {

      model,

      status: 'failed',

      error: extractErrorMessage(error),

    };

  }

}


