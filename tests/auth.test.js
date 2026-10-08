const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, clearTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Auth API Endpoints', () => {
  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123',
          name: 'John Doe',
          bio: 'Hello BLEM!'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.username, 'johndoe');
      assert.equal(res.body.data.user.email, 'john@example.com');
      assert.equal(res.body.data.user.name, 'John Doe');
      assert.equal(res.body.data.user.password, undefined); // Password should NOT be returned
    });

    it('should reject registration if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'invalid-email',
          password: 'password123',
          name: 'John Doe'
        });

      assert.equal(res.status, 422);
      assert.equal(res.body.success, false);
    });

    it('should reject duplicate email or username registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123',
          name: 'John Doe'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'other@example.com',
          password: 'password123',
          name: 'John Another'
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice',
          email: 'alice@example.com',
          password: 'securepassword',
          name: 'Alice Wonder'
        });
    });

    it('should log in with valid username and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'alice',
          password: 'securepassword'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.username, 'alice');
    });

    it('should log in with valid email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'alice@example.com',
          password: 'securepassword'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
    });

    it('should reject incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'alice',
          password: 'wrongpassword'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should retrieve current authenticated user details', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bob',
          email: 'bob@example.com',
          password: 'password123',
          name: 'Bob Builder'
        });

      const token = regRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.username, 'bob');
      assert.equal(res.body.data.user.followersCount, 0);
    });

    it('should reject request without valid token', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });
});
