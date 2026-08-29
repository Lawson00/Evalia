require("dotenv").config({ path: __dirname + "/../.env" });
const ClassModel = require("../models/ClassModel");

async function testStudentReport() {
  console.log("🧪 Testing Student Assessment Report Endpoint & Model Integration...");

  try {
    const classId = "7fd46042-b33f-4fce-82e7-8c5c93e89067"; // CS 101
    const classData = await ClassModel.findById(classId);

    if (!classData || !classData.students || classData.students.length === 0) {
      throw new Error("No students found in CS 101!");
    }

    const targetStudent = classData.students[0];
    console.log(`📌 Target Student: ${targetStudent.studentName} (${targetStudent.studentId})`);

    const report = await ClassModel.getStudentReport(classId, targetStudent.studentId);
    if (!report) throw new Error("Failed to fetch student report!");

    console.log("✅ Student Report Fetched Successfully!");
    console.log(`Name: ${report.studentName} | Index: ${report.indexNumber} | Class: ${report.className}`);
    console.log(`Score: ${report.earnedPoints} / ${report.totalClassPoints} pts | Completed Tests: ${report.totalAssignmentsCompleted} | Flags: ${report.proctoringFlagsCount}`);
    console.log(`Assignment History Count: ${report.assignmentHistory?.length}`);
    console.log(`Proctoring Logs Count: ${report.proctoringLogs?.length}`);
    console.log(`Saved Lecturer Notes:`, report.savedNotes);

    console.log("🎉 STUDENT ASSESSMENT REPORT INTEGRATION TEST PASSED!");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testStudentReport();
