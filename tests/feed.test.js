const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, clearTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Feed API Endpoints', () => {
  let userA, tokenA;
  let userB, tokenB;
  let userC;

  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      username: 'usera',
      email: 'a@example.com',
      password: 'password123',
      name: 'User A'
    });
    userA = resA.body.data.user;
    tokenA = resA.body.data.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      username: 'userb',
      email: 'b@example.com',
      password: 'password123',
      name: 'User B'
    });
    userB = resB.body.data.user;
    tokenB = resB.body.data.token;

    // Register User C
    const resC = await request(app).post('/api/auth/register').send({
      username: 'userc',
      email: 'c@example.com',
      password: 'password123',
      name: 'User C'
    });
    userC = resC.body.data.user;
    const tokenC = resC.body.data.token;

    // User A posts
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Post from User A' });

    // User B posts
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Post from User B' });

    // User C posts
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ content: 'Post from User C' });

    // User A follows User B (but not User C)
    await request(app)
      .post(`/api/users/${userB._id}/follow`)
      .set('Authorization', `Bearer ${tokenA}`);
  });

  it('should deliver personalized home feed containing followed user posts and own posts only', async () => {
    const res = await request(app)
      .get('/api/posts/feed?type=home')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.feedType, 'home');

    const posts = res.body.data.posts;
    assert.equal(posts.length, 2);

    const authors = posts.map((p) => p.author.username);
    assert.ok(authors.includes('usera'));
    assert.ok(authors.includes('userb'));
    assert.ok(!authors.includes('userc')); // Should NOT contain unfollowed User C
  });

  it('should deliver explore feed containing all global posts', async () => {
    const res = await request(app)
      .get('/api/posts/feed?type=explore')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 200);
    const posts = res.body.data.posts;
    assert.equal(posts.length, 3);

    const authors = posts.map((p) => p.author.username);
    assert.ok(authors.includes('usera'));
    assert.ok(authors.includes('userb'));
    assert.ok(authors.includes('userc'));
  });

  it('should fallback gracefully to explore feed if user has no followed posts and no posts', async () => {
    // New user D
    const resD = await request(app).post('/api/auth/register').send({
      username: 'userd',
      email: 'd@example.com',
      password: 'password123',
      name: 'User D'
    });
    const tokenD = resD.body.data.token;

    const res = await request(app)
      .get('/api/posts/feed?type=home')
      .set('Authorization', `Bearer ${tokenD}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.feedType, 'explore_fallback');
    assert.equal(res.body.data.posts.length, 3);
  });
});
