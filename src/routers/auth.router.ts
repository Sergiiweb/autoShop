import { Router } from "express";

import { authController } from "../controllers/auth.controller";
import { EUserRoles } from "../enums";
import {
  authMiddleware,
  commonMiddleware,
  userMiddleware,
} from "../middlewares";
import { IUser } from "../types";
import { UserValidator } from "../validators";

const router = Router();

router.post(
  "/register",
  commonMiddleware.isBodyValid(UserValidator.register),
  userMiddleware.isEmailUniq,
  authController.register,
);
router.post(
  "/login",
  commonMiddleware.isBodyValid(UserValidator.login),
  authController.login,
);
router.post(
  "/refresh",
  authMiddleware.checkRefreshToken,
  authController.refresh,
);

router.post("/logout", authMiddleware.checkAccessToken, authController.logout);
router.post(
  "/logout-all",
  authMiddleware.checkAccessToken,
  authController.logoutAll,
);

router.post(
  "/activate",
  authMiddleware.checkAccessToken,
  authController.sendActivationToken,
);
router.put("/activate", authController.activate);

router.post(
  "/forgot",
  commonMiddleware.isBodyValid(UserValidator.forgotPassword),
  userMiddleware.isUserExist<IUser>("email"),
  authController.forgotPassword,
);
router.put(
  "/forgot/:token",
  commonMiddleware.isBodyValid(UserValidator.setForgotPassword),
  authController.setForgotPassword,
);
router.post(
  "/password",
  authMiddleware.checkAccessToken,
  commonMiddleware.isBodyValid(UserValidator.setNewPassword),
  authController.setNewPassword,
);

router.post(
  "/administrator",
  commonMiddleware.isBodyValid(UserValidator.register),
  userMiddleware.isEmailUniq,
  authController.administrator,
);

router.patch(
  "/administrator/set-manager/:userId",
  authMiddleware.checkRole([EUserRoles.Administrator]),
  authController.setManager,
);

router.patch(
  "/buy-premium-account/:userId",
  authMiddleware.checkRole([EUserRoles.Administrator, EUserRoles.Manager]),
  authController.buyPremiumAccount,
);

export const authRouter = router;
