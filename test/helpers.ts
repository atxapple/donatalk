/**
 * Creates a Request object with JSON body for testing API route POST handlers.
 */
export function createJsonRequest(body: object): Request {
  return new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
