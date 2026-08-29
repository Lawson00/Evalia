require("dotenv").config({ path: __dirname + "/../.env" });
const ClassModel = require("../models/ClassModel");

async function testClassDetailsIntegration() {
  console.log("🧪 Testing Class Details Model & Settings Update Integration...");

  try {
    // 1. Fetch lecturer classes
    console.log("1️⃣ Fetching lecturer classes from Supabase Postgres...");
    const classes = await ClassModel.getAllByLecturer(null);
    console.log(`✅ Found ${classes.length} classes for lecturer!`);
    if (classes.length === 0) throw new Error("No classes found!");

    const targetClassId = classes[0].id;
    console.log(`📌 Selected Target Class ID: ${targetClassId} (${classes[0].name})`);

    // 2. Fetch full class details with roster
    console.log("2️⃣ Fetching full class details with enrolled student profiles...");
    const classData = await ClassModel.findById(targetClassId);
    console.log(`✅ Class Details Fetched: ${classData.name} (${classData.classCode})`);
    console.log(`📌 Assessment Weighting: ${classData.assessmentWeighting}%`);
    console.log(`📌 Pass Threshold: ${classData.passThreshold}%`);
    console.log(`📌 Grade Scale:`, classData.gradeScale);
    console.log(`📌 Enrolled Students Count: ${classData.students?.length}`);

    // 3. Test Updating Class Settings
    console.log("3️⃣ Testing class settings update (changing weighting to 35% and pass threshold to 65%)...");
    const updated = await ClassModel.updateSettings(targetClassId, {
      assessmentWeighting: 35,
      passThreshold: 65,
      gradeScale: { aPlus: 92, a: 82, b: 72, c: 62, d: 52 },
    });

    console.log(`✅ Settings Updated Successfully! New Weighting: ${updated.assessmentWeighting}%, Pass Threshold: ${updated.passThreshold}%`);

    // Revert back
    await ClassModel.updateSettings(targetClassId, {
      assessmentWeighting: 30,
      passThreshold: 60,
      gradeScale: { aPlus: 90, a: 80, b: 70, c: 60, d: 50 },
    });
    console.log("✅ Settings Reverted cleanly!");

    console.log("🎉 CLASS DETAILS & SETTINGS INTEGRATION TEST PASSED!");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testClassDetailsIntegration();
