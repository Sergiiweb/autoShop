import { model, Schema } from "mongoose";

import { EGenders, EUserAccountType, EUserRoles, EUserStatus } from "../enums";
import { IUser } from "../types";

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    age: {
      type: Number,
      min: [1, "Minimum age is 1"],
      max: [199, "Maximum age is 199"],
    },
    genders: {
      type: String,
      enum: EGenders,
    },
    status: {
      type: String,
      enum: EUserStatus,
      required: true,
      default: EUserStatus.inactive,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: EUserRoles,
      required: true,
      default: EUserRoles.Seller,
    },
    account_type: {
      type: String,
      enum: EUserAccountType,
      required: true,
      default: EUserAccountType.Base,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User = model<IUser>("user", userSchema);
