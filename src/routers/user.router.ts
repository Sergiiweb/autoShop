import { Router } from "express";

import { userController } from "../controllers/user.controller";
import { EUserRoles } from "../enums";
import {
  authMiddleware,
  commonMiddleware,
  fileMiddleware,
  userMiddleware,
} from "../middlewares";
import { UserValidator } from "../validators";

const router = Router();

router.get(
  "/",
  authMiddleware.checkRole([EUserRoles.Administrator, EUserRoles.Manager]),
  commonMiddleware.isQueryValid(5, "createdAt"),
  userController.getAll,
);

router.get("/me", authMiddleware.checkAccessToken, userController.getMe);

router.get(
  "/:userId",
  authMiddleware.checkRole([EUserRoles.Administrator, EUserRoles.Manager]),
  authMiddleware.checkAccessToken,
  commonMiddleware.isIdValid("userId"),
  userMiddleware.getByIdOrThrow,
  userController.getById,
);
router.put(
  "/:userId",
  authMiddleware.checkAccessToken,
  commonMiddleware.isIdValid("userId"),
  commonMiddleware.isBodyValid(UserValidator.update),
  userController.updateUser,
);
router.delete(
  "/:userId",
  authMiddleware.checkRole([EUserRoles.Administrator, EUserRoles.Manager]),
  authMiddleware.checkAccessToken,
  commonMiddleware.isIdValid("userId"),
  userController.deleteUser,
);
router.post(
  "/:userId/avatar",
  authMiddleware.checkAccessToken,
  fileMiddleware.isAvatarValid,
  userController.uploadAvatar,
);

export const userRouter = router;
