import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';
import * as bcrypt from 'bcryptjs';
import { Role } from '@app/common';
import { User, UserDocument } from '../schemas/user.schema';

// Mock bcrypt to avoid actual password hashing during tests
jest.mock('bcrypt');

// Type for our mock user object - include _id explicitly
type MockUser = Partial<User> & {
  _id?: string;
  toObject: jest.Mock;
};

// Helper function to create a mock user
const createMockUser = (userData: Partial<User> & { _id?: string }): MockUser => {
  const user: MockUser = {
    _id: userData._id || 'user-id',
    username: userData.username || 'testuser',
    email: userData.email || 'test@example.com',
    password: userData.password || 'hashed_password',
    roles: userData.roles || [Role.USER],
    createdAt: userData.createdAt || new Date(),
    updatedAt: userData.updatedAt || new Date(),
    toObject: jest.fn().mockImplementation(() => {
      const obj = { ...user };
      delete obj.toObject;
      return obj;
    }),
  };

  return user;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByUsername: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user object when credentials are valid', async () => {
      const mockUser = createMockUser({
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password123',
        roles: [Role.USER],
      });

      jest
        .spyOn(usersService, 'findOneByUsername')
        .mockResolvedValueOnce(mockUser as unknown as UserDocument);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser('testuser', 'password123');
      expect(result).toBeDefined();
      expect(result.username).toEqual('testuser');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      jest.spyOn(usersService, 'findOneByUsername').mockResolvedValueOnce(null);

      await expect(service.validateUser('nonexistent', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = createMockUser({
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password123',
        roles: [Role.USER],
      });

      jest
        .spyOn(usersService, 'findOneByUsername')
        .mockResolvedValueOnce(mockUser as unknown as UserDocument);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.validateUser('testuser', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: [Role.USER],
      };

      jest.spyOn(service, 'validateUser').mockResolvedValueOnce(mockUser);

      const result = await service.login({ username: 'testuser', password: 'password123' });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('username', 'testuser');
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockRejectedValueOnce(new UnauthorizedException());

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
        roles: [Role.USER],
      };

      const mockCreatedUser = createMockUser({
        _id: 'new-user-id',
        username: 'newuser',
        password: 'hashed-password',
        email: 'new@example.com',
        roles: [Role.USER],
      });

      jest
        .spyOn(usersService, 'create')
        .mockResolvedValueOnce(mockCreatedUser as unknown as UserDocument);

      const result = await service.register(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(mockCreatedUser);
    });
  });

  describe('validateToken', () => {
    it('should return user info when token is valid', async () => {
      const mockPayload = {
        userId: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: [Role.USER],
      };

      const mockUser = createMockUser({
        _id: mockPayload.userId,
        username: mockPayload.username,
        email: mockPayload.email,
        roles: mockPayload.roles,
      });

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce(mockPayload);
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValueOnce(mockUser as unknown as UserDocument);

      const result = await service.validateToken('valid-token');

      expect(result).toHaveProperty('username', mockPayload.username);
      expect(result).toHaveProperty('roles', mockPayload.roles);
    });

    // it('should throw UnauthorizedException when token is invalid', async () => {
    //   jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
    //     throw new Error('Invalid token');
    //   });

    //   await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    // });
    it('should throw UnauthorizedException when token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      // No need to call the function and handle errors manually
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const mockPayload = {
        userId: 'nonexistent-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: [Role.USER],
      };

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce(mockPayload);
      jest.spyOn(usersService, 'findById').mockResolvedValueOnce(null);

      await expect(service.validateToken('valid-token-nonexistent-user')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { JwtService } from '@nestjs/jwt';
// import { AuthService } from './auth.service';
// import { UsersService } from '../users/users.service';
// import { MockAuthData, MockJwtService, MockUsersService } from '@app/testing';
// import { UnauthorizedException } from '@nestjs/common';
// import { Role } from '@app/common';

// describe('AuthService', () => {
//   let service: AuthService;
//   let usersService: UsersService;
//   let jwtService: JwtService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: UsersService,
//           useValue: MockUsersService,
//         },
//         {
//           provide: JwtService,
//           useValue: MockJwtService,
//         },
//       ],
//     }).compile();

//     service = module.get<AuthService>(AuthService);
//     usersService = module.get<UsersService>(UsersService);
//     jwtService = module.get<JwtService>(JwtService);
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('validateUser', () => {
//     it('should return a user object when credentials are valid', async () => {
//       const result = await service.validateUser('testuser', 'password123');
//       expect(result).toBeDefined();
//       expect(result.username).toEqual('testuser');
//     });

//     it('should return null when user is not found', async () => {
//       jest.spyOn(usersService, 'findOneByUsername').mockResolvedValueOnce(null);
//       const result = await service.validateUser('nonexistent', 'password123');
//       expect(result).toBeNull();
//     });

//     it('should return null when password is invalid', async () => {
//       const result = await service.validateUser('testuser', 'wrongpassword');
//       expect(result).toBeNull();
//     });
//   });

//   describe('login', () => {
//     it('should return access token and user info', async () => {
//       jest.spyOn(service, 'validateUser').mockResolvedValueOnce(MockAuthData.users[0]);

//       const result = await service.login({ username: 'testuser', password: 'password123' });

//       expect(result).toHaveProperty('access_token');
//       expect(result).toHaveProperty('user');
//       expect(result.user).toHaveProperty('username', 'testuser');
//     });

//     it('should throw UnauthorizedException when credentials are invalid', async () => {
//       jest.spyOn(service, 'validateUser').mockResolvedValueOnce(null);

//       await expect(
//         service.login({ username: 'testuser', password: 'wrongpassword' }),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//   });

//   describe('register', () => {
//     it('should create a new user', async () => {
//       const createUserDto = {
//         username: 'newuser',
//         password: 'password123',
//         email: 'new@example.com',
//         // roles: ['USER'],
//         roles: [Role.USER], // Use Role enum values here
//       };

//       const result = await service.register(createUserDto);

//       expect(usersService.create).toHaveBeenCalledWith(createUserDto);
//       expect(result).toBeDefined();
//     });
//   });

//   describe('validateToken', () => {
//     it('should return user info when token is valid', async () => {
//       const result = await service.validateToken(MockAuthData.tokens.validToken);

//       expect(result).toHaveProperty('username');
//       expect(result).toHaveProperty('roles');
//     });

//     it('should throw UnauthorizedException when token is invalid', async () => {
//       jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
//         throw new Error('Invalid token');
//       });

//       await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
//     });

//     it('should throw UnauthorizedException when user not found', async () => {
//       jest.spyOn(jwtService, 'verify').mockReturnValueOnce({
//         userId: 'nonexistent-id',
//       });
//       jest.spyOn(usersService, 'findById').mockResolvedValueOnce(null);

//       await expect(service.validateToken(MockAuthData.tokens.validToken)).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//   });
// });
