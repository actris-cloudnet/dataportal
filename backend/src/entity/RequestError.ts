export interface RequestError {
  status: number;
  errors: string[] | string;
  params?: any;
  plaintext?: boolean;
}

export interface RequestErrorArray extends RequestError {
  errors: string[];
}
