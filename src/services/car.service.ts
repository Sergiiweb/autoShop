import { UploadedFile } from "express-fileupload";

import { regexConstants } from "../constants/regex.constants";
import {
  ECarCardStatus,
  ECurrency,
  EEmailAction,
  EFileTypes,
  ETimeInterval,
  EUserAccountType,
  EUserRoles,
} from "../enums";
import { ApiError } from "../errors/api.error";
import { carRepository } from "../repositories/car.repository";
import { exchangeRatesRepository } from "../repositories/exchange-rates.repository";
import { userRepository } from "../repositories/user.repository";
import { ICar, IPaginationResponse, IQuery, IStatistics, View } from "../types";
import { emailService } from "./email.service";
import { s3Service } from "./s3.service";

class CarService {
  public async getAllWithPagination(
    query: IQuery,
  ): Promise<IPaginationResponse<ICar>> {
    try {
      const [cars, itemsFound] = await carRepository.getMany(query);

      return {
        page: +query.page,
        limit: +query.limit,
        itemsFound,
        data: cars,
      };
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async createCar(
    dto: ICar,
    userId: string,
    accountType: string,
  ): Promise<ICar> {
    await Promise.all([
      this.checkAbilityToCreate(userId, accountType),
      this.checkForBadWords(dto),
      this.priceCalculationInOtherCurrencies(dto),
    ]);

    return await carRepository.createCar(dto, userId);
  }

  public async updateCar(
    carId: string,
    dto: Partial<ICar>,
    userId: string,
    role: string,
  ): Promise<ICar> {
    await this.checkAbilityToManage(userId, carId, role);
    return await carRepository.updateCar(carId, dto);
  }

  public async deleteCar(
    carId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.checkAbilityToManage(userId, carId, role);
    await carRepository.deleteCar(carId);
  }

  public async uploadPhoto(photo: UploadedFile, carId: string): Promise<ICar> {
    const car = await carRepository.findById(carId);

    if (car.photo) {
      await s3Service.deleteFile(car.photo);
    }

    const filePath = await s3Service.uploadFile(photo, EFileTypes.Car, carId);

    return await carRepository.updateOneById(carId, { photo: filePath });
  }

  public async getAllInactiveCarsWithPagination(
    query: IQuery,
  ): Promise<IPaginationResponse<ICar>> {
    try {
      const [cars, itemsFound] = await carRepository.getAllInactiveCars(query);

      return {
        page: +query.page,
        limit: +query.limit,
        itemsFound,
        data: cars,
      };
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async getStatistics(carId: string): Promise<IStatistics> {
    try {
      const avgPrices = await carRepository.calculateAvgPrice(carId);
      await carRepository.updateStatistic(carId, avgPrices);
      return await carRepository.getStatistic(carId);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async addView(carId: string): Promise<void> {
    try {
      const views = await carRepository.getViews(carId);
      if (!views) {
        await carRepository.createViews(carId);
      }

      const newView: View = {
        timestamp: Date.now(),
      };
      views.views.push(newView);

      await carRepository.updateViews(carId, views);
      await this.updateStatisticViews(carId);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  private async priceCalculationInOtherCurrencies(dto: ICar): Promise<void> {
    try {
      const [rates] = await exchangeRatesRepository.getAll();

      switch (dto.currency) {
        case ECurrency.UAH:
          dto.priceUAH = dto.price;
          dto.priceEUR = Math.ceil(dto.price / rates.EUR);
          dto.priceUSD = Math.ceil(dto.price / rates.USD);
          break;
        case ECurrency.EUR:
          dto.priceEUR = dto.price;
          dto.priceUAH = Math.ceil(dto.price * rates.EUR);
          dto.priceUSD = Math.ceil((dto.price * rates.EUR) / rates.USD);
          break;
        case ECurrency.USD:
          dto.priceUSD = dto.price;
          dto.priceEUR = Math.ceil((dto.price * rates.USD) / rates.EUR);
          dto.priceUAH = Math.ceil(dto.price * rates.USD);
          break;
      }
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  private async updateStatisticViews(carId: string): Promise<any> {
    try {
      const { views } = await carRepository.getViews(carId);

      const stat = await carRepository.getStatistic(carId);
      stat.views = this.countViews(views, Number.MAX_SAFE_INTEGER);
      stat.views_per_day = this.countViews(views, ETimeInterval.Day);
      stat.views_per_week = this.countViews(views, ETimeInterval.Week);
      stat.views_per_month = this.countViews(views, ETimeInterval.Month);
      return await carRepository.updateStatistic(carId, stat);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  private countViews(views: View[], interval: ETimeInterval): number {
    const now = new Date().getTime();
    const viewsWithinInterval = views.filter(
      (view) => now - view.timestamp <= interval,
    );
    return viewsWithinInterval.length;
  }

  private async checkAbilityToManage(
    userId: string,
    manageCarId: string,
    role: string,
  ): Promise<ICar> {
    const car = await carRepository.getOneByParams({
      _userId: userId,
      _id: manageCarId,
    });

    if (!car && role !== (EUserRoles.Administrator || EUserRoles.Manager)) {
      throw new ApiError("You can not manage this car", 403);
    }

    return car;
  }

  private async checkAbilityToCreate(
    userId: string,
    accountType: string,
  ): Promise<void> {
    const userCar = await carRepository.getOneByParams({ _userId: userId });
    if (userCar && accountType === EUserAccountType.Base) {
      throw new ApiError(
        "You can not add any more cars. Buy premium account.",
        403,
      );
    }
  }

  private async checkForBadWords(dto: ICar): Promise<void> {
    const checkForBadWords = dto.description.match(regexConstants.DESCRIPTION);
    if (!checkForBadWords) {
      dto.status = ECarCardStatus.active;
    } else {
      const moderator = await userRepository.getOneByParams({
        role: EUserRoles.Manager,
      });
      await emailService.sendMail(
        moderator.email,
        EEmailAction.MODERATE_CAR_CARD,
        {
          name: moderator.name,
          id: dto._id,
        },
      );
    }
  }
}

export const carService = new CarService();
