export interface ContactPerson {
  firstName: string;
  lastName: string;
  orcid: string | null;
}

export interface Contact {
  id: number;
  person: ContactPerson;
  startDate: string | null;
  endDate: string | null;
}
