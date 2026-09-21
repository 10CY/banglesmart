export function appError(message, status = 422) {
  return Object.assign(new Error(message), { status });
}
