import app from "./api/index";

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Digital Menu server is running on http://localhost:${PORT}`);
});
