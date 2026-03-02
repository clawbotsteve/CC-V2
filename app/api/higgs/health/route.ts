import { NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://platform.higgsfield.ai";

export async function GET() {
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const baseUrl = (process.env.HIGGSFIELD_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        service: "higgs",
        status: "missing_key",
        message: "HIGGSFIELD_API_KEY is not set",
      },
      { status: 500 }
    );
  }

  const url = `${baseUrl}/v1/text2image/soul-styles`;
  const authHeaderVariants: HeadersInit[] = [
    { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    { "x-api-key": apiKey, Accept: "application/json" },
    { Authorization: apiKey, Accept: "application/json" },
  ];

  let lastStatus = 0;
  let lastBody: any = null;

  for (const headers of authHeaderVariants) {
    try {
      const res = await fetch(url, { headers, method: "GET" });
      const body = await res.json().catch(() => ({}));
      lastStatus = res.status;
      lastBody = body;

      if (res.ok) {
        return NextResponse.json({
          ok: true,
          service: "higgs",
          status: "ok",
          authMode:
            "Authorization" in headers && String(headers.Authorization).startsWith("Bearer ")
              ? "bearer"
              : "x-api-key" in headers
                ? "x-api-key"
                : "raw-authorization",
          baseUrl,
        });
      }
    } catch (error: any) {
      lastBody = { error: String(error?.message || error) };
    }
  }

  const mappedStatus =
    lastStatus === 401
      ? "invalid_credentials"
      : lastStatus === 403
        ? "forbidden"
        : lastStatus === 404
          ? "endpoint_not_found"
          : "request_failed";

  return NextResponse.json(
    {
      ok: false,
      service: "higgs",
      status: mappedStatus,
      httpStatus: lastStatus || 500,
      details: lastBody,
      baseUrl,
    },
    { status: lastStatus || 500 }
  );
}
