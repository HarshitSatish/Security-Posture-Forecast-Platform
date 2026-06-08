const request = require("supertest");
const app = require("./server");

describe("SAST Scanner API", () => {
  test("GET /health returns running status", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe("sast-scanner");
    expect(res.body.status).toBe("running");
  });

  test("POST /scan/code detects API key and localStorage", async () => {
    const res = await request(app)
      .post("/scan/code")
      .send({
        code: 'const api_key="123"; localStorage.setItem("token","abc");'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.scan_type).toBe("SAST");
    expect(res.body.high).toBe(1);
    expect(res.body.medium).toBe(1);
  });
});