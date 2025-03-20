// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getInventoryInformation } from "./llm.ts";
import type { Chat } from "./types/chatbot.ts";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  try {
    // Log request headers for debugging
    console.log("Request Headers:", req.headers);

    if (req.method === "OPTIONS") {
      // Handle preflight requests
      return new Response(null, {
        status: 204, // No Content
        headers: {
          "Access-Control-Allow-Origin": "*", // Or your specific origin
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "apikey,authorization,content-type,x-client-info",
          "Access-Control-Max-Age": "86400", // 24 hours
        },
      });
    }

    const { question } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ message: "Missing 'question' in request body" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Or your specific origin
            "Access-Control-Allow-Headers":
              "apikey,authorization,content-type,x-client-info",
          },
        }
      );
    }

    const data: { message: Chat } = {
      message: await getInventoryInformation(question),
    };

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Or your specific origin
        "Access-Control-Allow-Headers":
          "apikey,authorization,content-type,x-client-info",
      },
    });
  } catch (error) {
    console.error("Error:", error);

    let errorMessage = "Internal Server Error";
    if (error instanceof SyntaxError) {
      errorMessage = "Invalid JSON in request body";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ message: `Error: ${errorMessage}` }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Or your specific origin
        "Access-Control-Allow-Headers":
          "apikey,authorization,content-type,x-client-info",
      },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/gemini' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"question":"How much benadril do I have?"}'

*/
