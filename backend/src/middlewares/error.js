export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
}
