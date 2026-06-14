import { HttpStatusCode } from '@/constants/httpStatus';

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errors?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    errors?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
