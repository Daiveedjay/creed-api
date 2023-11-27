/**
 * @description Tests for authentication
 */

import supertest from "supertest";
import app from "../app";
import { faker } from "@faker-js/faker";

const name = faker.person.fullName();
const email = faker.internet.email();
const fakeData = {
  email, // invalid email
  invalidEmail: email.replace(/\./g, ""), // invalid email
  password: "Ex@mple123", // non matching password requirements
  invalidPassword: "pass123", // non matching password requirements
  domainName: name.replace(/ /g, ""),
  fullName: name,
};

describe("Auth - Service", () => {
  describe("Signup (Email/Password)", () => {
    test("should return error for validation", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: fakeData.invalidEmail, // invalid email
        password: fakeData.invalidPassword, // non matching password requirements
        domainName: fakeData.domainName,
        fullName: fakeData.fullName,
      });
      expect(response.statusCode).toBe(400);
      expect(Reflect.get(response.body, "success")).toBe(false);
      expect(Reflect.get(response.body, "message")).toContain(
        "Validation error"
      );
    });

    test("should require all fields", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: fakeData.email,
        password: fakeData.password,
      });
      expect(response.statusCode).toBe(400);
      expect(Reflect.get(response.body, "success")).toBe(false);
      expect(Reflect.get(response.body, "message")).toContain(
        "Validation error"
      );
    });

    test("should signup user", async () => {
      const response = await supertest(app).post("/api/auth/signup").send({
        email: fakeData.email,
        password: fakeData.password,
        domainName: fakeData.domainName,
        fullName: fakeData.fullName,
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
        email: fakeData.email,
        password: fakeData.password,
        domainName: fakeData.domainName,
        fullName: fakeData.fullName,
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
          email: fakeData.email,
          password: fakeData.invalidPassword,
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
          email: fakeData.email,
          password: fakeData.password,
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
