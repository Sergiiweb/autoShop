import { FilterQuery } from "mongoose";

import { ExchangeRates } from "../models/ExchangeRate.model";
import { IExchangeRates } from "../types";

class ExchangeRatesRepository {
  public async getAll(): Promise<IExchangeRates[]> {
    return await ExchangeRates.find();
  }

  public async getOneByParams(
    params: FilterQuery<IExchangeRates>,
  ): Promise<IExchangeRates> {
    return await ExchangeRates.findOne(params);
  }

  public async create(dto: IExchangeRates): Promise<IExchangeRates> {
    await ExchangeRates.deleteMany();
    return await ExchangeRates.create(dto);
  }
}

export const exchangeRatesRepository = new ExchangeRatesRepository();
