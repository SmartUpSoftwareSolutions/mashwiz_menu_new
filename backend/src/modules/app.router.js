import glopalErrHandling from "../utils/errorHandling.js";
import { AppError } from "../utils/appError.js";
import queryRouter from "./query/query.router.js";
import menuRouter from "./menu/menu.router.js";
import healthRouter from "./health/health.router.js";
import authRouter from "./auth/auth.router.js";
import imageRouter from "./image/image.router.js";
import itemsRouter from "./menu/item.router.js";
import restaurantRouter from "./restaurant/restaurant.router.js";
import locationsRouter from "./locations/locations.router.js";
import socialLinksRouter from "./social-links/social-links.router.js";
import customersRouter from "./customers/customers.router.js";
import tagsRouter from "./tags/tags.router.js";
import themesRouter from "./themes/themes.router.js";
import surveyRouter from "./survey/survey.router.js";
import promotionsRouter from "./promotions/promotions.router.js";
import branchesRouter from "./branches/branches.router.js";
import analyticsRouter from "./analytics/analytics.router.js";

const initApp = (app, express) => {
  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/transfer", menuRouter);
  app.use("/api/query", queryRouter);
  app.use("/api/health", healthRouter);
  app.use("/api/image", imageRouter);
  app.use("/api/items", itemsRouter);

  app.use("/api/restaurant", restaurantRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/social-links", socialLinksRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/tags", tagsRouter);
  app.use("/api/themes", themesRouter);
  app.use("/api/survey", surveyRouter);
  app.use("/api/promotions", promotionsRouter);
  app.use("/api/branches", branchesRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use((req, _res, next) => {
    next(new AppError("Not Found", 404, { method: req.method, url: req.originalUrl }));
  });

  app.use(glopalErrHandling);
};

export default initApp;
