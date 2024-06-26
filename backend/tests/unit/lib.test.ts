import { isValidDate, truncateList } from "../../src/lib";
import { describe, it, expect } from "@jest/globals";

describe("isValidDate", () => {
  it("accepts valid date", () => {
    expect(isValidDate("2023-01-26")).toBe(true);
  });

  it("rejects non-existing dates", () => {
    expect(isValidDate("2023-01-40")).toBe(false);
    expect(isValidDate("2023-13-01")).toBe(false);
  });

  it("accepts valid datetimes", () => {
    expect(isValidDate("2023-01-26T12:00:00")).toBe(true);
    expect(isValidDate("2023-01-26T12:00:00.000")).toBe(true);
  });

  it("accepts only UTC datetimes", () => {
    expect(isValidDate("2023-01-26T12:00:00.000Z")).toBe(true);
    expect(isValidDate("2023-01-26T12:00:00.000+00:00")).toBe(true);
  });

  it("rejects non-existing datetimes", () => {
    expect(isValidDate("2023-01-40")).toBe(false);
    expect(isValidDate("2023-13-01")).toBe(false);
    expect(isValidDate("2023-01-26T25:00:00")).toBe(false);
    expect(isValidDate("2023-01-26T12:61:00")).toBe(false);
    expect(isValidDate("2023-01-26T12:00:60")).toBe(false);
    expect(isValidDate("2023-01-26T12:00:00.000-00:00")).toBe(false);
  });

  it("rejects truncated inputs", () => {
    expect(isValidDate("2023")).toBe(false);
    expect(isValidDate("2023-")).toBe(false);
    expect(isValidDate("2023-1")).toBe(false);
    expect(isValidDate("2023-01")).toBe(false);
    expect(isValidDate("2023-01-")).toBe(false);
    expect(isValidDate("2023-01-1T")).toBe(false);
    expect(isValidDate("2023-01-01T")).toBe(false);
    expect(isValidDate("2023-01-01T12")).toBe(false);
    expect(isValidDate("2023-01-01T12:")).toBe(false);
    expect(isValidDate("2023-01-01T12:1")).toBe(false);
    expect(isValidDate("2023-01-01T12:12")).toBe(false);
    expect(isValidDate("2023-01-01T12:12:")).toBe(false);
    expect(isValidDate("2023-01-01T12:12:1")).toBe(false);
    expect(isValidDate("2023-01-01T12:12:12.")).toBe(false);
    expect(isValidDate("2023-01-01T12:12:12.0+")).toBe(false);
    expect(isValidDate("2023-01-01T12:12:12.0+00")).toBe(false);
    expect(isValidDate("2023-01-01T12:12:12.0+00:")).toBe(false);
  });

  it("rejects inputs without correct separator", () => {
    expect(isValidDate("20230126T120000")).toBe(false);
    expect(isValidDate("2023-01-26 12:00:00")).toBe(false);
  });

  it("rejects non-UTC inputs", () => {
    expect(isValidDate("2023-01-26 12:00:00+01:00")).toBe(false);
  });

  it("accepts valid date object", () => {
    expect(isValidDate(new Date(2023, 0, 26, 12, 0, 0))).toBe(true);
  });

  it("rejects invalid date object", () => {
    expect(isValidDate("asdf")).toBe(false);
  });

  it("rejects unexpected inputs", () => {
    expect(isValidDate(100)).toBe(false);
    expect(isValidDate(false)).toBe(false);
    expect(isValidDate({ asdf: "asdf" })).toBe(false);
  });
});

describe("truncateList", () => {
  it("truncates list", () => {
    const elements = ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"];
    expect(truncateList(elements, 1, "elements")).toEqual(["Hydrogen", "4 other elements"]);
    expect(truncateList(elements, 2, "elements")).toEqual(["Hydrogen", "Helium", "3 other elements"]);
    expect(truncateList(elements, 3, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "2 other elements"]);
    expect(truncateList(elements, 4, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"]);
    expect(truncateList(elements, 5, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"]);
    expect(truncateList(elements, 6, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"]);
    expect(truncateList(elements, 7, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"]);
    expect(truncateList(elements, 8, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"]);
    expect(truncateList(elements, 9, "elements")).toEqual(["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron"]);
  });
});
