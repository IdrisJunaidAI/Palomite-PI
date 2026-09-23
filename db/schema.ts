import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
 id: integer('id').primaryKey({autoIncrement:true}),
 entity: text('entity').notNull(), kind: text('kind').notNull(),
 ref: text('ref').notNull().default(''), title: text('title').notNull(),
 amount: real('amount').notNull().default(0), status: text('status').notNull().default('Pending'),
 vendor: text('vendor').notNull().default(''), dueDate: text('due_date').notNull().default(''),
 notes: text('notes').notNull().default(''), actor: text('actor').notNull(),
 createdAt: text('created_at').notNull(),
}, t=>[index('idx_records_entity_kind').on(t.entity,t.kind)]);
