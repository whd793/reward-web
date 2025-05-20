import * as Joi from 'joi';

/**
 * 이벤트 서비스 환경 변수 검증 스키마
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3002),
  MONGODB_URI: Joi.string().required(),
  INNGEST_DEV: Joi.boolean().default(true),
  INNGEST_SIGNING_KEY: Joi.string().default('dev_inngest_signing_key'),
});
