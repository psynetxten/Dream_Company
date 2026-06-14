import { describe, it, expect } from "vitest";
import { roleToHome, setRoleCookie } from "../auth";

describe("roleToHome", () => {
  it("writer → /writer/dashboard", () => {
    expect(roleToHome("writer")).toBe("/writer/dashboard");
  });

  it("sponsor → /sponsor/dashboard", () => {
    expect(roleToHome("sponsor")).toBe("/sponsor/dashboard");
  });

  it("user → /", () => {
    expect(roleToHome("user")).toBe("/");
  });

  it("admin → /", () => {
    expect(roleToHome("admin")).toBe("/");
  });

  it("unknown role → /", () => {
    expect(roleToHome("unknown")).toBe("/");
  });
});

describe("setRoleCookie", () => {
  it("document.cookie에 역할 설정", () => {
    setRoleCookie("user");
    expect(document.cookie).toContain("dream_role=user");
  });

  it("writer 역할 쿠키 설정", () => {
    setRoleCookie("writer");
    expect(document.cookie).toContain("dream_role=writer");
  });
});
