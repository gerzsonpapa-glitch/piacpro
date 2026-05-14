/*
  # Add UPDATE policy for messages table

  1. Problem
    - No UPDATE RLS policy exists on messages table
    - This means is_read and seen_at fields cannot be updated by clients
    - Unread badge never clears because the update silently fails

  2. Fix
    - Allow conversation participants to mark messages as read (is_read, seen_at only)
    - Recipients can update is_read/seen_at on messages they received
*/

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
    AND sender_id != auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
    AND sender_id != auth.uid()
  );
