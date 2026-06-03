import { supabase } from './supabase';

export type ConversationContext =
  | { kind: 'listing'; listingId: string }
  | { kind: 'shop_product'; shopProductId: string }
  | { kind: 'producer'; producerId: string }
  | { kind: 'job'; jobId: string }
  | { kind: 'seeker'; seekerAdId: string }
  | { kind: 'general'; tag: string };

function contextKey(ctx: ConversationContext): string | null {
  switch (ctx.kind) {
    case 'listing':
      return null;
    case 'shop_product':
      return null;
    case 'producer':
      return `producer:${ctx.producerId}`;
    case 'job':
      return `job:${ctx.jobId}`;
    case 'seeker':
      return `seeker:${ctx.seekerAdId}`;
    case 'general':
      return `general:${ctx.tag}`;
  }
}

export async function findOrCreateConversation(options: {
  buyerId: string;
  sellerId: string;
  context: ConversationContext;
}): Promise<{ id: string | null; error: string | null }> {
  const { buyerId, sellerId, context } = options;
  const key = contextKey(context);

  if (context.kind === 'listing') {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', context.listingId)
      .eq('buyer_id', buyerId)
      .maybeSingle();
    if (existing?.id) return { id: existing.id, error: null };

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: context.listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
      })
      .select('id')
      .single();
    return { id: data?.id ?? null, error: error?.message ?? null };
  }

  if (context.kind === 'shop_product') {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .eq('shop_product_id', context.shopProductId)
      .maybeSingle();
    if (existing?.id) return { id: existing.id, error: null };

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_id: null,
        shop_product_id: context.shopProductId,
        context_key: key,
      })
      .select('id')
      .single();
    return { id: data?.id ?? null, error: error?.message ?? null };
  }

  if (key) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .eq('context_key', key)
      .maybeSingle();
    if (existing?.id) return { id: existing.id, error: null };
  }

  const insertPayload: Record<string, unknown> = {
    buyer_id: buyerId,
    seller_id: sellerId,
    listing_id: null,
  };
  if (key) insertPayload.context_key = key;

  const { data, error } = await supabase
    .from('conversations')
    .insert(insertPayload)
    .select('id')
    .single();

  return { id: data?.id ?? null, error: error?.message ?? null };
}

export async function sendConversationMessage(options: {
  conversationId: string;
  senderId: string;
  content: string;
}): Promise<{ error: string | null }> {
  const { conversationId, senderId, content } = options;
  const trimmed = content.trim();
  if (!trimmed) return { error: 'Üres üzenet.' };

  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: trimmed,
    is_read: false,
  });

  if (msgError) return { error: msgError.message };

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return { error: null };
}

/** Meglévő beszélgetés + első üzenet egy lépésben. */
export async function openConversationWithMessage(options: {
  buyerId: string;
  sellerId: string;
  context: ConversationContext;
  message: string;
}): Promise<{ conversationId: string | null; error: string | null }> {
  const { id, error: convError } = await findOrCreateConversation({
    buyerId: options.buyerId,
    sellerId: options.sellerId,
    context: options.context,
  });
  if (!id) return { conversationId: null, error: convError ?? 'Beszélgetés létrehozása sikertelen.' };

  const { error: msgError } = await sendConversationMessage({
    conversationId: id,
    senderId: options.buyerId,
    content: options.message,
  });
  if (msgError) return { conversationId: id, error: msgError };

  return { conversationId: id, error: null };
}
