-- koturutin — seed the curated, read-only experiment_library in the ISOLATED koturutin schema.
-- Idempotent upsert by intent_key. Copy is resolved per language in the app (src/i18n). These MVP
-- rows are PLACEHOLDERS (review flags false) and MUST be replaced with clinically & culturally
-- reviewed content before beta.

insert into koturutin.experiment_library
  (intent_key, function_label, family, duration_band, min_seconds, max_seconds, difficulty, safety_class, clinically_reviewed, culturally_reviewed, enabled)
values
  ('transition.home.arrival.connection', 'connection',        'greeting', '30s-3m', 90, 180, 1, 'relationship_safety', false, false, true),
  ('transition.home.arrival.relief',     'relief_transition', 'breath',   '60s-5m', 60, 300, 1, 'standard',            false, false, true),
  ('craving.delay.support',              'craving',           'delay',    '1-10m',  60, 600, 2, 'smoking_support',     false, false, true)
on conflict (intent_key) do update set
  function_label      = excluded.function_label,
  family              = excluded.family,
  duration_band       = excluded.duration_band,
  min_seconds         = excluded.min_seconds,
  max_seconds         = excluded.max_seconds,
  difficulty          = excluded.difficulty,
  safety_class        = excluded.safety_class,
  clinically_reviewed = excluded.clinically_reviewed,
  culturally_reviewed = excluded.culturally_reviewed,
  enabled             = excluded.enabled,
  updated_at          = now();
