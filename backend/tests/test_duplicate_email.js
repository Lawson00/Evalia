require("dotenv").config({ path: __dirname + "/../.env" });
const { registerStudent, registerLecturer } = require("../controllers/authController");

async function testDuplicateEmailPrevention() {
  console.log("🧪 Testing Duplicate Email Cross-Role Prevention...");

  const existingEmail = "lawsonsamson32@gmail.com";

  // Mock Express Response Object
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.data = data;
      return this;
    },
  };

  const reqStudent = {
    body: {
      email: existingEmail,
      password: "Password123!",
      firstName: "Duplicate",
      lastName: "Student",
    },
  };

  await registerStudent(reqStudent, res, (err) => console.error("Error:", err));

  console.log(`📌 Response Status Code: ${res.statusCode}`);
  console.log(`📌 Response Message: ${res.data?.message}`);

  if (res.statusCode === 409 && res.data?.message?.includes("already exists")) {
    console.log("🎉 DUPLICATE EMAIL PREVENTION TEST PASSED!");
  } else {
    console.error("❌ Test Failed: Duplicate email was not rejected!");
  }
}

testDuplicateEmailPrevention();
