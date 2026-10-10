// Single place to turn a caught error into text a user can read. Every screen
// that calls the REST API should use this instead of writing its own
// `error?.response?.data?.message || fallback` (which had drifted into a few
// slightly different copies) or, worse, showing nothing and only
// console.error-ing.
export function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}
