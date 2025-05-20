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

/**
 * 게이트웨이 서비스 구성 함수
 * 환경 변수에서 구성 값을 가져옵니다.
 */
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  services: {
    auth: {
      host: process.env.AUTH_HOST || 'localhost',
      port: parseInt(process.env.AUTH_PORT, 10) || 3001,
    },
    event: {
      host: process.env.EVENT_HOST || 'localhost',
      port: parseInt(process.env.EVENT_PORT, 10) || 3002,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '1d',
  },
});
