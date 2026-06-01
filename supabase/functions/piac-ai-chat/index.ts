import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Az AI szolgáltatás jelenleg nem elérhető." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Üzenet szükséges." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Te a PiacPro platform AI asszisztense vagy, neve PiacAI. A PiacPro egy modern magyar online piactér és közösségi platform.

A platform fő funkciói:
- **Piac Tér**: Hirdetések adás-vétel, használt és új termékek. Kategóriák: Elektronika, Ruházat, Otthon, Sport, Játékok, Könyvek, Autó, Ingatlan, Állatok, Élelmiszer, Egészség, Hobbi, Bútorok, IT, Egyéb.
- **Licit Csarnok**: Online aukciók, 24 és 48 órás licitek. Az első licit indítja a visszaszámlálót.
- **Munka Negyed**: Állásajánlatok és álláskeresési hirdetések, teljes állás, részmunka, szabadúszó és szakmai gyakorlat lehetőségek.
- **Boltok Utcája**: Regisztrált üzletek saját webshoppal a platformon.
- **Termelők Piaca**: Helyi gazdák és termelők friss termékeivel, közvetlen vásárlás.
- **Adomány Központ**: Adománygyűjtési kampányok, ingyenes felajánlások tárgyak és szolgáltatások formájában.
- **Közösségi Tér**: Közösségi fórum, kérdések, tippek, viták, hibajelentések.
- **Helyi Vállalkozások**: Közelben lévő vállalkozások, szolgáltatók keresése.

Regisztrációs és biztonsági infók:
- Regisztráció ingyenes, e-mail/jelszóval
- Hirdetések 30 napig aktívak, meghosszabbíthatók
- Üzenetküldés bejelentkezés után lehetséges
- Az AI hirdetésgenerátor 3 hónapos fiókhoz érhető el
- Értékelési rendszer, rangok és kitüntetések
- Biztonságos fizetés ajánlott, személyes átadás lehetséges

Viselkedési szabályok:
- Mindig MAGYARUL válaszolj
- Légy barátságos, segítőkész, tömör
- Ha hirdetéskeresésről kérdeznek, irányítsd a /search oldalra
- Ha aukciókról kérdeznek, irányítsd a /auctions oldalra
- Ha munkát keresnek/hirdetnek, irányítsd a /jobs oldalra
- Ha adományozásról kérdeznek, irányítsd a /donations oldalra
- Ha fórumot keresnek, irányítsd a /forum oldalra
- Sose találj ki adatokat, ha nem tudod a választ, mondd meg
- Maximum 3-4 mondatban válaszolj, kivéve ha részletes magyarázat kell
- Emoji-kat használhatsz mértékkel a jobb olvashatóságért`;

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errText = await openAIResponse.text();
      console.error("OpenAI error:", errText);
      return new Response(
        JSON.stringify({ error: "Az AI válasz generálása sikertelen. Próbáld újra!" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIData = await openAIResponse.json();
    const reply = openAIData.choices?.[0]?.message?.content ?? "Sajnálom, nem tudok most válaszolni.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Szerverhiba. Próbáld újra!" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
