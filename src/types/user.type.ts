import { Document } from "mongoose";

import { EGenders, EUserAccountType, EUserRoles, EUserStatus } from "../enums";

export interface IUser extends Document {
  name?: string;
  age?: number;
  genders?: EGenders;
  email: string;
  phone: string;
  password: string;
  status: EUserStatus;
  avatar: string;
  role: EUserRoles;
  account_type: EUserAccountType;
}

export type IUserCredentials = Pick<IUser, "email" | "password">;

export interface ISetNewPassword extends Pick<IUser, "email" | "password"> {
  newPassword: string;
}
