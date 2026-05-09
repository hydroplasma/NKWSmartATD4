import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function check() {
  try {
    const classrooms = await sql`SELECT * FROM classrooms`;
    console.log('CLASSROOMS:');
    console.table(classrooms);

    const students = await sql`SELECT classroom_id, COUNT(*) as count FROM students GROUP BY classroom_id`;
    console.log('STUDENT COUNTS:');
    console.table(students);

    const teachers = await sql`SELECT name, role, classroom_ids FROM teachers`;
    console.log('TEACHERS:');
    console.table(teachers);
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

check();
