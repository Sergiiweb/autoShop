import { Document } from "mongoose";

export interface IExchangeRates extends Document {
  EUR: number;
  USD: number;
}
