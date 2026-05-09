# Screen Specifications

## Login Screen (`app/login.tsx`)

**Layout:** Full orange background (`bg-primary`), centered card.

```
[School Logo 80×80, circular white border]
[School Name — bold white text]
[System subtitle — white/80 text]
[Semester info — white/60 text]

White card:
  [Title: เข้าสู่ระบบ]
  [TextInput: ชื่อผู้ใช้]
  [TextInput: รหัสผ่าน, secureTextEntry]
  [Button: เข้าสู่ระบบ — orange]
  [Error message if failed]

[Footer: ภาคเรียนที่ X ปีการศึกษา XXXX]
```

**Logic:**
- Call `trpc.teacherLogin.mutate({ username, password })`
- On success: `teacherAuth.login(teacher)` → navigate to `/(tabs)/`
- On error: show Thai error message

---

## Attendance Screen — Tab 1 (`app/(tabs)/index.tsx`)

**Layout:** AppHeader + period selector + FlatList of classroom cards.

```
[AppHeader]
[Period Selector: เช้า | บ่าย — pill buttons]
[Date display]

FlatList of ClassroomCards:
  Each card shows:
  - Room name + teacher name
  - Status badge: "เช็คแล้ว" (green) or "ยังไม่เช็ค" (gray)
  - Mini stats: มา X | ขาด X | สาย X
  - Tap → open CheckInModal
```

**CheckInModal (bottom sheet style):**
```
[Header: ห้อง X.X — วันที่]
[Period + date info]

[Quick-select buttons: เลือกทั้งหมด มา / ขาด / สาย / ลา / ป่วย]

FlatList of StudentRows:
  [Number] [Name]  [มา][ขาด][สาย][ลา][ป่วย] — radio-style buttons

[Footer: บันทึกการเช็คชื่อ — orange button]
```

**Logic:**
- Load existing attendance on open (pre-fill student statuses)
- Default status = "มา" for all students
- "เลือกทั้งหมด" sets all students to that status
- Save calls `trpc.saveAttendance.mutate(...)`
- After save: refresh classroom card status

---

## Classroom Summary Screen — Tab 2 (`app/(tabs)/classroom.tsx`)

**Layout:** AppHeader + classroom picker + stats cards + student list.

```
[AppHeader]
[Period Selector]
[Classroom Picker: horizontal scroll of room buttons]

Stats Row (5 cards):
  มา | ขาด | สาย | ลา | ป่วย

FlatList of StudentRows:
  [Number] [Name]  [Status Badge]
```

**Logic:**
- Default to teacher's own classroom
- Load attendance for selected room+date+period
- Show "ยังไม่มีข้อมูล" if no attendance recorded

---

## Overall Summary Screen — Tab 3 (`app/(tabs)/overall.tsx`)

**Layout:** AppHeader + period selector + grand total cards + room table.

```
[AppHeader]
[Period Selector]
[Date display]

Grand Total Section:
  Row 1: [ทั้งหมด] [มาเรียน] [ขาดเรียน]
  Row 2: [มาสาย]  [ลาหยุด]  [ลาป่วย]
  [Attendance Rate Bar: X%]
  [เช็คแล้ว X/Y ห้อง]

Room Table:
  Header: ห้อง | รวม | มา | ขาด | สาย | ลา | ป่วย
  Rows: one per classroom
  Footer: รวมทั้งหมด (orange background)
```

**Logic:**
- Call `trpc.getAttendanceByDatePeriod.useQuery({ date, period })`
- Build per-room summary by matching `roomId` to classrooms list
- Rooms with no attendance show "-" and "ยังไม่เช็ค" badge
- Attendance rate = (มา / total) × 100

---

## AppHeader Component (`components/app-header.tsx`)

```typescript
interface AppHeaderProps {
  title?: string;
  showLogout?: boolean;
}
```

**Layout:**
```
[School Logo 32×32] [Title text]  [Logout icon button]
```

- Logo: use `Image` from `expo-image` with the school logo URL
- Title defaults to school name from `appConfig`
- Logout button calls `teacherAuth.logout()` → navigate to `/login`
- Background: white with bottom border

---

## Teacher Auth Context (`lib/teacher-auth.tsx`)

```typescript
interface Teacher {
  id: string;
  name: string;
  username: string;
  classroomId: string | null;
}

interface TeacherAuthContextType {
  teacher: Teacher | null;
  isLoading: boolean;
  login: (teacher: Teacher) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Storage key:** `@teacher_session`

**Persistence:** Load from AsyncStorage on app start. Save on login. Clear on logout.

**Navigation guard:** In `app/_layout.tsx`, redirect to `/login` if `!teacher && !isLoading`.
