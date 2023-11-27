import { model, Schema, Types } from "mongoose";

import { IViews } from "../types";
import { Car } from "./Car.model";

const viewsSchema = new Schema(
  {
    views: [
      {
        timestamp: {
          type: Number,
          required: true,
        },
      },
    ],
    _carId: {
      type: Types.ObjectId,
      required: true,
      ref: Car,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Views = model<IViews>("views", viewsSchema);
