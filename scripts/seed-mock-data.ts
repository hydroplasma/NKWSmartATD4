import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

const ROOMS = [
  { id: 'm1-1', name: 'ม.1/1' },
  { id: 'm1-2', name: 'ม.1/2' },
  { id: 'm2-1', name: 'ม.2/1' },
  { id: 'm2-2', name: 'ม.2/2' },
];

const TEACHERS = [
  { name: 'แอดมิน ระบบ', username: 'admin', password: 'admin123', role: 'admin', classroom_ids: 'm1-1,m1-2,m2-1,m2-2' },
  { name: 'ครูสมชาย สายเสมอ', username: 'teacher1', password: 'password123', role: 'teacher', classroom_ids: 'm1-1,m2-1' },
];

const STUDENTS = [
  // Room m1-1
  { student_id: 'S001', classroom_id: 'm1-1', no: 1, name: 'เด็กชายก้องภพ เรียนดี' },
  { student_id: 'S002', classroom_id: 'm1-1', no: 2, name: 'เด็กชายกมล ขยันอ่าน' },
  { student_id: 'S003', classroom_id: 'm1-1', no: 3, name: 'เด็กหญิงกานดา รักเรียน' },
  { student_id: 'S004', classroom_id: 'm1-1', no: 4, name: 'เด็กหญิงเกศรา มีวินัย' },
  // Room m1-2
  { student_id: 'S005', classroom_id: 'm1-2', no: 1, name: 'เด็กชายขจรศักดิ์ ใจดี' },
  { student_id: 'S006', classroom_id: 'm1-2', no: 2, name: 'เด็กชายขวัญชัย ใฝ่รู้' },
  { student_id: 'S007', classroom_id: 'm1-2', no: 3, name: 'เด็กหญิงขวัญใจ อ่อนน้อม' },
  { student_id: 'S008', classroom_id: 'm1-2', no: 4, name: 'เด็กหญิงแขไข สดใส' },
  // Room m2-1
  { student_id: 'S009', classroom_id: 'm2-1', no: 1, name: 'เด็กชายคเชนทร์ กล้าหาญ' },
  { student_id: 'S010', classroom_id: 'm2-1', no: 2, name: 'เด็กชายคเนศ สมาร์ท' },
  { student_id: 'S011', classroom_id: 'm2-1', no: 3, name: 'เด็กหญิงคัทลียา งดงาม' },
  { student_id: 'S012', classroom_id: 'm2-1', no: 4, name: 'เด็กหญิงคำหวาน อ่อนหวาน' },
  // Room m2-2
  { student_id: 'S013', classroom_id: 'm2-2', no: 1, name: 'เด็กชายฆนากร ใจบุญ' },
  { student_id: 'S014', classroom_id: 'm2-2', no: 2, name: 'เด็กชายฆฤณ รุ่งเรือง' },
  { student_id: 'S015', classroom_id: 'm2-2', no: 3, name: 'เด็กหญิงงามตา น่ารัก' },
  { student_id: 'S016', classroom_id: 'm2-2', no: 4, name: 'เด็กหญิงเงินตรา ร่ำรวย' },
];

async function seed() {
  console.log('🌱 Starting Data Seeding...');
  
  try {
    // 1. Insert Rooms
    console.log('Inserting Rooms...');
    for (const room of ROOMS) {
      await sql`
        INSERT INTO classrooms (id, name, status) 
        VALUES (${room.id}, ${room.name}, 1)
        ON CONFLICT (id) DO UPDATE SET name = ${room.name}
      `;
    }

    // 2. Insert Teachers
    console.log('Inserting Teachers...');
    for (const teacher of TEACHERS) {
      await sql`
        INSERT INTO teachers (name, username, password, status, role, classroom_ids)
        VALUES (${teacher.name}, ${teacher.username}, ${teacher.password}, 1, ${teacher.role}, ${teacher.classroom_ids})
        ON CONFLICT (username) DO UPDATE SET 
          name = ${teacher.name},
          password = ${teacher.password},
          classroom_ids = ${teacher.classroom_ids}
      `;
    }

    // 3. Insert Students
    console.log('Inserting Students...');
    for (const student of STUDENTS) {
      await sql`
        INSERT INTO students (student_id, classroom_id, no, name, status)
        VALUES (${student.student_id}, ${student.classroom_id}, ${student.no}, ${student.name}, 1)
        ON CONFLICT (student_id) DO UPDATE SET
          name = ${student.name},
          classroom_id = ${student.classroom_id},
          no = ${student.no}
      `;
    }

    console.log('✅ Mock data seeded successfully!');
    console.log('-----------------------------------');
    console.log('Login Info:');
    console.log('- Admin: username: admin / password: admin123');
    console.log('- Teacher 1: username: teacher1 / password: password123');
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await sql.end();
    process.exit();
  }
}

seed();
