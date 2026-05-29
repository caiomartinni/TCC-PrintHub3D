import { Response } from 'express';

export const successResponse = (res: Response, data: unknown, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (res: Response, message: string, statusCode = 400, errors?: unknown) => {
  return res.status(statusCode).json({ success: false, message, errors: errors || null });
};

export const paginatedResponse = (
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};
