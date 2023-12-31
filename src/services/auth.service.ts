import { ObjectId } from "mongodb";

import {
  EActionTokenType,
  EEmailAction,
  EUserAccountType,
  EUserRoles,
  EUserStatus,
} from "../enums";
import { ApiError } from "../errors/api.error";
import { actionTokenRepository } from "../repositories/action-token.repository";
import { tokenRepository } from "../repositories/token.repository";
import { userRepository } from "../repositories/user.repository";
import {
  ISetNewPassword,
  ITokenPayload,
  ITokensPair,
  IUser,
  IUserCredentials,
} from "../types";
import { emailService } from "./email.service";
import { passwordService } from "./password.service";
import { tokenService } from "./token.service";

class AuthService {
  public async register(dto: IUser): Promise<IUser> {
    try {
      const hashedPassword = await passwordService.hash(dto.password);

      const user = await userRepository.register({
        ...dto,
        password: hashedPassword,
      });

      const actionToken = tokenService.generateActionToken(
        {
          userId: user._id,
          name: user.name,
        },
        EActionTokenType.activate,
      );
      await actionTokenRepository.create({
        token: actionToken,
        type: EActionTokenType.activate,
        _userId: user._id,
      });

      await emailService.sendMail(dto.email, EEmailAction.REGISTER, {
        name: dto.name,
        actionToken,
      });

      return user;
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async login(dto: IUserCredentials): Promise<ITokensPair> {
    try {
      const user = await userRepository.getOneByParams({ email: dto.email }, [
        "password",
        "name",
        "role",
        "account_type",
      ]);
      if (!user) {
        throw new ApiError("Invalid credentials provided", 401);
      }

      const isMatched = await passwordService.compare(
        dto.password,
        user.password,
      );
      if (!isMatched) {
        throw new ApiError("Invalid credentials provided", 401);
      }

      const tokensPair = tokenService.generateTokenPair({
        userId: user._id.toString(),
        name: user.name,
        role: user.role,
        accountType: user.account_type,
      });
      await tokenRepository.create({ ...tokensPair, _userId: user._id });

      return tokensPair;
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async refresh(
    payload: ITokenPayload,
    refreshToken: string,
  ): Promise<ITokensPair> {
    try {
      const tokensPair = tokenService.generateTokenPair({
        userId: payload.userId,
        name: payload.name,
      });

      await Promise.all([
        tokenRepository.create({
          ...tokensPair,
          _userId: new ObjectId(payload.userId),
        }),
        tokenRepository.deleteOne({ refreshToken }),
      ]);

      return tokensPair;
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async logout(accessToken: string): Promise<void> {
    try {
      await tokenRepository.deleteOne({ accessToken });
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async logoutAll(userId: string): Promise<void> {
    try {
      await tokenRepository.deleteManyByUserId(userId);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async activate(token: string): Promise<void> {
    try {
      const payload = tokenService.checkActionToken(
        token,
        EActionTokenType.activate,
      );

      const entity = await actionTokenRepository.findOne({ token });

      if (!entity) {
        throw new ApiError("Not valid token", 400);
      }

      await Promise.all([
        actionTokenRepository.deleteManyByUserIdAndType(
          payload.userId,
          EActionTokenType.activate,
        ),
        userRepository.setStatus(payload.userId, EUserStatus.active),
      ]);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async sendActivationToken(tokenPayload: ITokenPayload): Promise<void> {
    try {
      const user = await userRepository.findById(tokenPayload.userId);
      if (user.status !== EUserStatus.inactive) {
        throw new ApiError("User can not be activated", 403);
      }

      const actionToken = tokenService.generateActionToken(
        {
          userId: user._id,
          name: user.name,
        },
        EActionTokenType.activate,
      );
      await actionTokenRepository.create({
        token: actionToken,
        type: EActionTokenType.activate,
        _userId: user._id,
      });

      await emailService.sendMail(user.email, EEmailAction.REGISTER, {
        name: user.name,
        actionToken,
      });
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async forgotPassword(user: IUser): Promise<void> {
    try {
      const actionToken = tokenService.generateActionToken(
        {
          userId: user._id,
        },
        EActionTokenType.forgotPassword,
      );

      await Promise.all([
        actionTokenRepository.create({
          token: actionToken,
          type: EActionTokenType.forgotPassword,
          _userId: user._id,
        }),
        emailService.sendMail(user.email, EEmailAction.FORGOT_PASSWORD, {
          actionToken,
          name: user.name,
        }),
      ]);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async setForgotPassword(
    actionToken: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const payload = tokenService.checkActionToken(
        actionToken,
        EActionTokenType.forgotPassword,
      );

      const entity = await actionTokenRepository.findOne({
        token: actionToken,
      });

      if (!entity) {
        throw new ApiError("Not valid token", 400);
      }

      const newHashedPassword = await passwordService.hash(newPassword);

      await Promise.all([
        userRepository.updateOneById(payload.userId, {
          password: newHashedPassword,
        }),
        actionTokenRepository.deleteOne({ token: actionToken }),
      ]);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async setNewPassword(
    body: ISetNewPassword,
    userId: string,
  ): Promise<void> {
    try {
      const user = await userRepository.findById(userId);

      const isMatch = await passwordService.compare(
        body.password,
        user.password,
      );
      if (!isMatch) {
        throw new ApiError("Not valid password", 400);
      }

      const password = await passwordService.hash(body.newPassword);

      await Promise.all([
        userRepository.updateOneById(userId, { password }),
        this.logoutAll(userId),
      ]);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async administrator(dto: IUser): Promise<void> {
    try {
      const user = await userRepository.getOneByParams({
        role: EUserRoles.Administrator,
      });
      if (user) {
        throw new ApiError("You can`t be admin. Only one Admin allowed", 400);
      }

      const admin = await this.register(dto);
      await Promise.all([
        userRepository.setRole(admin._id, EUserRoles.Administrator),
        userRepository.setAccountType(admin._id, EUserAccountType.Premium),
      ]);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async setManager(userId: string): Promise<void> {
    try {
      await Promise.all([
        userRepository.setRole(userId, EUserRoles.Manager),
        userRepository.setAccountType(userId, EUserAccountType.Premium),
      ]);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }

  public async buyPremiumAccount(userId: string): Promise<void> {
    try {
      await userRepository.setAccountType(userId, EUserAccountType.Premium);
    } catch (e) {
      throw new ApiError(e.message, e.status);
    }
  }
}

export const authService = new AuthService();
