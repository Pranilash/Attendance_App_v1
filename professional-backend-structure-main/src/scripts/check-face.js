import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.db
    .collection("attendanceusers")
    .find({ role: "student" })
    .project({ name: 1, email: 1, faceRegistered: 1, faceEmbedding: 1 })
    .toArray();

  console.log("\n===== Face Registration Status =====\n");
  for (const u of users) {
    const hasEmbedding = Array.isArray(u.faceEmbedding) && u.faceEmbedding.length === 128;
    console.log(
      `${hasEmbedding ? "✅" : "❌"} ${u.name} (${u.email}) — ${hasEmbedding ? "128-dim embedding stored" : "NOT registered"}`
    );
  }

  // Also check faceembeddings collection
  const faceRecords = await mongoose.connection.db
    .collection("faceembeddings")
    .countDocuments();
  console.log(`\nFaceEmbedding records: ${faceRecords}`);

  await mongoose.disconnect();
};
run();
