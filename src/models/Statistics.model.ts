import { model, Schema, Types } from "mongoose";

import { IStatistics } from "../types";
import { Car } from "./Car.model";

const statisticsSchema = new Schema(
  {
    views: {
      type: Number,
      default: 0,
    },
    views_per_day: {
      type: Number,
      default: 0,
    },
    views_per_week: {
      type: Number,
      default: 0,
    },
    views_per_month: {
      type: Number,
      default: 0,
    },
    avg_region_price: {
      type: Number,
      default: 0,
    },
    avg_price: {
      type: Number,
      default: 0,
    },
    _carId: {
      type: Types.ObjectId,
      required: true,
      ref: Car,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Statistics = model<IStatistics>("statistics", statisticsSchema);
