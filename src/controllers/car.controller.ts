import { NextFunction, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";

import { carPresenter } from "../presenters/car.presenter";
import { carService } from "../services/car.service";
import { ICar, IQuery, IStatistics, ITokenPayload } from "../types";

class CarController {
  public async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<ICar[]>> {
    try {
      const cars = await carService.getAllWithPagination(req.query as IQuery);

      return res.json(cars);
    } catch (e) {
      next(e);
    }
  }

  public async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const car = req.res.locals as ICar;

      await carService.addView(car._id);

      const response = carPresenter.present(car);

      res.json(response);
    } catch (e) {
      next(e);
    }
  }

  public async createCar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, accountType } = req.res.locals
        .tokenPayload as ITokenPayload;

      const car = await carService.createCar(req.body, userId, accountType);

      res.status(201).json(car);
    } catch (e) {
      next(e);
    }
  }
  public async updateCar(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.res.locals.tokenPayload as ITokenPayload;

      const car = await carService.updateCar(
        req.params.carId,
        req.body,
        userId,
        role,
      );

      res.status(201).json(car);
    } catch (e) {
      next(e);
    }
  }

  public async deleteCar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, role } = req.res.locals.tokenPayload as ITokenPayload;

      await carService.deleteCar(req.params.carId, userId, role);

      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  }

  public async uploadPhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<ICar>> {
    try {
      const { carId } = req.params;
      const photo = req.files.photo as UploadedFile;

      const car = await carService.uploadPhoto(photo, carId);

      const response = carPresenter.present(car);

      return res.json(response);
    } catch (e) {
      next(e);
    }
  }

  public async getAllInactiveCars(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<ICar[]>> {
    try {
      const cars = await carService.getAllInactiveCarsWithPagination(
        req.query as IQuery,
      );

      return res.json(cars);
    } catch (e) {
      next(e);
    }
  }

  public async getStatistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<IStatistics>> {
    try {
      const statistics = await carService.getStatistics(req.params.carId);

      return res.json(statistics);
    } catch (e) {
      next(e);
    }
  }
}

export const carController = new CarController();
