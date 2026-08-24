const fs = require("fs");
const path = require("path");

const adminRoot = path.resolve(__dirname, "../../MONDAY_admin");
console.log("Admin root path:", adminRoot);

if (fs.existsSync(adminRoot)) {
  // 1. Update App.tsx in MONDAY_admin
  const appPath = path.join(adminRoot, "src", "App.tsx");
  if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, "utf8");
    appContent = appContent.replace(
      /setResults\(resultsData as ExamResult\[\]\);/g,
      `const mapped = (resultsData || []).map((r: any) => ({
          ...r,
          group_code: r.group_code || r.answers?._meta?.group_code || "",
        }));
        setResults(mapped as ExamResult[]);`
    );
    fs.writeFileSync(appPath, appContent, "utf8");
    console.log("✅ Updated MONDAY_admin/src/App.tsx");
  }

  // 2. Update ResultsView.tsx in MONDAY_admin
  const resultsViewPath = path.join(adminRoot, "src", "components", "ResultsView.tsx");
  if (fs.existsSync(resultsViewPath)) {
    let rvContent = fs.readFileSync(resultsViewPath, "utf8");
    rvContent = rvContent.replace(
      /groupMatches = \(r\.group_code \|\| ""\)\.toUpperCase\(\) === filterGroup\.toUpperCase\(\);/g,
      `const rGroup = (r.group_code || r.answers?._meta?.group_code || "").toString().toUpperCase();
      groupMatches = rGroup === filterGroup.toUpperCase();`
    );
    rvContent = rvContent.replace(
      /\{r\.group_code \|\| "Umumiy"\}/g,
      `{r.group_code || r.answers?._meta?.group_code || "Umumiy"}`
    );
    fs.writeFileSync(resultsViewPath, rvContent, "utf8");
    console.log("✅ Updated MONDAY_admin/src/components/ResultsView.tsx");
  }

  // 3. Update DashboardView.tsx in MONDAY_admin if needed
  const dashPath = path.join(adminRoot, "src", "components", "DashboardView.tsx");
  if (fs.existsSync(dashPath)) {
    let dashContent = fs.readFileSync(dashPath, "utf8");
    dashContent = dashContent.replace(
      /\{r\.group_code \|\| "Umumiy"\}/g,
      `{r.group_code || r.answers?._meta?.group_code || "Umumiy"}`
    );
    fs.writeFileSync(dashPath, dashContent, "utf8");
    console.log("✅ Updated MONDAY_admin/src/components/DashboardView.tsx");
  }
} else {
  console.log("Admin root not found at", adminRoot);
}
