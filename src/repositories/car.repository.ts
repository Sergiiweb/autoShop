import { FilterQuery } from "mongoose";

import { ECarCardStatus } from "../enums";
import { Car } from "../models/Car.model";
import { Statistics } from "../models/Statistics.model";
import { Views } from "../models/Views.model";
import { ICar, IQuery, IStatistics, IViews } from "../types";

class CarRepository {
  public async getAll(): Promise<ICar[]> {
    return await Car.find({ status: ECarCardStatus.active });
  }

  public async getMany(query: IQuery): Promise<[ICar[], number]> {
    const queryStr = JSON.stringify(query);
    const queryObj = JSON.parse(
      queryStr.replace(/\b(gte|lte|gt|lt)\b/, (match) => `$${match}`),
    );

    const { page, limit, sortedBy, ...searchObject } = queryObj;
    searchObject.status = ECarCardStatus.active;

    const skip = +limit * (+page - 1);

    return await Promise.all([
      Car.find(searchObject)
        .limit(+limit)
        .skip(skip)
        .sort(sortedBy)
        .populate("_userId", ["name", "phone"]),
      Car.count(searchObject),
    ]);
  }

  public async getOneByParams(params: FilterQuery<ICar>): Promise<ICar> {
    return await Car.findOne(params);
  }

  public async findById(id: string): Promise<ICar> {
    return await Car.findById(id);
  }

  public async createCar(dto: ICar, userId: string): Promise<ICar> {
    const car = await Car.create({ ...dto, _userId: userId });

    await this.createStatistic(car._id);
    await this.createViews(car._id);

    return car;
  }

  public async updateCar(carId: string, dto: Partial<ICar>): Promise<ICar> {
    return await Car.findByIdAndUpdate(carId, dto, {
      returnDocument: "after",
    }).populate("_userId");
  }

  public async deleteCar(carId: string): Promise<void> {
    await Car.deleteOne({ _id: carId });
  }

  public async updateOneById(carId: string, dto: Partial<ICar>): Promise<ICar> {
    return await Car.findByIdAndUpdate(carId, dto, {
      returnDocument: "after",
    });
  }

  public async getAllInactiveCars(query: IQuery): Promise<[ICar[], number]> {
    const queryStr = JSON.stringify(query);
    const queryObj = JSON.parse(
      queryStr.replace(/\b(gte|lte|gt|lt)\b/, (match) => `$${match}`),
    );

    const { page, limit, sortedBy, ...searchObject } = queryObj;
    searchObject.status = ECarCardStatus.inactive;

    const skip = +limit * (+page - 1);

    return await Promise.all([
      Car.find(searchObject)
        .limit(+limit)
        .skip(skip)
        .sort(sortedBy)
        .populate("_userId", ["name", "phone"]),
      Car.count(searchObject),
    ]);
  }

  public async getStatistic(carId: string): Promise<IStatistics> {
    return await Statistics.findOne({ _carId: carId });
  }

  public async createStatistic(carId: string): Promise<void> {
    await Statistics.create({ _carId: carId });
  }

  public async updateStatistic(
    carId: string,
    dto: Partial<IStatistics>,
  ): Promise<void> {
    await Statistics.updateOne({ _carId: carId }, dto);
  }

  // public async addView(carId: string, dto: IStatistics): Promise<void> {
  //   await Statistics.updateOne({ _carId: carId }, dto);
  // }

  public async calculateAvgPrice(carId: string): Promise<Partial<IStatistics>> {
    const car = await Car.findOne({ _id: carId });

    const avgModelPriceByRegion = await Car.aggregate([
      {
        $match: { region: car.region, model: car.model, brand: car.brand },
      },
      {
        $group: {
          _id: null,
          averagePrice: { $avg: "$price" },
        },
      },
    ]);

    const avgModelPrice = await Car.aggregate([
      {
        $match: { model: car.model, brand: car.brand },
      },
      {
        $group: {
          _id: null,
          averagePrice: { $avg: "$price" },
        },
      },
    ]);

    return {
      avg_region_price: avgModelPriceByRegion[0].averagePrice.toFixed(1),
      avg_price: avgModelPrice[0].averagePrice.toFixed(1),
    };
  }

  public async getViews(carId: string): Promise<IViews> {
    return await Views.findOne({ _carId: carId });
  }

  public async createViews(carId: string): Promise<void> {
    await Views.create({ _carId: carId });
  }

  public async updateViews(carId: string, dto: IViews): Promise<void> {
    await Views.updateOne({ _carId: carId }, dto);
  }

  // public async countViewsByCarId(carId: string): Promise<number> {
  //   const result = await Views.aggregate([
  //     {
  //       $match: { _carId: carId },
  //     },
  //     {
  //       $project: {
  //         viewsCount: { $size: "$views" },
  //       },
  //     },
  //   ]);
  //
  //   if (result.length > 0) {
  //     return result[0].viewsCount;
  //   }
  //
  //   return 0;
  // }
}

export const carRepository = new CarRepository();
