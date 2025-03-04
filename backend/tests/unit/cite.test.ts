import { removeDuplicateNames, Person } from "../../src/lib/cite";
import { describe, it, expect } from "@jest/globals";

describe("removeDuplicateNames", () => {
  it("removes duplicates without orcid", () => {
    const persons: Person[] = [
      { firstName: "Erkki", lastName: "Esimerkki", orcid: null, role: "instrumentPi" },
      { firstName: "Erkki", lastName: "Esimerkki", orcid: null, role: "nfPi" },
    ];
    expect(removeDuplicateNames(persons)).toEqual([persons[0]]);
  });

  it("removes duplicates with one orcid", () => {
    const persons: Person[] = [
      { firstName: "Erkki", lastName: "Esimerkki", orcid: "0000-0000-0000-0000", role: "instrumentPi" },
      { firstName: "Erkki", lastName: "Esimerkki", orcid: null, role: "nfPi" },
    ];
    expect(removeDuplicateNames(persons)).toEqual([persons[0]]);
  });

  it("removes duplicates with same orcid, different name", () => {
    const persons: Person[] = [
      { firstName: "Erkki", lastName: "Esimerkki", orcid: "0000-0000-0000-0000", role: "instrumentPi" },
      { firstName: "Veikko", lastName: "Vanhamerkki", orcid: "0000-0000-0000-0000", role: "nfPi" },
    ];
    expect(removeDuplicateNames(persons)).toEqual([persons[0]]);
  });

  it("removes duplicates with diacritics and no orcid", () => {
    const persons: Person[] = [
      { firstName: "Erkki", lastName: "Esimerkki", orcid: null, role: "instrumentPi" },
      { firstName: "Ërkkì ", lastName: "Ëšìmërkkî", orcid: null, role: "nfPi" },
    ];
    expect(removeDuplicateNames(persons)).toEqual([persons[0]]);
  });
});
