import { pgTable, serial, json,text, varchar, timestamp, integer } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 256 }).notNull().unique(),
  credits: integer("credits"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const SessionChatTable = pgTable('sessionChatTable', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar('sessionId', { length: 255 }).notNull(),
  notes: text('notes'),
  selectedDoctor: json('selectedDoctor'), 
  conversation: json('conversation'),
  report: json('report'),
  createdBy: varchar('createdBy', { length: 255 }).references(() => users.email),
  createdon: timestamp('createdon').defaultNow()
});
