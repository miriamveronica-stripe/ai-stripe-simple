import { StripeAgentToolkit } from '@stripe/agent-toolkit/ai-sdk';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';

import {
  convertToCoreMessages,
  experimental_wrapLanguageModel as wrapLanguageModel,
  streamText,
  generateText
} from 'ai';


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripeAgentToolkit = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY,
  configuration: {
    actions: {
      paymentLinks: {
        create: true,
      },
      products: {
        create: true,
      },
      prices: {
        create: true,
      },
      invoices: {
        create: true,
        //send: true,
        //void: true,
        //pay: true,
        update: true, // This might not be valid if not supported by the type definition
      },
      customers: {
        create: true,
      },
      invoiceItems: {
        create: true,
      }
    },
  },
});


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// export async function POST(req: Request) {
//   const { messages } = await req.json();

//   const result = streamText({
//     model: openai('gpt-4o'),
//     messages,
//   });

//   return result.toDataStreamResponse();
// }

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log(messages)
    const result =  streamText({
      model: openai("gpt-4o"),
      tools: {
        ...stripeAgentToolkit.getTools(),
      },
      maxSteps: 5,
      messages: convertToCoreMessages(messages),
      system: `You are a helpful virtual assistant for Greystar, assissting me with building out a chatbot experience for finding apartments in London. The below is what I want to achieve with the chatbots, the ability to create payment invoices for the suggested properties. I will speak in character as a prospective client, can you let me know what API calls to the Stripe API you are making, if any, and if there are errors, what the errors are. 
    
    The user is viewing an image of Greystar's apartment listings in Greater London, which shows:
    
    1. Three apartment communities:
       - Chapter Aldgate: Located at 1-2 Education Square, London, England E1 1FA. Contact: +020 3675 9192 - price of 1000.00 pcm
       - Chapter Ealing: Located at Holbrook London, Victoria Road, North Acton, London, England W3 6UN. Contact: 2081382030 - price of 1500.00 pcm
       - Chapter Highbury: Located at 309 Holloway Road, London, England N7 9DS. Contact: 0207-607-8532 price of 2000.00 pcm
    
    2. Each listing shows "Call for information" regarding beds and baths.
    
    3. There are 35 total communities available in Greater London.
    
    Help users find apartments in Greater London, answer questions about these specific properties, amenities, pricing, availability, and the rental process.
    Be friendly, professional, and provide detailed information about the Greystar properties shown in the image.
    If asked about specific details not visible in the image, offer to connect the user with a leasing agent using the phone numbers provided.
    
    First ask for the name and email, and create a customer using the Stripe API. Then, using the customer id from the created customer, create an invoice. The collection_method should be “send_invoice” Then using the customer id as the customer and the id of the create invoice as the invoice, create an invoice item, the description should be the name of the property + “Deposit”. The amount should be the price as above and the currency GBP. Finally, update the invoice using the invoice id, and updating the automatically_finalizes_at timestamp to 1743432430, let the customer in the chat know that they will shortly receive an invoice by email. 
    Any https:// links should be output in a format that can be linked on a webpage.`,
    });

    console.log(result)
    return result.toDataStreamResponse();
  }
  catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}

    