import { describe, it, expect } from "vitest";
import { en } from "./en";
import { ja } from "./ja";
import { interpolate } from "./index";

describe("dictionaries", () => {
  it("ja has exactly the same keys as en", () => {
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
  });

  it("no dictionary value is empty", () => {
    for (const [k, v] of Object.entries({ ...en, ...ja })) {
      expect(v, k).not.toBe("");
    }
  });

  it("every {placeholder} in en also appears in ja", () => {
    const placeholders = (s: string) =>
      [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(ja[key]), key).toEqual(placeholders(en[key]));
    }
  });
});

describe("interpolate", () => {
  it("substitutes named params", () => {
    expect(interpolate("trial {n}", { n: 3 })).toBe("trial 3");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("{a} {b}", { a: 1 })).toBe("1 {b}");
  });

  it("returns the template unchanged when no params given", () => {
    expect(interpolate("hello")).toBe("hello");
  });
});
