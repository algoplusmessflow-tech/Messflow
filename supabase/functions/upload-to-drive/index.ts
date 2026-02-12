import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",");
const MAX_REQUESTS = 10;
const WINDOW_MS = 60000; // 1 minute

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const getCorsHeaders = (origin: string | null) => {
    const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
    return {
        "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Credentials": "true",
    };
};

const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (userLimit.count >= MAX_REQUESTS) {
        return false;
    }

    userLimit.count++;
    return true;
};

serve(async (req) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
        }

        if (!checkRateLimit(user.id)) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
        }

        // Here you would implement your specific upload logic
        // For now, we'll return a success message as a placeholder for the actual upload logic
        // which would involve interacting with Supabase Storage or another provider.

        return new Response(JSON.stringify({ message: "Upload request authorized" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }
})
