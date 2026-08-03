export class MeroShareError extends Error {
  statusCode: number
  responseBody: string | undefined

  constructor(message: string, statusCode: number, responseBody?: string) {
    super(message)
    this.name = 'MeroShareError'
    this.statusCode = statusCode
    this.responseBody = responseBody
  }
}
