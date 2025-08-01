const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const User = require('../../models/User');
const dbHandler = require('../dbHandler');

// Set up express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Setup and teardown
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Auth Controller', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user when valid data is provided', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'buyer'
      };

      const res = await request(app).post('/api/auth/signup').send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');

      // Check user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
      expect(user.role).toBe(userData.role);
    });

    it('should return 400 when email is already in use', async () => {
      // Create a user first
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'buyer'
      };

      await request(app).post('/api/auth/signup').send(userData);

      // Try to create another user with the same email
      const res = await request(app).post('/api/auth/signup').send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user with valid credentials', async () => {
      // Create a user first
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'buyer'
      };

      await request(app).post('/api/auth/signup').send(userData);

      // Try to log in
      const res = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('userId');
    });
    it('should return 400 with invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
