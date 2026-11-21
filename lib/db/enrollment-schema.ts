import { pgTable, text, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";

export const gatewayEnrollments = pgTable("rig_gateway_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  gatewayId: uuid("gateway_id").references(() => gateways.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull().unique(),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  consumedBy: text("consumed_by").references(() => users.id, { onDelete: "set null" }),
  attempts: text("attempts").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("rig_gateway_enrollments_gateway_idx").on(table.gatewayId),
  index("rig_gateway_enrollments_status_idx").on(table.status),
]);

export const gatewayDevices = pgTable("rig_gateway_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  gatewayId: uuid("gateway_id").notNull().references(() => gateways.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("unknown"),
  status: text("status").notNull().default("offline"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("rig_gateway_devices_gateway_idx").on(table.gatewayId)]);
