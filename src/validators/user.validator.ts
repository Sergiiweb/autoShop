import joi from "joi";

import { regexConstants } from "../constants/regex.constants";
import { EGenders } from "../enums";

export class UserValidator {
  static firstName = joi.string().min(2).max(50).trim();
  static age = joi.number().min(18).max(150);
  static genders = joi.valid(...Object.values(EGenders));
  static email = joi.string().regex(regexConstants.EMAIL).trim();
  static phone = joi.string().regex(regexConstants.PHONE).trim();
  static password = joi.string().regex(regexConstants.PASSWORD).trim();

  static update = joi.object({
    name: this.firstName,
    age: this.age,
    genders: this.genders,
    phone: this.phone,
  });

  static register = joi.object({
    name: this.firstName.required(),
    age: this.age.required(),
    genders: this.genders.required(),
    email: this.email.required(),
    password: this.password.required(),
    phone: this.phone.required(),
  });

  static login = joi.object({
    email: this.email.required(),
    password: this.password.required(),
  });

  static forgotPassword = joi.object({
    email: this.email.required(),
  });

  static setForgotPassword = joi.object({
    newPassword: this.password.required(),
  });

  static setNewPassword = joi.object({
    password: this.password.required(),
    newPassword: this.password.required(),
  });
}
