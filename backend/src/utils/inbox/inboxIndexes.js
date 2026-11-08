'use strict';

/**
 * Inbox performance indexes only.
 *
 * Uniqueness for pair_key / conversation_side_key / idempotency_key is owned
 * by Strapi schema `unique: true`. Do not CREATE UNIQUE INDEX for those fields.
 */

async function tableExists(knex, table) {
  try {
    return await knex.schema.hasTable(table);
  } catch {
    return false;
  }
}

async function columnExists(knex, table, column) {
  try {
    return await knex.schema.hasColumn(table, column);
  } catch {
    return false;
  }
}

async function execIndex(strapi, knex, label, sql) {
  try {
    await knex.raw(sql);
    strapi.log?.info?.(`[inbox] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi.log?.warn?.(`[inbox] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

async function ensureInboxIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true };

  const results = [];

  if (await tableExists(knex, 'conversations')) {
    if (await columnExists(knex, 'conversations', 'last_message_at')) {
      results.push(
        await execIndex(
          strapi,
          knex,
          'conversations.last_message_at',
          'CREATE INDEX IF NOT EXISTS conversations_last_message_at ON conversations (last_message_at)'
        )
      );
    }
  }

  if (await tableExists(knex, 'conversation_messages')) {
    if (await columnExists(knex, 'conversation_messages', 'created_at')) {
      results.push(
        await execIndex(
          strapi,
          knex,
          'conversation_messages (created_at, id)',
          'CREATE INDEX IF NOT EXISTS conversation_messages_created_id ON conversation_messages (created_at, id)'
        )
      );
    }
  }

  const okCount = results.filter((row) => row.ok).length;
  strapi.log?.info?.(
    `[Faneqo Inbox] indexes:ready ok=${okCount} attempted=${results.length}`
  );
  return { results };
}

module.exports = { ensureInboxIndexes };
