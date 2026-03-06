/**
 * Integration tests for Authentication API
 */
import bcrypt from 'bcryptjs';

const mockUsers = [
  {
    id: '1',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Test User',
    role: 'user',
  },
];

jest.mock('@/lib/db', () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: jest.fn((args) => {
        const user = mockUsers.find(u => u.email === args.where.email);
        return Promise.resolve(user || null);
      }),
      create: jest.fn((args) => {
        const newUser = {
          id: String(mockUsers.length + 1),
          ...args.data,
          role: 'user',
        };
        mockUsers.push(newUser);
        return Promise.resolve(newUser);
      }),
    },
  },
}));

describe('Auth API Integration', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { POST } = await import('@/app/api/auth/login/route');
      const request = {
        json: async () => ({ email: 'test@example.com', password: 'password123' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('test@example.com');
    });

    it('should reject invalid password', async () => {
      const { POST } = await import('@/app/api/auth/login/route');
      const request = {
        json: async () => ({ email: 'test@example.com', password: 'wrongpassword' }),
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const { POST } = await import('@/app/api/auth/login/route');
      const request = {
        json: async () => ({ email: 'nonexistent@example.com', password: 'password123' }),
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/signup', () => {
    it('should create new user', async () => {
      const { POST } = await import('@/app/api/signup/route');
      const request = {
        json: async () => ({
          email: 'newuser@example.com',
          password: 'newpassword123',
          name: 'New User',
        }),
      } as any;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.email).toBe('newuser@example.com');
    });

    it('should reject duplicate email', async () => {
      const { POST } = await import('@/app/api/signup/route');
      const request = {
        json: async () => ({
          email: 'test@example.com',
          password: 'password123',
          name: 'Duplicate User',
        }),
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(409);
    });
  });
});
