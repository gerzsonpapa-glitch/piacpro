import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  userText: string;
  imageBase64List?: string[]; // optional base64 images
  mode?: "generate" | "scam_check" | "price_estimate" | "categorize" | "moderate";
}

interface AIListingResult {
  title: string;
  description: string;
  category: string;
  tags: string[];
  suggestedPrice: number | null;
  seoText: string;
  scamRisk?: "low" | "medium" | "high";
  scamReasons?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API kulcs nincs konfigurálva." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { userText, imageBase64List = [], mode = "generate" } = body;

    if (!userText && imageBase64List.length === 0) {
      return new Response(
        JSON.stringify({ error: "Szöveg vagy kép szükséges." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const HUNGARIAN_CATEGORIES = [
      "Elektronika", "Ruházat és divat", "Otthon és kert", "Sport és szabadidő",
      "Játékok és gyerekfelszerelés", "Könyvek, filmek, zene", "Autó és motor",
      "Ingatlan", "Állatok és állatfelszerelés", "Élelmiszer és ital",
      "Egészség és szépség", "Hobbi és gyűjtők", "Bútorok és lakberendezés",
      "Számítógép és IT", "Egyéb"
    ];

    // Build messages for GPT
    const systemPrompt = mode === "scam_check"
      ? `Te egy magyar piactér scam-detektáló AI asszisztense vagy. Elemezd a hirdetést és döntsd el, hogy gyanús-e. Válaszolj JSON-ban: { "scamRisk": "low"|"medium"|"high", "scamReasons": ["ok1", "ok2"] }`
      : `Te egy magyar online piactér (PiacPro) hirdetésíró AI asszisztense vagy.
A felhasználó megad egy rövid leírást egy termékről (és esetleg képeket), te pedig generálsz egy vonzó, valódi hirdetést.

FONTOS SZABÁLYOK:
- Minden szöveget MAGYARUL írj
- A cím legyen figyelemfelkeltő, tömör (max 80 karakter)
- A leírás legyen részletes, őszinte, legalább 3-4 mondatos
- A kategória az alábbiak egyike legyen: ${HUNGARIAN_CATEGORIES.join(", ")}
- A tagek legyenek releváns magyar szavak (max 8 db)
- Az ajánlott ár Ft-ban legyen, reális piaci értéken (ha nem tudod, null legyen)
- Az SEO szöveg max 160 karakter, tartalmazza a főbb kulcsszavakat

Válaszolj KIZÁRÓLAG valid JSON-ban, így:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "tags": ["tag1", "tag2"],
  "suggestedPrice": 12000,
  "seoText": "..."
}`;

    // Build content array for user message
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    if (userText) {
      userContent.push({ type: "text", text: `Termék leírása: ${userText}` });
    }

    // Add images if provided (GPT-4o vision)
    for (const b64 of imageBase64List.slice(0, 4)) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${b64}` },
      });
    }

    if (userContent.length === 0) {
      userContent.push({ type: "text", text: "Nincs megadva leírás." });
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageBase64List.length > 0 ? "gpt-4o" : "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!openAIResponse.ok) {
      const errText = await openAIResponse.text();
      console.error("OpenAI error:", errText);
      let errDetail = "Az AI generálás sikertelen volt. Próbáld újra!";
      try {
        const errJson = JSON.parse(errText);
        const code = errJson?.error?.code;
        const msg = errJson?.error?.message;
        if (code === "invalid_api_key") errDetail = "Érvénytelen OpenAI API kulcs.";
        else if (code === "insufficient_quota") errDetail = "Nincs elég OpenAI kredit.";
        else if (msg) errDetail = `OpenAI hiba: ${msg}`;
      } catch { /* ignore */ }
      return new Response(
        JSON.stringify({ error: errDetail, status: openAIResponse.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIData = await openAIResponse.json();
    const rawContent = openAIData.choices?.[0]?.message?.content ?? "{}";

    let result: AIListingResult;
    try {
      result = JSON.parse(rawContent);
    } catch {
      return new Response(
        JSON.stringify({ error: "Érvénytelen AI válasz. Próbáld újra!" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Szerverhiba történt. Próbáld újra!" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
