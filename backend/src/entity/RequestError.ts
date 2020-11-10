export interface RequestError {
  status: number
  errors: Array<string> | string
  params?: any
  plaintext?: boolean
}

export interface RequestErrorArray extends RequestError {
  errors: Array<string>
}
