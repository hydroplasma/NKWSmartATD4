  teacherLogin: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const teacher = await db.getTeacherByUsername(input.username);
      if (!teacher || teacher.password !== input.password || teacher.status !== 1) {
        throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
      return {
        success: true,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          username: teacher.username,
          classroomIds: teacher.classroomIds,
          role: teacher.role as "teacher" | "admin",
          notifyTime: teacher.notifyTime,
        },
      };
    }),

  // Classrooms