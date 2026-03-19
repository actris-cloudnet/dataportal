export interface Person {
  id: number;
  firstname: string;
  surname: string;
  orcid: string | null;
}

const ORCID_RE = /(?:(?:https?:\/\/)?(?:www\.)?orcid\.org\/)?\s*(\d{4})-?(\d{4})-?(\d{4})-?(\d{3})([\dX])\s*$/;

export function normalizeOrcid(input: string): string | null {
  const match = input.match(ORCID_RE);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}-${match[4]}${match[5]}`;
}
