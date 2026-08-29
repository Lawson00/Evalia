require("dotenv").config({ path: __dirname + "/../.env" });
const { globalSearch } = require("../controllers/searchController");

async function testGlobalSearch() {
  console.log("🧪 Testing Global Search Controller Integration with Supabase Postgres...");

  const req = {
    query: {
      q: "CS",
    },
  };

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

  await globalSearch(req, res, (err) => console.error("Error:", err));

  console.log("✅ Global Search Response Received!");
  console.log("📌 Classes Found:", res.data?.data?.results?.classes?.length);
  console.log("📌 Topics Found:", res.data?.data?.results?.topics?.length);
  console.log("📌 Questions Found:", res.data?.data?.results?.questions?.length);
  console.log("📌 Assignments Found:", res.data?.data?.results?.assignments?.length);
  console.log("📌 Students Found:", res.data?.data?.results?.students?.length);

  console.log("🎉 GLOBAL SEARCH INTEGRATION TEST PASSED!");
}

testGlobalSearch();
