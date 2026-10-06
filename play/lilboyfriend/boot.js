// Report module and renderer failures instead of leaving a permanent loading screen.
const loading = document.getElementById("loading");
const error = document.getElementById("error");
try {
  await import("./main.js?objects=12");
} catch (failure) {
  if (loading) loading.hidden = true;
  error.hidden = false;
  error.textContent = `The museum could not start: ${failure.message}. Reload to try again.`;
  console.error("Museum startup failed", failure);
}
