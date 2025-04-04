import { getInventoryInformation } from "./llm.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';


serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',  // Your frontend URL
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  // Allowed methods
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',  // Allow Authorization, x-client-info, and apikey headers
      },
    });
  }

  try {
    const body = await req.json();  // Get raw body as text to check its contents
    if (!body) {
      console.error('Empty body received');
      return new Response("Empty body", { 
        headers: { 
          "Content-Type": "text/plain", 
          "Access-Control-Allow-Origin": "*" 
        },
      });
    }
    
    // Handle other requests (GET, POST, etc.)
    const result = await getInventoryInformation(body);
    console.log(result);

    return new Response(JSON.stringify({ message: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  // Your frontend URL
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response("Error processing request", { 
      headers: { 
        "Content-Type": "text/plain", 
        "Access-Control-Allow-Origin": "*" 
      },
    });
  }
  
});
