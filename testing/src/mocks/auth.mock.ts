import { Role } from '@app/common';

/**
 * 인증 관련 모의(Mock) 데이터
 * 테스트 시 사용할 더미 데이터를 제공합니다.
 */
export const MockAuthData = {
  users: [
    {
      _id: '60d21b4667d0d8992e610c85',
      username: 'testuser',
      email: 'test@example.com',
      password: '$2b$10$x5d5qnTdQFCguSrPDK6MDeRKJbFGfSGw6jCRtBS3nR7mX1bkVBSty', // 'password123'
      roles: [Role.USER],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '60d21b4667d0d8992e610c86',
      username: 'testadmin',
      email: 'admin@example.com',
      password: '$2b$10$x5d5qnTdQFCguSrPDK6MDeRKJbFGfSGw6jCRtBS3nR7mX1bkVBSty', // 'password123'
      roles: [Role.ADMIN],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  tokens: {
    validToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOlsiVVNFUiJdLCJpYXQiOjE2MzIxNTMxMjEsImV4cCI6MTYzMjE1NjcyMX0.3LV9UtqzOB_Ja4O9glk6g9H7iQI-kMtUVIogpTRX6g0',
    expiredToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOlsiVVNFUiJdLCJpYXQiOjE2MzIxNTMxMjEsImV4cCI6MTYzMjE1MzEyMn0.QU6J-Su1fpVHVr5XA4LXXmcVNEkTG1U0wfXenUC8cSg',
    invalidToken: 'invalid.token.format',
  },
};

/**
 * JWT 서비스 모의 객체
 */
export const MockJwtService = {
  sign: jest.fn().mockReturnValue(MockAuthData.tokens.validToken),
  verify: jest.fn().mockImplementation(token => {
    if (token === MockAuthData.tokens.validToken) {
      return {
        userId: MockAuthData.users[0]._id,
        username: MockAuthData.users[0].username,
        email: MockAuthData.users[0].email,
        roles: MockAuthData.users[0].roles,
      };
    }
    throw new Error('Invalid token');
  }),
};

/**
 * 사용자 서비스 모의 객체
 */
export const MockUsersService = {
  // Fixed method name to match your service
  findByUsername: jest.fn().mockImplementation(username => {
    const user = MockAuthData.users.find(u => u.username === username);
    return user
      ? {
          ...user,
          toObject: () => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          },
        }
      : null;
  }),

  // Added missing method
  findByEmail: jest.fn().mockImplementation(email => {
    const user = MockAuthData.users.find(u => u.email === email);
    return user
      ? {
          ...user,
          toObject: () => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          },
        }
      : null;
  }),

  findById: jest.fn().mockImplementation(id => {
    const user = MockAuthData.users.find(u => u._id === id);
    return user
      ? {
          ...user,
          toObject: () => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          },
        }
      : null;
  }),

  create: jest.fn().mockImplementation(createUserDto => {
    const newUser = {
      _id: `mock-id-${Date.now()}`,
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      ...newUser,
      toObject: () => {
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
      },
    };
  }),
};

/**
 * 인증 서비스 모의 객체
 */
export const MockAuthService = {
  validateUser: jest.fn().mockImplementation(async (username, password) => {
    const user = MockAuthData.users.find(u => u.username === username);
    if (!user) return null;

    // 단순 비교로 대체 (실제로는 bcrypt 비교 필요)
    const isMatch = password === 'password123';
    if (!isMatch) return null;

    const { password: _, ...result } = user;
    return result;
  }),

  login: jest.fn().mockImplementation(async user => {
    return {
      access_token: MockAuthData.tokens.validToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }),

  register: jest.fn().mockImplementation(async createUserDto => {
    return MockUsersService.create(createUserDto);
  }),

  findById: jest.fn().mockImplementation(async id => {
    const user = MockAuthData.users.find(u => u._id === id);
    if (!user) throw new Error('User not found');

    const { password, ...result } = user;
    return result;
  }),

  validateToken: jest.fn().mockImplementation(async token => {
    if (token === MockAuthData.tokens.validToken) {
      const user = MockAuthData.users[0];
      return {
        userId: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      };
    }
    throw new Error('Invalid token');
  }),
};
