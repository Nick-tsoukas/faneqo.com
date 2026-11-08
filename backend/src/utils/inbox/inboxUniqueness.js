'use strict';

/**
 * Inbox uniqueness inventory + convert SQL.
 *
 * Strapi 4.24.4 does NOT turn attribute `unique: true` into a DB unique.
 * Database-level unique requires `column: { unique: true }`, which creates
 * `{table}_{column}_unique`. Without that, schema sync treats leftover Inbox
 * UNIQUE INDEXES as extras and dropUnique() emits DROP CONSTRAINT.
 *
 * convertIndexToConstraintSql is a one-time crash unblocker only.
 * It is not permanent ownership. After convert, sync will drop the constraint
 * unless the content-type also has `column: { unique: true }` (or an explicit
 * indexes[] entry with the same name).
 */

const INVARIANTS = [
  {
    id: 'pairKey',
    table: 'conversations',
    column: 'pair_key',
    strapiField: 'pairKey',
    strapiUniqueName: 'conversations_pair_key_unique',
    customIndexName: 'conversations_pair_key_unique',
    required: true,
    nullable: false,
    allowMultipleNulls: false,
    expectedIndexDef: 'CREATE UNIQUE INDEX conversations_pair_key_unique ON public.conversations USING btree (pair_key)',
  },
  {
    id: 'conversationSideKey',
    table: 'conversation_participants',
    column: 'conversation_side_key',
    strapiField: 'conversationSideKey',
    strapiUniqueName: 'conversation_participants_conversation_side_key_unique',
    customIndexName: 'conversation_participants_side_key_unique',
    required: true,
    nullable: false,
    allowMultipleNulls: false,
    expectedIndexDef: 'CREATE UNIQUE INDEX conversation_participants_side_key_unique ON public.conversation_participants USING btree (conversation_side_key)',
  },
  {
    id: 'idempotencyKey',
    table: 'conversation_messages',
    column: 'idempotency_key',
    strapiField: 'idempotencyKey',
    strapiUniqueName: 'conversation_messages_idempotency_key_unique',
    customIndexName: 'conversation_messages_idempotency_unique',
    required: false,
    nullable: true,
    allowMultipleNulls: true,
    expectedIndexDef: 'CREATE UNIQUE INDEX conversation_messages_idempotency_unique ON public.conversation_messages USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL)',
  },
];

const PERFORMANCE_INDEXES = [
  { name: 'conversations_last_message_at', table: 'conversations', unique: false },
  { name: 'conversation_messages_created_id', table: 'conversation_messages', unique: false },
];

function convertIndexToConstraintSql({ table, column, indexName }) {
  return `
DO $$
BEGIN
  IF to_regclass('public.${table}') IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${indexName}') THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE c.relkind = 'i'
      AND c.relname = '${indexName}'
      AND n.nspname = 'public'
      AND i.indisunique = true
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.${indexName}';
    EXECUTE 'ALTER TABLE public.${table} ADD CONSTRAINT ${indexName} UNIQUE (${column})';
  END IF;
END $$;
`;
}

function allConvertSql() {
  return INVARIANTS.map((row) => convertIndexToConstraintSql({
    table: row.table,
    column: row.column,
    indexName: row.customIndexName,
  })).join('\n');
}

module.exports = {
  INVARIANTS,
  PERFORMANCE_INDEXES,
  convertIndexToConstraintSql,
  allConvertSql,
};
