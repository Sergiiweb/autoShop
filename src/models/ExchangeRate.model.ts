import { model, Schema } from "mongoose";

import { IExchangeRates } from "../types";

const ratesSchema = new Schema(
  {
    EUR: {
      type: Number,
      required: true,
    },
    USD: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const ExchangeRates = model<IExchangeRates>("rates", ratesSchema);
