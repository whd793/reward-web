/**
 * 게이트웨이 서비스 설정 모듈
 * 환경 변수 및 설정 값을 관리합니다.
 */
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    expiresIn: process.env.JWT_EXPIRATION || '3600s',
  },
  services: {
    auth: {
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
    },
    event: {
      host: process.env.EVENT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.EVENT_SERVICE_PORT, 10) || 3002,
    },
  },
});
