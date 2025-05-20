/**
 * 이벤트 서비스 설정 모듈
 * 환경 변수 및 설정 값을 관리합니다.
 */
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3002,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reward-system',
  },
  inngest: {
    signingKey: process.env.INNGEST_SIGNING_KEY || 'test-signing-key',
  },
  eventProcessing: {
    enabled: process.env.EVENT_PROCESSING_ENABLED === 'true' || false,
  },
});
