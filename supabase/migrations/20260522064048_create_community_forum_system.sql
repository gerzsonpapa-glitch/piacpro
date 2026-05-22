/*
  # Közösségi Fórum Rendszer

  ## Összefoglalás
  Teljes közösségi fórum és hibajelentő rendszer létrehozása. A felhasználók
  kérdéseket tehetnek fel, válaszolhatnak, reagálhatnak a tartalmakra, és
  jelezhetik a platform hibáit vagy küldhetnek fejlesztési javaslatokat.

  ## Új táblák

  ### forum_categories
  A fórum kategóriái (pl. Általános, Piactér segítség, Kérdések, Hibajelentés).
  - id, slug, name, description, icon, color, sort_order, is_bug_tracker
  - thread_count, post_count – aggregált statisztikák

  ### forum_threads
  Témák / kérdések a fórumon.
  - id, category_id, author_id
  - title, slug, content
  - is_pinned, is_locked, is_solved
  - view_count, reply_count, reaction_count
  - last_reply_at, last_reply_by
  - created_at, updated_at

  ### forum_replies
  Hozzászólások egy-egy témához.
  - id, thread_id, author_id, parent_reply_id (opcionális beágyazás)
  - content, is_edited, is_solution (elfogadott válasz)
  - reaction_count
  - created_at, updated_at

  ### forum_reactions
  Reakciók (like, szív, vicces, hasznos) threadekre és replyekre.
  - id, user_id, thread_id (opcionális), reply_id (opcionális)
  - reaction_type: like | heart | laugh | helpful
  - created_at

  ### bug_reports
  Hibajelentések és fejlesztési javaslatok.
  - id, reporter_id
  - type: bug | suggestion | improvement | question
  - title, description, steps_to_reproduce
  - status: open | in_progress | resolved | closed | duplicate
  - priority: low | medium | high | critical
  - admin_note
  - created_at, updated_at

  ## Előre beillesztett adatok
  Alapkategóriák: Általános, Kérdések & Válaszok, Piactér segítség,
  Tippek & Trükkök, Bejelentések, Hibajelentés & Fejlesztési ötletek

  ## Biztonsági beállítások
  - RLS minden táblán
  - Bárki olvashat aktív tartalmakat
  - Írás csak hitelesített, nem bannolt felhasználóknak
  - Szerkesztés csak saját tartalmon
  - Admin mindent moderálhat
*/

-- ── Forum categories ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'message-circle',
  color text NOT NULL DEFAULT 'emerald',
  sort_order integer NOT NULL DEFAULT 0,
  is_bug_tracker boolean NOT NULL DEFAULT false,
  thread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum categories"
  ON forum_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage forum categories"
  ON forum_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

-- ── Forum threads ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_solved boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  last_reply_at timestamptz,
  last_reply_by uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active forum threads"
  ON forum_threads FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated non-banned users can create threads"
  ON forum_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true)
  );

CREATE POLICY "Authors can update own threads"
  ON forum_threads FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update any thread"
  ON forum_threads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE POLICY "Authors can delete own threads"
  ON forum_threads FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any thread"
  ON forum_threads FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE INDEX IF NOT EXISTS forum_threads_category_idx ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS forum_threads_author_idx ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS forum_threads_created_idx ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS forum_threads_last_reply_idx ON forum_threads(last_reply_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS forum_threads_pinned_idx ON forum_threads(is_pinned DESC, created_at DESC);

-- ── Forum replies ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES forum_replies(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_edited boolean NOT NULL DEFAULT false,
  is_solution boolean NOT NULL DEFAULT false,
  reaction_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum replies"
  ON forum_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated non-banned users can reply"
  ON forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true) AND
    NOT EXISTS (SELECT 1 FROM forum_threads WHERE id = forum_replies.thread_id AND is_locked = true)
  );

