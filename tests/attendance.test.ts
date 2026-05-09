import { describe, it, expect } from "vitest";

// ---- Thai date utility tests ----
function formatThaiDate(dateStr: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const dayNum = d.getDate();
  const monthName = thaiMonths[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${dayNum} ${monthName} ${yearBE}`;
}

function formatDateForDB(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe("Thai Date Utilities", () => {
  it("should format date to Thai format correctly", () => {
    expect(formatThaiDate("2026-01-01")).toBe("1 มกราคม 2569");
    expect(formatThaiDate("2026-02-22")).toBe("22 กุมภาพันธ์ 2569");
    expect(formatThaiDate("2025-12-31")).toBe("31 ธันวาคม 2568");
  });

  it("should format date for DB correctly", () => {
    const d = new Date(2026, 1, 22); // Feb 22, 2026
    expect(formatDateForDB(d)).toBe("2026-02-22");
  });

  it("should pad single digit month and day", () => {
    const d = new Date(2026, 0, 5); // Jan 5, 2026
    expect(formatDateForDB(d)).toBe("2026-01-05");
  });
});

// ---- Attendance status logic tests ----
type StatusId = "present" | "absent" | "late" | "leave" | "sick";

function getStatusColor(statusId: StatusId): string {
  const colors: Record<StatusId, string> = {
    present: "#22C55E",
    absent: "#EF4444",
    late: "#F59E0B",
    leave: "#3B82F6",
    sick: "#A855F7",
  };
  return colors[statusId] ?? "#9CA3AF";
}

function calculateAttendanceRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

describe("Attendance Status Logic", () => {
  it("should return correct color for each status", () => {
    expect(getStatusColor("present")).toBe("#22C55E");
    expect(getStatusColor("absent")).toBe("#EF4444");
    expect(getStatusColor("late")).toBe("#F59E0B");
    expect(getStatusColor("leave")).toBe("#3B82F6");
    expect(getStatusColor("sick")).toBe("#A855F7");
  });

  it("should calculate attendance rate correctly", () => {
    expect(calculateAttendanceRate(25, 30)).toBe(83);
    expect(calculateAttendanceRate(30, 30)).toBe(100);
    expect(calculateAttendanceRate(0, 30)).toBe(0);
    expect(calculateAttendanceRate(0, 0)).toBe(0);
  });

  it("should round attendance rate to nearest integer", () => {
    expect(calculateAttendanceRate(1, 3)).toBe(33);
    expect(calculateAttendanceRate(2, 3)).toBe(67);
  });
});

// ---- Teacher role permission tests ----
type TeacherRole = "admin" | "teacher";

function canAccessClassroom(
  role: TeacherRole,
  classroomIds: string,
  targetClassroomId: string
): boolean {
  if (role === "admin") return true;
  if (!classroomIds || classroomIds.trim() === "") return true; // no restriction
  const allowed = classroomIds.split(",").map((r) => r.trim());
  return allowed.includes(targetClassroomId);
}

function canAccessAdminPanel(role: TeacherRole): boolean {
  return role === "admin";
}

describe("Teacher Role Permissions", () => {
  it("admin should access all classrooms", () => {
    expect(canAccessClassroom("admin", "", "1/1")).toBe(true);
    expect(canAccessClassroom("admin", "1/1", "1/2")).toBe(true);
    expect(canAccessClassroom("admin", "1/1,1/2", "1/3")).toBe(true);
  });

  it("teacher with no restriction should access all classrooms", () => {
    expect(canAccessClassroom("teacher", "", "1/1")).toBe(true);
    expect(canAccessClassroom("teacher", "   ", "1/1")).toBe(true);
  });

  it("teacher with restriction should only access assigned classrooms", () => {
    expect(canAccessClassroom("teacher", "1/1,1/2", "1/1")).toBe(true);
    expect(canAccessClassroom("teacher", "1/1,1/2", "1/2")).toBe(true);
    expect(canAccessClassroom("teacher", "1/1,1/2", "1/3")).toBe(false);
  });

  it("only admin can access admin panel", () => {
    expect(canAccessAdminPanel("admin")).toBe(true);
    expect(canAccessAdminPanel("teacher")).toBe(false);
  });
});

// ---- Notification time validation tests ----
function isValidNotifyTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function parseNotifyTime(time: string): { hour: number; minute: number } | null {
  if (!isValidNotifyTime(time)) return null;
  const [h, m] = time.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hour: h, minute: m };
}

describe("Notification Time Validation", () => {
  it("should validate correct time format", () => {
    expect(isValidNotifyTime("07:30")).toBe(true);
    expect(isValidNotifyTime("00:00")).toBe(true);
    expect(isValidNotifyTime("23:59")).toBe(true);
  });

  it("should reject invalid time formats", () => {
    expect(isValidNotifyTime("7:30")).toBe(false);
    expect(isValidNotifyTime("730")).toBe(false);
    expect(isValidNotifyTime("07:3")).toBe(false);
    expect(isValidNotifyTime("")).toBe(false);
  });

  it("should parse valid time correctly", () => {
    expect(parseNotifyTime("07:30")).toEqual({ hour: 7, minute: 30 });
    expect(parseNotifyTime("23:59")).toEqual({ hour: 23, minute: 59 });
  });

  it("should return null for invalid time", () => {
    expect(parseNotifyTime("7:30")).toBeNull();
    expect(parseNotifyTime("25:00")).toBeNull();
  });
});

// ---- Search/filter student tests ----
interface Student {
  id: number;
  name: string;
  studentNumber: string;
}

function filterStudents(students: Student[], query: string): Student[] {
  if (!query.trim()) return students;
  const q = query.toLowerCase().trim();
  return students.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
  );
}

describe("Student Search Filter", () => {
  const students: Student[] = [
    { id: 1, name: "สมชาย ใจดี", studentNumber: "001" },
    { id: 2, name: "สมหญิง รักเรียน", studentNumber: "002" },
    { id: 3, name: "วิชัย มีสุข", studentNumber: "003" },
  ];

  it("should return all students when query is empty", () => {
    expect(filterStudents(students, "")).toHaveLength(3);
    expect(filterStudents(students, "   ")).toHaveLength(3);
  });

  it("should filter by name", () => {
    const result = filterStudents(students, "สมชาย");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("should filter by student number", () => {
    const result = filterStudents(students, "002");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("should be case-insensitive for latin characters", () => {
    const studentsLatin: Student[] = [
      { id: 1, name: "John Doe", studentNumber: "A001" },
    ];
    expect(filterStudents(studentsLatin, "john")).toHaveLength(1);
    expect(filterStudents(studentsLatin, "JOHN")).toHaveLength(1);
  });

  it("should return empty array when no match", () => {
    expect(filterStudents(students, "ไม่มีนักเรียนชื่อนี้")).toHaveLength(0);
  });
});
