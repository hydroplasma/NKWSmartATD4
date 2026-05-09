# Design Document: ระบบเช็คและติดตามนักเรียนเข้าร่วมกิจกรรมหน้าเสาธง

## Color Palette

| Token | Light | Usage |
|-------|-------|-------|
| Primary | #F97316 (Orange-500) | Buttons, active states, accents |
| Primary Dark | #EA580C (Orange-600) | Pressed states |
| Background | #FFFFFF (White) | Screen backgrounds |
| Surface | #FFF7ED (Orange-50) | Cards, elevated surfaces |
| Foreground | #1C1917 (Stone-900) | Primary text |
| Muted | #78716C (Stone-500) | Secondary text |
| Border | #E7E5E4 (Stone-200) | Borders, dividers |
| Header BG | #F97316 (Orange-500) | Header/navbar background |
| Success | #22C55E (Green-500) | มา (Present) status |
| Error | #EF4444 (Red-500) | ขาด (Absent) status |
| Warning | #EAB308 (Yellow-500) | สาย (Late) status |
| Info | #3B82F6 (Blue-500) | ลา (Leave) status |
| Purple | #A855F7 (Purple-500) | ป่วย (Sick) status |

## Screen List

1. **LoginScreen** - หน้าเข้าสู่ระบบ
2. **HomeScreen (Dashboard)** - หน้าแรก/แดชบอร์ด
3. **AttendanceScreen** - หน้าเช็คชื่อนักเรียน (ฟอร์มเช็คชื่อ)
4. **CheckClassroomScreen** - หน้าเช็คชื่อรายห้อง (modal/sheet)
5. **ClassroomSummaryScreen** - หน้าสรุปตามห้องเรียน
6. **OverallSummaryScreen** - หน้าสรุปภาพรวมทั้งโรงเรียน

## Primary Content and Functionality

### LoginScreen
- โลโก้โรงเรียน (NKW)
- ชื่อระบบ
- ชื่อโรงเรียน
- ฟอร์ม: ชื่อผู้ใช้, รหัสผ่าน
- ปุ่มเข้าสู่ระบบ (สีส้ม)

### HomeScreen (Dashboard)
- Header: โลโก้ + ชื่อระบบ + ชื่อครู + ปุ่มออกจากระบบ
- Tab navigation: ฟอร์มเช็คชื่อ | สรุปตามห้องเรียน | สรุปภาพรวม
- แสดงวันที่ปัจจุบัน (ภาษาไทย)
- เลือกช่วงเวลา (เช้า/เที่ยง)

### AttendanceScreen
- เลือกวันที่ (date picker)
- เลือกช่วงเวลา (เช้า/เที่ยง) - ปุ่ม toggle
- ตารางรายห้องเรียน: ห้อง, จำนวนนักเรียน, มา, ขาด, สาย, ลา, ป่วย, สถานะ, ปุ่มเช็คชื่อ
- แสดงสถานะว่าเช็คชื่อแล้วหรือยัง

### CheckClassroomScreen (Bottom Sheet/Modal)
- ชื่อห้องเรียน + วันที่ + ช่วงเวลา
- รายชื่อนักเรียนทั้งห้อง
- แต่ละนักเรียน: เลขที่, ชื่อ, dropdown สถานะ (มา/ขาด/สาย/ลา/ป่วย), ช่องเหตุผล
- ปุ่มบันทึก

### ClassroomSummaryScreen
- เลือกห้องเรียน (dropdown)
- เลือกวันที่ (date picker)
- เลือกช่วงเวลา (เช้า/เที่ยง)
- แสดงสรุปสถิติห้องนั้น
- รายชื่อนักเรียนพร้อมสถานะ

### OverallSummaryScreen
- เลือกวันที่ (date picker)
- เลือกช่วงเวลา (เช้า/เที่ยง)
- ตารางสรุปทุกห้อง: ห้อง, นักเรียน, มา, ขาด, สาย, ลา, ป่วย, สถานะ

## Key User Flows

### Flow 1: Login
Login Screen → กรอก username/password → กด "เข้าสู่ระบบ" → แสดงหน้า Dashboard

### Flow 2: เช็คชื่อนักเรียน
Dashboard → Tab "ฟอร์มเช็คชื่อ" → เลือกวันที่ + ช่วงเวลา → กด "เช็คชื่อ" ที่ห้อง → Bottom Sheet รายชื่อนักเรียน → เลือกสถานะแต่ละคน → กด "บันทึก"

### Flow 3: ดูสรุปห้องเรียน
Dashboard → Tab "สรุปตามห้องเรียน" → เลือกห้อง + วันที่ + ช่วงเวลา → ดูสรุปสถิติ + รายชื่อ

### Flow 4: ดูสรุปภาพรวม
Dashboard → Tab "สรุปภาพรวม" → เลือกวันที่ + ช่วงเวลา → ดูตารางสรุปทุกห้อง

## Navigation Structure

```
App
├── (auth)/
│   └── login.tsx          ← Login Screen
└── (tabs)/
    ├── _layout.tsx        ← Tab bar (3 tabs)
    ├── index.tsx          ← ฟอร์มเช็คชื่อ (Attendance)
    ├── classroom.tsx      ← สรุปตามห้องเรียน
    └── overall.tsx        ← สรุปภาพรวม
```

## Typography
- Font: Sarabun (Thai font)
- Heading: 20-24px, Bold
- Body: 14-16px, Regular
- Caption: 12px, Regular

## Component Design

### Status Badge Colors
- มา: bg-green-100, text-green-700
- ขาด: bg-red-100, text-red-700
- สาย: bg-yellow-100, text-yellow-700
- ลา: bg-blue-100, text-blue-700
- ป่วย: bg-purple-100, text-purple-700

### Header
- Background: Orange (#F97316)
- Text: White
- Height: 56px + safe area

### Tab Bar
- Active: Orange (#F97316)
- Inactive: Gray (#78716C)
- Background: White
