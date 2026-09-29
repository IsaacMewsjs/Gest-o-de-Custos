-- Execute no SQL Editor do Supabase se o banco ja existia antes da validade das recorrencias.
alter table transactions add column if not exists recurrence_duration integer;
alter table transactions add column if not exists recurrence_end_date timestamptz;