CREATE POLICY "Authors can update own replies"
  ON forum_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update any reply"
  ON forum_replies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE POLICY "Authors can delete own replies"
  ON forum_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any reply"
  ON forum_replies FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE INDEX IF NOT EXISTS forum_replies_thread_idx ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS forum_replies_author_idx ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS forum_replies_created_idx ON forum_replies(created_at ASC);

-- ── Forum reactions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES forum_replies(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forum_reactions_target CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  ),
  CONSTRAINT forum_reactions_unique_thread UNIQUE (user_id, thread_id, reaction_type),
  CONSTRAINT forum_reactions_unique_reply UNIQUE (user_id, reply_id, reaction_type)
);

ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON forum_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON forum_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON forum_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS forum_reactions_thread_idx ON forum_reactions(thread_id);
CREATE INDEX IF NOT EXISTS forum_reactions_reply_idx ON forum_reactions(reply_id);
CREATE INDEX IF NOT EXISTS forum_reactions_user_idx ON forum_reactions(user_id);

-- ── Bug reports ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'bug',
  title text NOT NULL,
  description text NOT NULL,
  steps_to_reproduce text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE POLICY "Authenticated users can submit bug reports"
  ON bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update bug report status"
  ON bug_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE INDEX IF NOT EXISTS bug_reports_reporter_idx ON bug_reports(reporter_id);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON bug_reports(status);
CREATE INDEX IF NOT EXISTS bug_reports_type_idx ON bug_reports(type);
CREATE INDEX IF NOT EXISTS bug_reports_created_idx ON bug_reports(created_at DESC);

-- ── Triggers ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_forum_thread_on_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_id,
        updated_at = now()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads
    SET reply_count = GREATEST(0, reply_count - 1),
        updated_at = now()
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'forum_reply_count_trigger') THEN
    CREATE TRIGGER forum_reply_count_trigger
      AFTER INSERT OR DELETE ON forum_replies
      FOR EACH ROW EXECUTE FUNCTION update_forum_thread_on_reply();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_forum_thread_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'forum_threads_updated_at') THEN
    CREATE TRIGGER forum_threads_updated_at
      BEFORE UPDATE ON forum_threads
      FOR EACH ROW EXECUTE FUNCTION update_forum_thread_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'forum_replies_updated_at') THEN
    CREATE TRIGGER forum_replies_updated_at
      BEFORE UPDATE ON forum_replies
      FOR EACH ROW EXECUTE FUNCTION update_forum_thread_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'bug_reports_updated_at') THEN
    CREATE TRIGGER bug_reports_updated_at
      BEFORE UPDATE ON bug_reports
      FOR EACH ROW EXECUTE FUNCTION update_forum_thread_updated_at();
  END IF;
END $$;

-- ── Seed categories ───────────────────────────────────────────────────────────

INSERT INTO forum_categories (slug, name, description, icon, color, sort_order, is_bug_tracker) VALUES
  ('altalanos', 'Általános', 'Általános témák, bemutatkozások és közösségi beszélgetések.', 'message-circle', 'emerald', 1, false),
  ('kerdesek-valaszok', 'Kérdések & Válaszok', 'Kérdezz bátran! A közösség szívesen segít.', 'help-circle', 'sky', 2, false),
  ('piac-segitseg', 'Piactér segítség', 'Hirdetésekkel, adásvétellel, szállítással kapcsolatos kérdések.', 'shopping-bag', 'amber', 3, false),
  ('tippek-trukkök', 'Tippek & Trükkök', 'Hasznos tippek, bevált módszerek, tapasztalatok megosztása.', 'lightbulb', 'teal', 4, false),
  ('bejelentesek', 'Bejelentések', 'Hivatalos platformhírek, újítások, leállások.', 'megaphone', 'rose', 5, false),
  ('hibak-otletek', 'Hibajelentés & Ötletek', 'Jelezd a hibákat, küldj fejlesztési ötleteket a csapatunknak.', 'bug', 'red', 6, true)
ON CONFLICT (slug) DO NOTHING;
