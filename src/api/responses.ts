export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string
): Response {
  return jsonResponse(
    {
      error: message,
      code: code ?? "bad_request"
    },
    status
  );
}
