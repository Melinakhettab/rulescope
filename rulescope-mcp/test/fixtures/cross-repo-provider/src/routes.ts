import express from "express";
const router = express.Router();

router.get("/api/shipping", (req, res) => {
  res.json({ threshold: 50, flatRate: 5.99 });
});

router.post("/api/shipping/calculate", (req, res) => {
  const { total } = req.body as { total: number };
  res.json({ fee: total >= 50 ? 0 : 5.99 });
});

export default router;
