// apps/auth/src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@app/common';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const createMockUser = (overrides = {}) => ({
    _id: 'user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed_password',
    roles: [Role.USER],
    ...overrides,
    toObject: jest.fn().mockImplementation(function () {
      const { password, toObject, ...rest } = this;
      return rest;
    }),
  });

  const mockUsersService = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const mockUser = createMockUser();
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = createMockUser();
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: [Role.USER],
      };

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token', 'test-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: [Role.USER],
      });
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        roles: [Role.USER],
      };

      // Create a mock user with the new user data
      const createdUser = createMockUser({
        _id: 'new-user-id',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed_password',
      });

      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashed_password',
      });
      expect(result.username).toBe('newuser');
      expect(result.password).toBeUndefined();
    });

    it('should throw ConflictException when username exists', async () => {
      const createUserDto = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockUser = createMockUser();
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.register(createUserDto)).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictException when email exists', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const mockUser = createMockUser();
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.register(createUserDto)).rejects.toThrow('Email already exists');
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const mockUser = createMockUser();
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.findById('user-id');

      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
