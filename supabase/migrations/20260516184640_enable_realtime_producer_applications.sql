/*
  # Realtime engedélyezése a producer_applications táblára

  Az admin értesítések miatt szükséges, hogy a producer_applications tábla
  változásait (INSERT) valós időben figyelhessük.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE producer_applications;
