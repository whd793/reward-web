import * as Joi from 'joi';

/**
 * 게이트웨이 서비스 환경 변수 검증 스키마
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('1d'),
  AUTH_HOST: Joi.string().required(),
  AUTH_PORT: Joi.number().required(),
  EVENT_HOST: Joi.string().required(),
  EVENT_PORT: Joi.number().required(),
});
