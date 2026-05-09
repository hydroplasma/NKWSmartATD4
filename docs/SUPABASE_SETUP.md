# Supabase Setup Guide

## 1. สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com)
2. สมัครสมาชิก และสร้าง project ใหม่
3. คัดลอก **Project URL** และ **Anon Key** จาก Settings → API Keys

## 2. สร้าง Tables

ไปที่ SQL Editor ใน Supabase Dashboard และรัน SQL commands ด้านล่าง:

### สร้าง Teachers Table

```sql
CREATE TABLE teachers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  status INTEGER DEFAULT 1,
  role VARCHAR(20) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin')),
  classroom_ids TEXT,
  notify_time VARCHAR(5) DEFAULT '07:30',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_teachers_username ON teachers(username);
```

### สร้าง Classrooms Table

```sql
CREATE TABLE classrooms (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### สร้าง Students Table

```sql
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  classroom_id VARCHAR(20) NOT NULL REFERENCES classrooms(id),
  no INTEGER NOT NULL,
  name VARCHAR(200) NOT NULL,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_classroom ON students(classroom_id);
CREATE INDEX idx_students_student_id ON students(student_id);
```

### สร้าง Attendance Table

```sql
CREATE TABLE attendance (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id),
  classroom_id VARCHAR(20) NOT NULL REFERENCES classrooms(id),
  period_id VARCHAR(20),
  date DATE NOT NULL,
  status_id INTEGER,
  teacher_id BIGINT REFERENCES teachers(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_classroom ON attendance(classroom_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
```

### สร้าง Periods Table

```sql
CREATE TABLE periods (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  status INTEGER DEFAULT 1
);
```

### สร้าง Status List Table

```sql
CREATE TABLE status_list (
  id BIGSERIAL PRIMARY KEY,
  label VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL,
  hex_color VARCHAR(20) NOT NULL,
  status INTEGER DEFAULT 1
);
```

### สร้าง App Config Table

```sql
CREATE TABLE app_config (
  id BIGSERIAL PRIMARY KEY,
  school_name VARCHAR(200),
  school_logo_url TEXT,
  school_icon_url TEXT,
  developer_name VARCHAR(200),
  theme_color VARCHAR(20) DEFAULT 'orange',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3. เพิ่ม Mock Data

### เพิ่มห้องเรียน

```sql
INSERT INTO classrooms (id, name, status) VALUES
  ('m1-1', 'ม.1/1', 1),
  ('m1-2', 'ม.1/2', 1),
  ('m2-1', 'ม.2/1', 1),
  ('m2-2', 'ม.2/2', 1),
  ('m3-1', 'ม.3/1', 1);
```

### เพิ่มครู

```sql
INSERT INTO teachers (name, username, password, status, role, classroom_ids, notify_time) VALUES
  ('ครูที่ 1', 't1', '123', 1, 'teacher', 'm1-1,m1-2', '07:30'),
  ('ครูที่ 2', 't2', '456', 1, 'teacher', 'm2-1,m2-2', '07:30'),
  ('ผู้ดูแลระบบ', 'admin', 'admin123', 1, 'admin', 'm1-1,m1-2,m2-1,m2-2,m3-1', '07:00');
```

### เพิ่มนักเรียน

```sql
INSERT INTO students (student_id, classroom_id, no, name, status) VALUES
  ('001', 'm1-1', 1, 'เด็ก 1', 1),
  ('002', 'm1-1', 2, 'เด็ก 2', 1),
  ('003', 'm1-1', 3, 'เด็ก 3', 1),
  ('004', 'm1-2', 1, 'เด็ก 4', 1),
  ('005', 'm1-2', 2, 'เด็ก 5', 1);
```

### เพิ่มช่วงเวลา

```sql
INSERT INTO periods (id, name, status) VALUES
  ('morning', 'เช้า', 1),
  ('noon', 'สุดสัปดาห์', 1),
  ('evening', 'เย็น', 1);
```

### เพิ่มสถานะการเข้าเรียน

```sql
INSERT INTO status_list (label, color, hex_color, status) VALUES
  ('มาเรียน', 'green', '#22C55E', 1),
  ('ขาดเรียน', 'red', '#EF4444', 1),
  ('สาย', 'yellow', '#F59E0B', 1),
  ('ลาป่วย', 'blue', '#3B82F6', 1);
```

### เพิ่มตั้งค่าแอพ

```sql
INSERT INTO app_config (school_name, developer_name, theme_color) VALUES
  ('โรงเรียนตัวอย่าง', 'Developer Name', 'orange');
```

## 4. เปิดใช้ Row Level Security (RLS)

สำหรับความปลอดภัย ให้เปิด RLS สำหรับทุก table:

```sql
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- สร้าง policy ให้ทุกคนอ่านได้ (สำหรับ public access)
CREATE POLICY "Allow public read" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON classrooms FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON periods FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON status_list FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON app_config FOR SELECT USING (true);
```

## 5. ตั้งค่า Environment Variables

ใน APK ให้ใส่:
- **Supabase URL**: `https://xxxxx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 6. ทดสอบการเชื่อมต่อ

ลอง login ด้วย:
- **Username**: `t1`
- **Password**: `123`
