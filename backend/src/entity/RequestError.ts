export interface RequestError {
  status: number
  errors: Array<string> | string
}
