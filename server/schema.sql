-- Database SU Portal (SQLite). Dibuat otomatis oleh server.js saat pertama jalan.
-- coll: docs (usulan/laporan) | imgs (foto TTD, faktur, lampiran) | orgs (hash PIN SC/SS/HMPS) | cfg (hash PIN admin)
CREATE TABLE IF NOT EXISTS kv (
  coll    TEXT NOT NULL,
  id      TEXT NOT NULL,
  data    TEXT NOT NULL,
  updated INTEGER NOT NULL,
  PRIMARY KEY (coll, id)
);
CREATE INDEX IF NOT EXISTS idx_kv_coll ON kv(coll);
