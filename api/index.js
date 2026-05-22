export default async function handler(req, res) {
  const { app } = await import("../artifacts/api-server/dist/index.mjs");
  return app(req, res);
}
