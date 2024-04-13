import {SupabaseClient, createClient} from 'npm:@supabase/supabase-js@2.42.0'
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.1";
import { load } from "https://deno.land/std@0.220.0/dotenv/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface my_table{
  id: string;
  name: string;

}

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);


// 0. Get a specific row in the table using row id
async function getUserAccount(supabaseClient: SupabaseClient, id: string): Promise<Response> {
  const { data: my_table, error } = await supabaseClient.from('my_table').select().eq('id', id);
  if (error) throw error;

  return new Response(JSON.stringify({my_table}), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
  
}


  //1.Fecth all data from table functionality
  async function getAllUsers(supabaseClient: SupabaseClient): Promise<Response> {
    try {
      const { data: my_table, error } = await supabase
        .from('my_table')
        .select('*');
      if (error) throw error;
  
      return new Response(JSON.stringify({my_table}),{
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

// .2Update a row in the table where the data matches the id specified
async function updateUserDetails(supabaseClient: SupabaseClient, id: string, name: string): Promise<Response>{
  const {data: my_table, error} = await supabase.from('my_table').update({name}).eq('id', id).select();
  if(error) throw error;

  return new Response(JSON.stringify({my_table}),{
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

  //3. Insert a new row into the table
  async function createNewUser(supabaseClient: SupabaseClient, name: string): Promise<Response>{
    const { data: my_table, error } = await supabase
    .from('my_table')
    .insert({ name })
    .select()
    if(error) throw error;
    
    return new Response(JSON.stringify({my_table}),{
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  }
  

  //4. Delete a row from the table where the data matches the id specified
  async function deleteUser(supabaseClient: SupabaseClient, id: string): Promise<Response> {

    const { data:my_table, error } = await supabase
    .from('my_table')
    .delete()
    .eq('id', id)
    if(error) throw error;
    
    return new Response(JSON.stringify({}),{
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
    }

Deno.serve(async (req) => {
      const { url, method } = req;
      // This is needed if you're planning to invoke your function from a browser.
      if (method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }
    
      try {
        // Create a Supabase client with the Auth context of the logged-in user.
        const supabaseClient = createClient(
          // Supabase API URL - env var exported by default.
          Deno.env.get('SUPABASE_URL') ?? '',
          // Supabase API ANON KEY - env var exported by default.
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
     
          {
            global: {
              headers: { Authorization: req.headers.get('Authorization')! },
            }
          }
        );
    
        // For more details on URLPattern, check https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
        const id = url.substring(url.lastIndexOf('/') + 1);
    
        let User = null; // default value
        if (method === 'POST' || method === 'PUT') {
          // TODO: validate the request body and return a JSON object instead of an array
          const body = await req.json();
          User = body.name;
        }
    
        // call relevant method based on method and id
        switch (method) {
          case 'GET':
            if (id) {
              //We get the user with the specified id
              return getUserAccount(supabaseClient, id);
            } else {
              //Else if the id is not specified we get all the users in the database
              return getAllUsers(supabaseClient);
            }
          case 'PUT':
            //We get the user with the specified id and update the user account
            return updateUserDetails(supabaseClient, id, User);
          case 'DELETE':
            //We get the user with the specified id and delete the user account
            return deleteUser(supabaseClient, id);
          case 'POST':
            //We create a new user account
            return createNewUser(supabaseClient, User);
          default:
            //If the method is not specified we get all the users in the database
            return getAllUsers(supabaseClient);
        }
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
});
    
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
