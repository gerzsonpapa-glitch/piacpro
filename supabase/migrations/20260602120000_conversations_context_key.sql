-- Beszélgetés kontextus — külön szál listing/shop/termelő/állás nélkül ütközés
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS context_key text;

CREATE INDEX IF NOT EXISTS conversations_context_key_idx
  ON conversations (buyer_id, seller_id, context_key)
  WHERE context_key IS NOT NULL;

COMMENT ON COLUMN conversations.context_key IS
  'Egyedi kontextus: producer:{id}, job:{id}, seeker:{id}, general:{userId}';
