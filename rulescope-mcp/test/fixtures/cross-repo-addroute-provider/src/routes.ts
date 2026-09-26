// Minimal router using addRoute() style — no Express dependency
type Handler = (req: unknown) => Promise<unknown>;
const routes: Array<{ method: string; path: string; handler: Handler }> = [];

function addRoute(method: string, path: string, handler: Handler) {
  routes.push({ method, path, handler });
}

// POST /api/transfers
addRoute("POST", "/api/transfers", async (_req) => {
  return { status: "COMPLETED" };
});

// GET /api/accounts/:id
addRoute("GET", "/api/accounts/:id", async (_req) => {
  return { id: "acc1" };
});

export { routes };
