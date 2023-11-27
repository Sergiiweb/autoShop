import { Document } from "mongoose";

import { ECarBrand, ECarCardRegion, ECarCardStatus, ECurrency } from "../enums";

export interface ICar extends Document {
  brand?: ECarBrand;
  model?: string;
  description?: string;
  region?: ECarCardRegion;
  year?: number;
  price?: number;
  currency?: ECurrency;
  priceUAH?: number;
  priceEUR?: number;
  priceUSD?: number;
  status?: ECarCardStatus;
  photo?: string;
  _userId?: string;
}
