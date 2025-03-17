import { APIError } from "@/lib/types";
import { NextRequest } from "next/server";

export type RequestHandler<T> = (
  request: NextRequest
) => Promise<{ status: number; json: APIError | T }>;

export const generateAPIRoute = <T>(handler: RequestHandler<T>) => {
  return async (request: NextRequest) => {
    const { status, json } = await handler(request);
    return Response.json(json, { status });
  };
};
