import { Router } from "express";
import * as p from "../controllers/store/product.controller.js";
import * as newsletter from "../controllers/customer/newsletter.controller.js";
const r = Router();
r.get("/products", p.index);
r.get("/products/:slug", p.show);
r.get("/categories", p.categories);

// Public newsletter subscription.
r.post("/newsletter/subscribe", newsletter.subscribe);
export default r;
