import { integer, real, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
 documentId:text('document_id'), sourcePage:integer('source_page'),
 id: integer('id').primaryKey({autoIncrement:true}),
 entity: text('entity').notNull(), kind: text('kind').notNull(),
 ref: text('ref').notNull().default(''), title: text('title').notNull(),
 amount: real('amount').notNull().default(0), status: text('status').notNull().default('Pending'),
 vendor: text('vendor').notNull().default(''), dueDate: text('due_date').notNull().default(''),
 notes: text('notes').notNull().default(''), actor: text('actor').notNull(),
 createdAt: text('created_at').notNull(),
}, t=>[index('idx_records_entity_kind').on(t.entity,t.kind)]);

export const layoutDocuments=sqliteTable('layout_documents',{
 id:text('id').primaryKey(), filename:text('filename').notNull(), mime:text('mime').notNull(),
 extractedText:text('extracted_text').notNull(), recordCount:integer('record_count').notNull(),
 actor:text('actor').notNull(), createdAt:text('created_at').notNull(),
});

export const procurementDocuments=sqliteTable('procurement_documents',{
 id:text('id').primaryKey(),actor:text('actor').notNull(),entity:text('entity').notNull(),hash:text('hash').notNull(),businessKey:text('business_key').notNull(),
 filename:text('filename').notNull(),mime:text('mime').notNull(),type:text('type').notNull(),status:text('status').notNull(),
 vendor:text('vendor').notNull(),email:text('email').notNull(),phone:text('phone').notNull(),reference:text('reference').notNull(),relatedReference:text('related_reference').notNull(),date:text('date').notNull(),currency:text('currency').notNull(),total:real('total').notNull(),
 extractedText:text('extracted_text').notNull(),items:text('items').notNull(),createdAt:text('created_at').notNull(),approvedAt:text('approved_at'),
},t=>[index('idx_procurement_actor_entity').on(t.actor,t.entity),uniqueIndex('idx_procurement_business_key').on(t.businessKey)]);

export const vendorSchedules=sqliteTable('vendor_schedules',{
 id:text('id').primaryKey(),actor:text('actor').notNull(),entity:text('entity').notNull(),documentId:text('document_id').notNull(),
 amount:real('amount').notNull(),date:text('date').notNull(),startTime:text('start_time').notNull(),endTime:text('end_time').notNull(),timeZone:text('time_zone').notNull(),startUtc:text('start_utc').notNull(),endUtc:text('end_utc').notNull(),location:text('location').notNull(),contact:text('contact').notNull(),checkNumber:text('check_number').notNull(),recipient:text('recipient').notNull(),notes:text('notes').notNull(),status:text('status').notNull(),version:integer('version').notNull(),history:text('history').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_schedule_account_project').on(t.actor,t.entity)]);
