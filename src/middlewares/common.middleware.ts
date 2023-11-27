import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";
import mongoose from "mongoose";

import { ApiError } from "../errors/api.error";
import { IQuery } from "../types";

class CommonMiddleware {
  public isIdValid(param: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params[param];

        if (!mongoose.isObjectIdOrHexString(id)) {
          throw new ApiError("Not valid ID", 400);
        }

        next();
      } catch (e) {
        next(e);
      }
    };
  }

  public isBodyValid(validator: ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { value, error } = validator.validate(req.body);

        if (error) {
          throw new ApiError(error.message, 400);
        }

        req.body = value;
        next();
      } catch (e) {
        next(e);
      }
    };
  }

  public isQueryValid(limit: number, sortedBy: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.query as IQuery;

        if (!query.limit) query.limit = limit;
        if (!query.page) query.page = 1;
        if (!query.sortedBy) query.sortedBy = sortedBy;

        next();
      } catch (e) {
        next(e);
      }
    };
  }
}

export const commonMiddleware = new CommonMiddleware();
