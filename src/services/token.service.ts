import * as jwt from "jsonwebtoken";

import { configs } from "../configs/config";
import { EActionTokenType } from "../enums";
import { ApiError } from "../errors/api.error";
import { ITokenPayload, ITokensPair } from "../types";

class TokenService {
  public generateTokenPair(payload: ITokenPayload): ITokensPair {
    const accessToken = jwt.sign(payload, configs.JWT_ACCESS_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload, configs.JWT_REFRESH_SECRET, {
      expiresIn: "2h",
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  public checkToken(token: string, type: "access" | "refresh"): ITokenPayload {
    try {
      let secret: string;

      switch (type) {
        case "access":
          secret = configs.JWT_ACCESS_SECRET;
          break;
        case "refresh":
          secret = configs.JWT_REFRESH_SECRET;
          break;
      }

      return jwt.verify(token, secret) as ITokenPayload;
    } catch (e) {
      throw new ApiError("Token not valid", 401);
    }
  }

  public generateActionToken(
    payload: ITokenPayload,
    tokenType: EActionTokenType,
  ): string {
    let secret: string;

    switch (tokenType) {
      case EActionTokenType.activate:
        secret = configs.JWT_ACTIVATE_SECRET;
        break;
      case EActionTokenType.forgotPassword:
        secret = configs.JWT_FORGOT_SECRET;
        break;
    }

    return jwt.sign(payload, secret, {
      expiresIn: "1d",
    });
  }

  public checkActionToken(
    token: string,
    tokenType: EActionTokenType,
  ): ITokenPayload {
    try {
      let secret: string;

      switch (tokenType) {
        case EActionTokenType.activate:
          secret = configs.JWT_ACTIVATE_SECRET;
          break;
        case EActionTokenType.forgotPassword:
          secret = configs.JWT_FORGOT_SECRET;
          break;
      }

      return jwt.verify(token, secret) as ITokenPayload;
    } catch (e) {
      throw new ApiError("Token not valid", 401);
    }
  }
}

export const tokenService = new TokenService();
