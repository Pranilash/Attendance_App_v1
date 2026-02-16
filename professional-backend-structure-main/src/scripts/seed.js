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

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Department.deleteMany({});
    // await AttendanceUser.deleteMany({});
    // console.log("Cleared existing data");

    // Check if departments already exist
    const existingDepartments = await Department.countDocuments();
    if (existingDepartments > 0) {
      console.log("Departments already exist. Skipping department seeding.");
    } else {
      // Seed Departments
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

      const createdDepartments = await Department.insertMany(departments);
      console.log(`Created ${createdDepartments.length} departments`);
    }

    // Check if admin already exists
    const existingAdmin = await AttendanceUser.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists. Skipping admin seeding.");
      console.log("Admin email: " + existingAdmin.email);
    } else {
      // Get the first department for admin
      const adminDepartment = await Department.findOne({ code: "CS" });
      
      if (!adminDepartment) {
        console.log("No department found. Please seed departments first.");
        process.exit(1);
      }

      // Seed Admin User
      const adminUser = await AttendanceUser.create({
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
    const existingFaculty = await AttendanceUser.countDocuments({ role: "faculty" });
    if (existingFaculty > 0) {
      console.log(`Faculty already exist (${existingFaculty}). Skipping faculty seeding.`);
    } else {
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

      for (const f of facultyData) {
        await AttendanceUser.create(f);
      }
      console.log(`Created ${facultyData.length} faculty members`);
    }

    // ==================== SEED STUDENTS ====================
    const existingStudents = await AttendanceUser.countDocuments({ role: "student" });
    if (existingStudents > 0) {
      console.log(`Students already exist (${existingStudents}). Skipping student seeding.`);
    } else {
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

      for (const s of studentData) {
        await AttendanceUser.create({
          ...s,
          password: "Student@123",
          phone: "9000000000",
          role: "student",
          isActive: true,
        });
      }
      console.log(`Created ${studentData.length} students`);
    }

    // ==================== SEED CLASSES ====================
    const { Class } = await import("../models/class.model.js");
    const existingClasses = await Class.countDocuments();
    if (existingClasses > 0) {
      console.log(`Classes already exist (${existingClasses}). Skipping class seeding.`);
    } else {
      const faculty1 = await AttendanceUser.findOne({ employeeId: "FAC001" });
      const faculty2 = await AttendanceUser.findOne({ employeeId: "FAC002" });
      const faculty3 = await AttendanceUser.findOne({ employeeId: "FAC003" });

      const csStudents = await AttendanceUser.find({ role: "student", department: csDept._id }).select("_id");
      const eceStudents = await AttendanceUser.find({ role: "student", department: eceDept._id }).select("_id");

      const classes = [
        {
          name: "Data Structures & Algorithms",
          subjectCode: "CS301",
          subjectName: "Data Structures and Algorithms",
          faculty: faculty1._id,
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
          faculty: faculty2._id,
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
          faculty: faculty3._id,
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

      await Class.insertMany(classes);
      console.log(`Created ${classes.length} classes`);
    }

    // ==================== SUMMARY ====================
    const allDepartments = await Department.find({ isActive: true }).select("name code");
    const allFaculty = await AttendanceUser.find({ role: "faculty" }).select("name email employeeId");
    const allStudents = await AttendanceUser.find({ role: "student" }).select("name email enrollmentNumber");

    console.log("\n==================== SEEDED DATA ====================");
    console.log("\nDepartments:");
    allDepartments.forEach((d) => console.log(`  ${d.code} - ${d.name}`));
    console.log("\nFaculty:");
    allFaculty.forEach((f) => console.log(`  ${f.employeeId} - ${f.name} (${f.email})`));
    console.log("\nStudents:");
    allStudents.forEach((s) => console.log(`  ${s.enrollmentNumber} - ${s.name} (${s.email})`));
    console.log("\n==================== CREDENTIALS ====================");
    console.log("Admin:   admin@attendance.edu / Admin@123456");
    console.log("Faculty: <any-faculty-email> / Faculty@123");
    console.log("Student: <any-student-email> / Student@123");
    console.log("=====================================================");

    console.log("\n✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
