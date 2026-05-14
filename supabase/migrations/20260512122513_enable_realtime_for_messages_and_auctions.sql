/*
  # Enable Supabase Realtime for messages, conversations, and auctions

  ## Changes
  - Enable Realtime publication for: messages, conversations, auction_bids, auctions tables
  - This allows the frontend to subscribe to live changes without polling

  ## Tables affected
  - messages: INSERT/UPDATE events for real-time chat
  - conversations: INSERT/UPDATE events for conversation list sync
  - auction_bids: INSERT/DELETE events for live bid updates
  - auctions: UPDATE events for auction status changes (ended, winner_id set)
*/

-- Add tables to the supabase_realtime publication
DO $$
BEGIN
  -- messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  -- conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;

  -- auction_bids
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'auction_bids'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;
  END IF;

  -- auctions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'auctions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
  END IF;
END $$;
