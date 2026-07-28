import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  gender: text('gender', { enum: ['男', '女'] }).notNull(),
  ageBand: text('age_band').notNull(),
  stomaType: text('stoma_type').notNull(),
  surgeryDate: text('surgery_date').notNull(),
  caregiverRole: text('caregiver_role').notNull(),
  primaryNurse: text('primary_nurse').notNull(),
  status: text('status', { enum: ['在册', '暂停', '结束'] }).notNull().default('在册'),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export const carePointVersions = sqliteTable('care_point_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  version: text('version').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  activatedAt: text('activated_at'),
});

export const carePoints = sqliteTable('care_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  versionId: integer('version_id').notNull(),
  code: text('code').notNull(),
  orderIdx: integer('order_idx').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  mustFlag: integer('must_flag', { mode: 'boolean' }).notNull().default(true),
  keywords: text('keywords').notNull(),
  evidenceHints: text('evidence_hints').notNull(),
  createdAt: text('created_at').notNull(),
});

export const careRecords = sqliteTable('care_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull(),
  versionId: integer('version_id').notNull(),
  recordedAt: text('recorded_at').notNull(),
  recordedBy: text('recorded_by').notNull(),
  generalNote: text('general_note'),
  status: text('status', { enum: ['待复核', '已确认', '需随访', '暂不适用'] })
    .notNull()
    .default('待复核'),
  createdAt: text('created_at').notNull(),
});

export const careRecordItems = sqliteTable('care_record_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordId: integer('record_id').notNull(),
  pointId: integer('point_id').notNull(),
  execution: text('execution', {
    enum: ['已按要点执行', '部分执行', '暂未执行', '不适用'],
  }).notNull(),
  rawText: text('raw_text').notNull(),
  aiStatus: text('ai_status', {
    enum: ['与要点一致', '表达模糊，需再次确认', '未明确提及', '未提及', '依据不足'],
  }).notNull(),
  aiMatch: real('ai_match').notNull().default(0),
  aiEvidence: text('ai_evidence').notNull(),
  aiReason: text('ai_reason').notNull(),
  nurseStatus: text('nurse_status', {
    enum: ['未复核', '已确认', '需随访', '暂不适用'],
  }).notNull()
    .default('未复核'),
  nurseNote: text('nurse_note'),
  reviewedAt: text('reviewed_at'),
  reviewedBy: text('reviewed_by'),
});

export const nurseAccounts = sqliteTable('nurse_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: text('role').notNull(),
  createdAt: text('created_at').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  meta: text('meta'),
  createdAt: text('created_at').notNull(),
});

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
