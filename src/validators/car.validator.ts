import joi from "joi";

import { ECarBrand, ECurrency } from "../enums";

export class CarValidator {
  static brand = joi.valid(...Object.values(ECarBrand));
  static model = joi.string().min(1).max(50).trim();
  static description = joi.string().min(20).max(5000).trim();
  static region = joi.string().min(2).max(50).trim();
  static year = joi.number().min(1900).max(2023);
  static price = joi.number().min(1).max(1000000000);
  static currency = joi.valid(...Object.values(ECurrency));

  static create = joi.object({
    brand: this.brand.required(),
    model: this.model.required(),
    description: this.description.required(),
    region: this.region.required(),
    year: this.year.required(),
    price: this.price.required(),
    currency: this.currency.required(),
  });

  static update = joi.object({
    model: this.model,
    year: this.year,
    price: this.price,
    description: this.description,
  });
}
