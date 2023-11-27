/**
 * @description Tests for authentication
 */

// import supertest = require("supertest");
import supertest from "supertest";
import app from "../app";

describe("Auth - Service", () => {
  describe("Signup (Email/Password)", () => {
    test("should return error for validation", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: "example@gmail1", // invalid email
        password: "pass123", // non matching password requirements
        domainName: "ExampleName",
        fullName: "ExampleName",
      });
      expect(response.statusCode).toBe(400);
      expect(Reflect.get(response.body, "success")).toBe(false);
      expect(Reflect.get(response.body, "message")).toContain(
        "Validation error"
      );
    });

    test("should require all fields", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: "example1@gmail.com",
        password: "Ex@mple123",
      });
      expect(response.statusCode).toBe(500);
      expect(Reflect.get(response.body, "success")).toBe(false);
      expect(Reflect.get(response.body, "message")).toContain("Validation error");
    });

    test("should signup user", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: "example1@gmail.com",
        password: "Ex@mple123",
        domainName: "ExampleName",
        fullName: "ExampleName",
      });
      expect(response.statusCode).toBe(201);
      expect(Reflect.get(response.body, "success")).toBe(true);
      expect(Reflect.get(response.body, "data").length).toBeGreaterThan(10);
      expect(Reflect.get(response.body, "message")).toContain(
        "Signup successful"
      );
    });

    test("should prevent double signups", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: "example1@gmail.com",
        password: "Ex@mple123",
        domainName: "ExampleName",
        fullName: "ExampleName",
      });
      expect(response.statusCode).toBe(400);
      expect(Reflect.get(response.body, "success")).toBe(false);
      expect(Reflect.get(response.body, "message")).toContain("Existing user");
    });
  });
  describe("Signin (Email/Password)", () => {
    describe("Invalid credentials", () => {
      test("should return error", async () => {
        const response = await supertest(app).post("/api/auth/signin").send({
          email: "example@gmail1.com",
          password: "pass123",
        });
        expect(response.statusCode).toBe(401);
        expect(Reflect.get(response.body, "success")).toBe(false);
        expect(Reflect.get(response.body, "message")).toContain(
          "Invalid credentials"
        );
      });
    });

    describe("Valid credentials", () => {
      test("should return token", async () => {
        const response = await supertest(app).post("/api/auth/signin").send({
          email: "example1@gmail.com",
          password: "Ex@mple123",
        });
        expect(Reflect.get(response.body, "success")).toBe(true);
        expect(Reflect.get(response.body, "message")).toContain("Access Token");
        expect(Reflect.get(response.body, "data").length).toBeGreaterThan(10);
      });
    });
  });

  describe("Signin (Google)", () => {
    test("should get a google signin link", async () => {
      const response = await supertest(app)
        .get("/api/auth/sign-google-link")
        .send();
      expect(response.statusCode).toBe(200);
      expect(Reflect.get(response.body, "success")).toBe(true);
      expect(Reflect.get(response.body, "message")).toContain("Authorized url");
    });
  });
});
