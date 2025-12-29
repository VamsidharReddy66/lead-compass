import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client to verify the JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan_name 
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing payment verification parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input lengths for security
    if (typeof razorpay_order_id !== 'string' || razorpay_order_id.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid razorpay_order_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof razorpay_payment_id !== 'string' || razorpay_payment_id.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid razorpay_payment_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof razorpay_signature !== 'string' || razorpay_signature.length > 256) {
      return new Response(
        JSON.stringify({ error: 'Invalid razorpay_signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (plan_name && (typeof plan_name !== 'string' || plan_name.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_SECRET) {
      console.error('Razorpay secret not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature using Web Crypto API
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Payment verification failed', verified: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment verified successfully for user:', user.id, 'payment:', razorpay_payment_id);

    // Update subscription using authenticated user.id - use service role for admin operations
    if (plan_name) {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Calculate subscription end date (1 month from now)
      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

      const amount = await getAmountFromOrder(razorpay_order_id);

      // Use authenticated user.id for security - not user-supplied ID
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id, // Use authenticated user.id
          plan_name: plan_name,
          status: 'active',
          subscription_starts_at: new Date().toISOString(),
          subscription_ends_at: subscriptionEndsAt.toISOString(),
          trial_ends_at: null,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          amount_paid: amount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (subError) {
        console.error('Error upserting subscription:', subError);
      } else {
        console.log(`Subscription created/updated for authenticated user ${user.id} to plan ${plan_name}`);
      }
    }

    async function getAmountFromOrder(orderId: string): Promise<number | null> {
      try {
        const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
        const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
        
        const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
          headers: {
            'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
          },
        });
        
        if (response.ok) {
          const order = await response.json();
          return order.amount / 100;
        }
        return null;
      } catch {
        return null;
      }
    }

    return new Response(
      JSON.stringify({ 
        verified: true, 
        payment_id: razorpay_payment_id,
        message: 'Payment verified successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', verified: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
