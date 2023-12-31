import { Router } from "express";

import { carController } from "../controllers/car.controller";
import { EUserAccountType, EUserRoles } from "../enums";
import {
  authMiddleware,
  carMiddleware,
  commonMiddleware,
  fileMiddleware,
} from "../middlewares";
import { CarValidator } from "../validators";

const router = Router();

router.get(
  "/",
  commonMiddleware.isQueryValid(5, "createdAt"),
  carController.getAll,
);

router.post(
  "/",
  authMiddleware.checkAccessToken,
  commonMiddleware.isBodyValid(CarValidator.create),
  carController.createCar,
);

router.get(
  "/car-cards-moderation",
  authMiddleware.checkAccessToken,
  authMiddleware.checkRole([EUserRoles.Administrator, EUserRoles.Manager]),
  commonMiddleware.isQueryValid(5, "createdAt"),
  carController.getAllInactiveCars,
);

router.get(
  "/:carId",
  commonMiddleware.isIdValid("carId"),
  carMiddleware.getByIdOrThrow,
  carController.getById,
);

router.put(
  "/:carId",
  authMiddleware.checkAccessToken,
  commonMiddleware.isIdValid("carId"),
  commonMiddleware.isBodyValid(CarValidator.update),
  carController.updateCar,
);

router.delete(
  "/:carId",
  authMiddleware.checkAccessToken,
  commonMiddleware.isIdValid("carId"),
  carController.deleteCar,
);

router.post(
  "/:carId/photo",
  authMiddleware.checkAccessToken,
  fileMiddleware.isPhotoValid,
  carController.uploadPhoto,
);

router.get(
  "/:carId/statistics",
  commonMiddleware.isIdValid("carId"),
  authMiddleware.checkAccessToken,
  authMiddleware.checkAccountType(EUserAccountType.Premium),
  carController.getStatistics,
);

export const carRouter = router;
