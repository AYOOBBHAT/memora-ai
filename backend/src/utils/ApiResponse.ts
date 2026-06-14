import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '@/constants/httpStatus';

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: HttpStatusCode = HTTP_STATUS.OK,
  ): Response {
    return res.status(statusCode).json(new ApiResponse(true, message, data));
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, message, data, HTTP_STATUS.CREATED);
  }
}
