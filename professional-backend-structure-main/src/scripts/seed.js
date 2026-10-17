import dotenv from "dotenv";
import mongoose from "mongoose";
import { Department } from "../models/department.model.js";
import { AttendanceUser } from "../models/attendanceUser.model.js";

// Load environment variables
dotenv.config({ path: "./.env" });

const seedDatabase = async () => {
  try {
    // Connect to MongoDB - use MONGODB_URI directly as it already contains the database name
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected! Host: " + connectionInstance.connection.host);

    // Drop any obsolete/legacy indexes on attendanceusers collection
    try {
      const userColl = mongoose.connection.collection("attendanceusers");
      const userIndexes = await userColl.indexes();
      if (userIndexes.some((idx) => idx.name === "studentId_1")) {
        await userColl.dropIndex("studentId_1");
        console.log("Dropped legacy studentId_1 index from attendanceusers collection.");
      }
    } catch (e) {
      // Ignore if collection does not exist yet
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Department.deleteMany({});
    // await AttendanceUser.deleteMany({});
    // console.log("Cleared existing data");

    // Seed Departments idempotently
    const departments = [
      {
        name: "Computer Science",
        code: "CS",
        description: "Department of Computer Science and Engineering",
        isActive: true,
      },
      {
        name: "Electronics Engineering",
        code: "ECE",
        description: "Department of Electronics and Communication Engineering",
        isActive: true,
      },
      {
        name: "Mechanical Engineering",
        code: "ME",
        description: "Department of Mechanical Engineering",
        isActive: true,
      },
      {
        name: "Civil Engineering",
        code: "CE",
        description: "Department of Civil Engineering",
        isActive: true,
      },
      {
        name: "Electrical Engineering",
        code: "EE",
        description: "Department of Electrical Engineering",
        isActive: true,
      },
    ];

    let createdDeptCount = 0;
    for (const dept of departments) {
      const exists = await Department.findOne({ code: dept.code });
      if (!exists) {
        await Department.create(dept);
        createdDeptCount++;
      }
    }
    console.log(`Verified departments (created ${createdDeptCount} new).`);

    // Check if admin already exists
    let adminUser = await AttendanceUser.findOne({ email: "admin@attendance.edu" });
    if (adminUser) {
      console.log("Admin user already exists. Skipping admin seeding.");
      console.log("Admin email: " + adminUser.email);
    } else {
      // Get the first department for admin
      const adminDepartment = await Department.findOne({ code: "CS" });
      
      if (!adminDepartment) {
        console.log("No department found. Please seed departments first.");
        process.exit(1);
      }

      // Seed Admin User
      adminUser = await AttendanceUser.create({
        name: "System Administrator",
        email: "admin@attendance.edu",
        password: "Admin@123456", // This will be hashed by the model
        phone: "9876543210",
        role: "admin",
        department: adminDepartment._id,
        employeeId: "ADMIN001",
        designation: "System Administrator",
        isActive: true,
      });

      console.log("Admin user created successfully!");
      console.log("-----------------------------------");
      console.log("Admin Login Credentials:");
      console.log("Email: admin@attendance.edu");
      console.log("Password: Admin@123456");
      console.log("-----------------------------------");
      console.log("⚠️  Please change the admin password after first login!");
    }

    // Get departments for reference
    const csDept = await Department.findOne({ code: "CS" });
    const eceDept = await Department.findOne({ code: "ECE" });
    const meDept = await Department.findOne({ code: "ME" });

    // ==================== SEED FACULTY ====================
    const facultyData = [
      {
        name: "Dr. Priya Sharma",
        email: "priya.sharma@attendance.edu",
        password: "Faculty@123",
        phone: "9876543211",
        role: "faculty",
        department: csDept._id,
        employeeId: "FAC001",
        designation: "Associate Professor",
        isActive: true,
      },
      {
        name: "Prof. Rajesh Kumar",
        email: "rajesh.kumar@attendance.edu",
        password: "Faculty@123",
        phone: "9876543212",
        role: "faculty",
        department: csDept._id,
        employeeId: "FAC002",
        designation: "Assistant Professor",
        isActive: true,
      },
      {
        name: "Dr. Anita Desai",
        email: "anita.desai@attendance.edu",
        password: "Faculty@123",
        phone: "9876543213",
        role: "faculty",
        department: eceDept._id,
        employeeId: "FAC003",
        designation: "Professor",
        isActive: true,
      },
      {
        name: "Prof. Vikram Singh",
        email: "vikram.singh@attendance.edu",
        password: "Faculty@123",
        phone: "9876543214",
        role: "faculty",
        department: meDept._id,
        employeeId: "FAC004",
        designation: "Associate Professor",
        isActive: true,
      },
    ];

    let createdFacultyCount = 0;
    for (const f of facultyData) {
      const exists = await AttendanceUser.findOne({ email: f.email });
      if (!exists) {
        await AttendanceUser.create(f);
        createdFacultyCount++;
      }
    }
    console.log(`Created ${createdFacultyCount} new faculty members (total ${facultyData.length} available)`);

    // ==================== SEED STUDENTS ====================
    const studentData = [
      { name: "Aarav Patel", email: "aarav.patel@attendance.edu", enrollmentNumber: "CS2024001", department: csDept._id, batch: "2024", semester: 3 },
      { name: "Diya Mehta", email: "diya.mehta@attendance.edu", enrollmentNumber: "CS2024002", department: csDept._id, batch: "2024", semester: 3 },
      { name: "Arjun Reddy", email: "arjun.reddy@attendance.edu", enrollmentNumber: "CS2024003", department: csDept._id, batch: "2024", semester: 3 },
      { name: "Ishita Gupta", email: "ishita.gupta@attendance.edu", enrollmentNumber: "CS2024004", department: csDept._id, batch: "2024", semester: 3 },
      { name: "Rohan Joshi", email: "rohan.joshi@attendance.edu", enrollmentNumber: "CS2024005", department: csDept._id, batch: "2024", semester: 3 },
      { name: "Sneha Nair", email: "sneha.nair@attendance.edu", enrollmentNumber: "ECE2024001", department: eceDept._id, batch: "2024", semester: 3 },
      { name: "Kabir Verma", email: "kabir.verma@attendance.edu", enrollmentNumber: "ECE2024002", department: eceDept._id, batch: "2024", semester: 3 },
      { name: "Ananya Iyer", email: "ananya.iyer@attendance.edu", enrollmentNumber: "ECE2024003", department: eceDept._id, batch: "2024", semester: 3 },
      { name: "Vivaan Saxena", email: "vivaan.saxena@attendance.edu", enrollmentNumber: "ME2024001", department: meDept._id, batch: "2024", semester: 3 },
      { name: "Meera Pillai", email: "meera.pillai@attendance.edu", enrollmentNumber: "ME2024002", department: meDept._id, batch: "2024", semester: 3 },
    ];

    let createdStudentCount = 0;
    for (const s of studentData) {
      const exists = await AttendanceUser.findOne({ email: s.email });
      if (!exists) {
        await AttendanceUser.create({
          ...s,
          password: "Student@123",
          phone: "9000000000",
          role: "student",
          isActive: true,
        });
        createdStudentCount++;
      }
    }
    console.log(`Created ${createdStudentCount} new students (total ${studentData.length} available)`);

    // ==================== SEED CLASSES ====================
    const { Class } = await import("../models/class.model.js");
    const faculty1 = await AttendanceUser.findOne({ email: "priya.sharma@attendance.edu" });
    const faculty2 = await AttendanceUser.findOne({ email: "rajesh.kumar@attendance.edu" });
    const faculty3 = await AttendanceUser.findOne({ email: "anita.desai@attendance.edu" });

    const csStudents = await AttendanceUser.find({ role: "student", department: csDept._id }).select("_id");
    const eceStudents = await AttendanceUser.find({ role: "student", department: eceDept._id }).select("_id");

    const classes = [
      {
        name: "Data Structures & Algorithms",
        subjectCode: "CS301",
        subjectName: "Data Structures and Algorithms",
        faculty: faculty1?._id,
        department: csDept._id,
        students: csStudents.map((s) => s._id),
        academicYear: "2025-2026",
        semester: 3,
        credits: 4,
        schedule: [
          { day: "Monday", startTime: "09:00", endTime: "10:00", room: "CS-101" },
          { day: "Wednesday", startTime: "09:00", endTime: "10:00", room: "CS-101" },
          { day: "Friday", startTime: "09:00", endTime: "10:00", room: "CS-101" },
        ],
      },
      {
        name: "Database Management Systems",
        subjectCode: "CS302",
        subjectName: "Database Management Systems",
        faculty: faculty2?._id,
        department: csDept._id,
        students: csStudents.map((s) => s._id),
        academicYear: "2025-2026",
        semester: 3,
        credits: 3,
        schedule: [
          { day: "Tuesday", startTime: "10:00", endTime: "11:00", room: "CS-102" },
          { day: "Thursday", startTime: "10:00", endTime: "11:00", room: "CS-102" },
        ],
      },
      {
        name: "Digital Signal Processing",
        subjectCode: "ECE301",
        subjectName: "Digital Signal Processing",
        faculty: faculty3?._id,
        department: eceDept._id,
        students: eceStudents.map((s) => s._id),
        academicYear: "2025-2026",
        semester: 3,
        credits: 4,
        schedule: [
          { day: "Monday", startTime: "11:00", endTime: "12:00", room: "ECE-201" },
          { day: "Wednesday", startTime: "11:00", endTime: "12:00", room: "ECE-201" },
        ],
      },
    ];

    let createdClassesCount = 0;
    for (const c of classes) {
      const existing = await Class.findOne({ subjectCode: c.subjectCode });
      if (!existing) {
        await Class.create(c);
        createdClassesCount++;
      } else {
        if (!existing.faculty && c.faculty) existing.faculty = c.faculty;
        if (!existing.students || existing.students.length === 0) existing.students = c.students;
        await existing.save();
      }
    }
    console.log(`Created ${createdClassesCount} new classes (total ${classes.length} verified)`);

    // ==================== SUMMARY ====================
    const allDepartments = await Department.find({ isActive: true }).select("name code");
    const allFaculty = await AttendanceUser.find({ role: "faculty" }).select("name email employeeId");
    const allStudents = await AttendanceUser.find({ role: "student" }).select("name email enrollmentNumber");

    console.log("\n==================== SEEDED DATA ====================");
    console.log("\nDepartments:");
    allDepartments.forEach((d) => console.log(`  ${d.code} - ${d.name}`));
    console.log("\nFaculty:");
    allFaculty.forEach((f) => console.log(`  ${f.employeeId || "FAC-DEMO"} - ${f.name} (${f.email})`));
    console.log("\nStudents:");
    allStudents.forEach((s) => console.log(`  ${s.enrollmentNumber || "STU-DEMO"} - ${s.name} (${s.email})`));
    console.log("\n==================== CREDENTIALS ====================");
    console.log("Admin:   admin@attendance.edu / Admin@123456");
    console.log("Faculty: <any-faculty-email> / Faculty@123");
    console.log("Student: <any-student-email> / Student@123");
    console.log("=====================================================");

    console.log("\n✅ Seeding completed successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
