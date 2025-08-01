const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const Auction = require('../../models/Auction');
const User = require('../../models/User');
const { connect, clearDatabase, closeDatabase } = require('../dbHandler');

// Setup and teardown for tests
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  username: 'TestUser',
  role: 'Seller' // Change to Seller to be able to create auctions
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123',
  username: 'AdminUser',
  role: 'Admin' // Match the enum values in User model
};

const testAuction = {
  title: 'Test Auction',
  description: 'This is a test auction',
  basePrice: 100,
  currentPrice: 100,
  expirationTime: new Date(Date.now() + 3600000), // 1 hour from now
  status: 'active',
  image: 'test-image.jpg'
};

// Helper function to get auth token
const getToken = async (user) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  return res.body.token;
};

const bcrypt = require('bcryptjs');

// Helper function to create a user
const createUser = async (user) => {
  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(user.password, 10);

  return await User.create({
    email: user.email,
    password: hashedPassword,
    username: user.username,
    role: user.role
  });
};

describe('Auction Controller Tests', () => {
  describe('GET /api/auctions', () => {
    beforeEach(async () => {
      await createUser(testUser);

      // Create a test user and use their ID for the seller field
      const user = await User.findOne({ email: testUser.email });

      // Create some test auctions in the database with the seller field set
      await Auction.create([
        { ...testAuction, title: 'Auction 1', seller: user._id },
        { ...testAuction, title: 'Auction 2', seller: user._id },
        { ...testAuction, title: 'Auction 3', seller: user._id }
      ]);
    });

    it('should return all auctions', async () => {
      const res = await request(app).get('/api/auctions');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('basePrice');
    });
    it('should filter auctions by seller id', async () => {
      // Get user for seller field
      const user = await User.findOne({ email: testUser.email });

      // Create another user who will be a seller
      const anotherUser = await User.create({
        email: 'another@example.com',
        password: 'password123',
        username: 'AnotherUser',
        role: 'Seller'
      });

      // Create auction with different seller
      await Auction.create({
        ...testAuction,
        title: 'Different Seller Auction',
        seller: anotherUser._id
      });

      const res = await request(app)
        .get('/api/auctions')
        .query({ seller: anotherUser._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Different Seller Auction');
    });
  });

  describe('GET /api/auctions/:id', () => {
    let auctionId;

    beforeEach(async () => {
      await createUser(testUser);
      const user = await User.findOne({ email: testUser.email });
      const auction = await Auction.create({ ...testAuction, seller: user._id });
      auctionId = auction._id;
    });

    it('should return a single auction by id', async () => {
      const res = await request(app).get(`/api/auctions/${auctionId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', auctionId.toString());
      expect(res.body).toHaveProperty('title', testAuction.title);
    });

    it('should return 404 for non-existent auction', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/auctions/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auctions', () => {
    beforeEach(async () => {
      await createUser(testUser);
    });

    it('should create a new auction when authenticated', async () => {
      const token = await getToken(testUser);

      const res = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${token}`)
        .send(testAuction);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('title', testAuction.title);
      expect(res.body).toHaveProperty('seller');

      // Verify auction is in database
      const auction = await Auction.findById(res.body._id);
      expect(auction).toBeTruthy();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/auctions').send(testAuction);

      expect(res.status).toBe(401);
    });
  });
});
