import * as Joi from "joi";

export const configValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().uri().required(),

  // Auth
  BETTER_AUTH_SECRET: Joi.string().min(32).required(),
  BETTER_AUTH_URL: Joi.string().uri().required(),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // Server
  PORT: Joi.number().port().default(3001),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace")
    .default("info"),

  // Storage (conditional)
  STORAGE_PROVIDER: Joi.string().valid("local", "r2").default("local"),
  R2_ACCOUNT_ID: Joi.string().when("STORAGE_PROVIDER", {
    is: "r2",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  R2_ACCESS_KEY_ID: Joi.string().when("STORAGE_PROVIDER", {
    is: "r2",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  R2_SECRET_ACCESS_KEY: Joi.string().when("STORAGE_PROVIDER", {
    is: "r2",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  R2_BUCKET_NAME: Joi.string().when("STORAGE_PROVIDER", {
    is: "r2",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  R2_PUBLIC_URL: Joi.string().uri().optional(),

  // File upload
  MAX_FILE_SIZE: Joi.number().default(26214400), // 25MB

  // Email
  RESEND_API_KEY: Joi.string().allow("").optional(),

  // WhatsApp
  WHATSAPP_API_URL: Joi.string().uri().allow("").optional(),
  WHATSAPP_API_KEY: Joi.string().allow("").optional(),
}).options({ allowUnknown: true });
