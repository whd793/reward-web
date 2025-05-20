/**
 * 인증 서비스 설정 모듈
 * 환경 변수 및 설정 값을 관리합니다.
 */
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reward-system',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    expiresIn: process.env.JWT_EXPIRATION || '3600s',
  },
});
