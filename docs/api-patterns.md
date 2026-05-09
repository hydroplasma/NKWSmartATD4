# Backend API Patterns (tRPC + Drizzle)

## server/db.ts — Query Functions

```typescript
import { db } from "./_core/db";
import { classrooms, students, teachers, periods, statusList, attendance, appConfig } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function getClassrooms() {
  return db.select().from(classrooms).orderBy(classrooms.name);
}

export async function getStudentsByClassroom(classroomId: string) {
  return db.select().from(students)
    .where(eq(students.classroomId, classroomId))
    .orderBy(students.number);
}

export async function verifyTeacher(username: string, password: string) {
  const result = await db.select().from(teachers)
    .where(and(eq(teachers.username, username), eq(teachers.password, password)));
  return result[0] ?? null;
}

export async function getPeriods() {
  return db.select().from(periods).where(eq(periods.status, 1));
}

export async function getStatusList() {
  return db.select().from(statusList);
}

export async function getAppConfig() {
  const rows = await db.select().from(appConfig);
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function getAttendance(date: string, period: string, roomId: string) {
  const result = await db.select().from(attendance)
    .where(and(eq(attendance.date, date), eq(attendance.period, period), eq(attendance.roomId, roomId)));
  return result[0] ?? null;
}

export async function getAttendanceByDatePeriod(date: string, period: string) {
  return db.select().from(attendance)
    .where(and(eq(attendance.date, date), eq(attendance.period, period)));
}

export async function saveAttendance(data: {
  date: string; period: string; roomId: string;
  teacher: string; students: any[];
}) {
  const existing = await getAttendance(data.date, data.period, data.roomId);
  if (existing) {
    await db.update(attendance)
      .set({ teacher: data.teacher, students: data.students, updatedAt: new Date() })
      .where(eq(attendance.id, existing.id));
    return { action: 'updated' };
  } else {
    await db.insert(attendance).values({
      date: data.date, period: data.period, roomId: data.roomId,
      teacher: data.teacher, students: data.students,
    });
    return { action: 'created' };
  }
}
```

## server/routers.ts — tRPC Router

```typescript
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  teacherLogin: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const teacher = await db.verifyTeacher(input.username, input.password);
      if (!teacher) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return teacher;
    }),

  classrooms: publicProcedure.query(() => db.getClassrooms()),
  studentsByClassroom: publicProcedure
    .input(z.object({ classroomId: z.string() }))
    .query(({ input }) => db.getStudentsByClassroom(input.classroomId)),
  periods: publicProcedure.query(() => db.getPeriods()),
  statusList: publicProcedure.query(() => db.getStatusList()),
  appConfig: publicProcedure.query(() => db.getAppConfig()),

  getAttendance: publicProcedure
    .input(z.object({ date: z.string(), period: z.string(), roomId: z.string() }))
    .query(({ input }) => db.getAttendance(input.date, input.period, input.roomId)),

  getAttendanceByDatePeriod: publicProcedure
    .input(z.object({ date: z.string(), period: z.string() }))
    .query(({ input }) => db.getAttendanceByDatePeriod(input.date, input.period)),

  saveAttendance: publicProcedure
    .input(z.object({
      date: z.string(), period: z.string(), roomId: z.string(),
      teacher: z.string(), students: z.array(z.any()),
    }))
    .mutation(({ input }) => db.saveAttendance(input)),
});

export type AppRouter = typeof appRouter;
```

## drizzle/schema.ts

```typescript
import { pgTable, text, integer, jsonb, serial, timestamp } from "drizzle-orm/pg-core";

export const classrooms = pgTable("classrooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level"),
  teacherId: text("teacher_id"),
});

export const teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  classroomId: text("classroom_id"),
});

export const students = pgTable("students", {
  id: text("id").primaryKey(),
  prefix: text("prefix"),
  firstname: text("firstname").notNull(),
  lastname: text("lastname").notNull(),
  classroomId: text("classroom_id").notNull(),
  number: integer("number"),
});

export const periods = pgTable("periods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: integer("status").default(1),
});

export const statusList = pgTable("status_list", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  color: text("color"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  period: text("period").notNull(),
  roomId: text("room_id").notNull(),
  teacher: text("teacher"),
  students: jsonb("students"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value"),
});
```
