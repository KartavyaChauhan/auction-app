const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { connect, closeDatabase } = require('../dbHandler');

// Setup and teardown for tests
beforeAll(async () => await connect());
afterAll(async () => await closeDatabase());

describe('Health Controller Tests', () => {
  describe('GET /health', () => {
    it('should return health status information', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('cpu');
    });
  });

  describe('GET /health/deep', () => {
    it('should return deep health status with database info', async () => {
      const res = await request(app).get('/health/deep');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('services');
      expect(res.body.services).toHaveProperty('database');

      // If we're using the in-memory database, it should be connected
      if (mongoose.connection.readyState === 1) {
        expect(res.body.services.database).toBe('UP');
      }
    });
  });
});
