/*
  # listing_id nullable a conversations táblában

  A bolt (shop) chat esetén nincs konkrét hirdetés, ezért listing_id = NULL kell.
  Ez a migráció eltávolítja a NOT NULL constraint-et a listing_id oszlopról.
*/

ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;
