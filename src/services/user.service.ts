import { UploadedFile } from "express-fileupload";

import { EFileTypes, EUserRoles } from "../enums";
import { ApiError } from "../errors/api.error";
import { userRepository } from "../repositories/user.repository";
import { IPaginationResponse, IQuery, IUser } from "../types";
import { s3Service } from "./s3.service";

class UserService {
  public async getAll(): Promise<IUser[]> {
    return await userRepository.getAll();
  }

  public async getAllWithPagination(
    query: IQuery,
  ): Promise<IPaginationResponse<IUser>> {
    try {
      const [users, itemsFound] = await userRepository.getMany(query);

      return {
        page: +query.page,
        limit: +query.limit,
        itemsFound,
        data: users,
      };
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async updateUser(
    manageUserId: string,
    dto: Partial<IUser>,
    userId: string,
    role: string,
  ): Promise<IUser> {
    this.checkAbilityToManage(userId, manageUserId, role);

    return await userRepository.updateOneById(manageUserId, dto);
  }

  public async deleteUser(userId: string): Promise<void> {
    await userRepository.deleteUser(userId);
  }

  public async getMe(userId: string): Promise<IUser> {
    return await userRepository.findById(userId);
  }

  public async uploadAvatar(
    avatar: UploadedFile,
    userId: string,
  ): Promise<IUser> {
    const user = await userRepository.findById(userId);

    if (user.avatar) {
      await s3Service.deleteFile(user.avatar);
    }

    const filePath = await s3Service.uploadFile(
      avatar,
      EFileTypes.User,
      userId,
    );

    return await userRepository.updateOneById(userId, { avatar: filePath });
  }

  private checkAbilityToManage(
    userId: string,
    manageUserId: string,
    role: string,
  ): void {
    if (
      userId !== manageUserId &&
      role !== (EUserRoles.Administrator || EUserRoles.Manager)
    ) {
      throw new ApiError("You can not manage this user", 403);
    }
  }
}

export const userService = new UserService();
