import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("지원자"),
  headline: text("headline").notNull().default(""),
  field: text("field").notNull().default("디자인"),
  career: text("career").notNull().default("1~3년"),
  targetRoles: text("target_roles").notNull().default(""),
  resumeText: text("resume_text").notNull().default(""),
  portfolioText: text("portfolio_text").notNull().default(""),
  resumeFileName: text("resume_file_name").notNull().default(""),
  portfolioFileName: text("portfolio_file_name").notNull().default(""),
  preferences: text("preferences").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
