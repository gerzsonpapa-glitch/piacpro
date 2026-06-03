import { supabase } from './supabase';

export type ConversationContext =
  | { kind: 'listing'; listingId: string }
  | { kind: 'shop_product'; shopProductId: string }
  | { kind: 'shop'; shopId: string }
  | { kind: 'producer'; producerId: string }
  | { kind: 'job'; jobId: string }
  | { kind: 'seeker'; seekerAdId: string }
  | { kind: 'general'; tag: string };

function contextKey(ctx: ConversationContext): string | null {
  switch (ctx.kind) {
    case 'listing':
      return null;
    case 'shop_product':
      return `shop_product:${ctx.shopProductId}`;
    case 'shop':
      return `shop:${ctx.shopId}`;
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

function contextToRpcParams(context: ConversationContext): {
  p_listing_id: string | null;
  p_shop_product_id: string | null;
  p_context_key: string | null;
} {
  switch (context.kind) {
    case 'listing':
      return { p_listing_id: context.listingId, p_shop_product_id: null, p_context_key: null };
    case 'shop_product':
      return { p_listing_id: null, p_shop_product_id: context.shopProductId, p_context_key: contextKey(context) };
    case 'shop':
    case 'producer':
    case 'job':
    case 'seeker':
    case 'general':
      return { p_listing_id: null, p_shop_product_id: null, p_context_key: contextKey(context) };
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
  } else if (key) {
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
  if (context.kind === 'shop_product') {
    insertPayload.shop_product_id = context.shopProductId;
  }
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

/** Meglévő beszélgetés + első üzenet — RPC-vel (megbízható). */
export async function openConversationWithMessage(options: {
  buyerId: string;
  sellerId: string;
  context: ConversationContext;
  message: string;
}): Promise<{ conversationId: string | null; error: string | null }> {
  const rpcParams = contextToRpcParams(options.context);

  const { data, error } = await supabase.rpc('open_conversation_with_message', {
    p_seller_id: options.sellerId,
    p_message: options.message,
    p_listing_id: rpcParams.p_listing_id,
    p_shop_product_id: rpcParams.p_shop_product_id,
    p_context_key: rpcParams.p_context_key,
  });

  if (error) {
    return { conversationId: null, error: error.message };
  }

  if (data?.success && data?.conversation_id) {
    return { conversationId: data.conversation_id as string, error: null };
  }

  const rpcError = (data?.error as string | undefined) ?? 'Beszélgetés létrehozása sikertelen.';

  // Fallback: régi kliens út, ha az RPC még nincs telepítve
  if (
    rpcError.includes('Could not find the function') ||
    rpcError.includes('schema cache') ||
    rpcError.includes('open_conversation_with_message')
  ) {
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

  return { conversationId: null, error: rpcError };
}
