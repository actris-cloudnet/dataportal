export interface RequestError {
  status: number
  errors: Array<string> | string
  params?: any
}

export interface RequestErrorArray extends RequestError {
  errors: Array<string>
}
