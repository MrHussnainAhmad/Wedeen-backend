export function badRequest(message, details = null) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  return error;
}

export function unauthorized(message = 'Unauthorized') {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

export function notFound(message = 'Not Found') {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}
