import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo student and attendance data...');

  const passwordHash = await bcrypt.hash('Demo@123', 10);

  // Upsert demo student
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@attendwise.edu' },
    update: {},
    create: {
      name: 'Aarav Sharma',
      studentId: 'RA2211003010123',
      email: 'demo@attendwise.edu',
      passwordHash,
      targetPercentage: 75.0,
      collegeName: 'SRM Institute of Science & Technology',
      department: 'Computer Science & Engineering',
      semester: 5,
    },
  });

  // Clear existing demo subjects if any
  await prisma.subject.deleteMany({
    where: { userId: demoUser.id },
  });

  const demoSubjects = [
    {
      subjectCode: '21CSC302J',
      subjectName: 'Design and Analysis of Algorithms',
      teacherName: 'Dr. K. Ramesh',
      totalClasses: 42,
      attendedClasses: 35,
      color: '#3B82F6', // Blue
    },
    {
      subjectCode: '21CSC303J',
      subjectName: 'Database Management Systems',
      teacherName: 'Prof. Ananya Sen',
      totalClasses: 40,
      attendedClasses: 28,
      color: '#F59E0B', // Amber
    },
    {
      subjectCode: '21CSC304J',
      subjectName: 'Computer Networks',
      teacherName: 'Dr. S. Venkatesh',
      totalClasses: 38,
      attendedClasses: 32,
      color: '#10B981', // Emerald
    },
    {
      subjectCode: '21MTH301T',
      subjectName: 'Discrete Mathematics',
      teacherName: 'Dr. P. Balaji',
      totalClasses: 36,
      attendedClasses: 24,
      color: '#EF4444', // Red
    },
    {
      subjectCode: '21CSE381T',
      subjectName: 'Cloud Computing Essentials',
      teacherName: 'Prof. Meenakshi Sundaram',
      totalClasses: 32,
      attendedClasses: 29,
      color: '#8B5CF6', // Purple
    },
    {
      subjectCode: '21CSC305P',
      subjectName: 'Full Stack Web Development Lab',
      teacherName: 'Dr. R. Preethi',
      totalClasses: 24,
      attendedClasses: 22,
      color: '#06B6D4', // Cyan
    },
  ];

  for (const s of demoSubjects) {
    const createdSubject = await prisma.subject.create({
      data: {
        userId: demoUser.id,
        ...s,
      },
    });

    // Create 3 sample recent logs for each subject
    await prisma.attendanceLog.createMany({
      data: [
        {
          userId: demoUser.id,
          subjectId: createdSubject.id,
          status: 'PRESENT',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
          notes: 'Unit 3 lecture & lab practice',
        },
        {
          userId: demoUser.id,
          subjectId: createdSubject.id,
          status: s.color === '#EF4444' || s.color === '#F59E0B' ? 'ABSENT' : 'PRESENT',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          notes: s.color === '#EF4444' ? 'Medical leave' : 'Regular session',
        },
        {
          userId: demoUser.id,
          subjectId: createdSubject.id,
          status: 'PRESENT',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Yesterday
          notes: 'Revision session',
        },
      ],
    });
  }

  console.log('✅ Demo data successfully seeded!');
  console.log('Demo Credentials:');
  console.log('Email: demo@attendwise.edu (or NetID: RA2211003010123)');
  console.log('Password: Demo@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

