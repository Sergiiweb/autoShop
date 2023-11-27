import axios from "axios";
import { CronJob } from "cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { ECurrency } from "../enums";
import { ApiError } from "../errors/api.error";
import { carRepository } from "../repositories/car.repository";
import { exchangeRatesRepository } from "../repositories/exchange-rates.repository";

dayjs.extend(utc);

interface IExchangeRate {
  ccy: string;
  base_ccy: string;
  buy: string;
  sale: string;
}

const handler = async function () {
  try {
    const { data } = await axios.get(
      "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5",
    );

    const rates = data.reduce((acc: any, rate: IExchangeRate) => {
      acc[rate.ccy] = parseFloat(rate.sale);
      return acc;
    }, {});

    await exchangeRatesRepository.create(rates);

    const cars = await carRepository.getAll();
    await Promise.all([
      cars.map(async (car) => {
        switch (car.currency) {
          case ECurrency.UAH:
            car.priceUAH = car.price;
            car.priceEUR = Math.ceil(car.price / rates.EUR);
            car.priceUSD = Math.ceil(car.price / rates.USD);
            break;
          case ECurrency.EUR:
            car.priceEUR = car.price;
            car.priceUAH = Math.ceil(car.price * rates.EUR);
            car.priceUSD = Math.ceil((car.price * rates.EUR) / rates.USD);
            break;
          case ECurrency.USD:
            car.priceUSD = car.price;
            car.priceEUR = Math.ceil((car.price * rates.USD) / rates.EUR);
            car.priceUAH = Math.ceil(car.price * rates.USD);
            break;
        }

        await carRepository.updateCar(car._id, {
          priceUAH: car.priceUAH,
          priceUSD: car.priceUSD,
          priceEUR: car.priceEUR,
        });
      }),
    ]);
  } catch (e) {
    throw new ApiError(e.message, e.status);
  }
};

export const getExchangeRatesFromPB = new CronJob("0 0 0 * * *", handler);
