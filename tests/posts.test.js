const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, clearTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Posts API Endpoints', () => {
  let user1, token1;
  let user2, token2;

  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const res1 = await request(app).post('/api/auth/register').send({
      username: 'postcreator',
      email: 'creator@example.com',
      password: 'password123',
      name: 'Creator One'
    });
    user1 = res1.body.data.user;
    token1 = res1.body.data.token;

    const res2 = await request(app).post('/api/auth/register').send({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
      name: 'Other User'
    });
    user2 = res2.body.data.user;
    token2 = res2.body.data.token;
  });

  describe('POST /api/posts', () => {
    it('should create a new post with author details', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Hello BLEM community! First post.' });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.post.content, 'Hello BLEM community! First post.');
      assert.equal(res.body.data.post.author.username, 'postcreator');
      assert.equal(res.body.data.post.likesCount, 0);
      assert.equal(res.body.data.post.isOwner, true);
    });

    it('should reject empty post content', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: '   ' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('should reject unauthenticated post creation', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Unauthorized post attempt' });

      assert.equal(res.status, 401);
    });
  });

  describe('GET & DELETE /api/posts/:id', () => {
    let post;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'A post to inspect and delete.' });
      post = res.body.data.post;
    });

    it('should get post by ID', async () => {
      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.post.content, 'A post to inspect and delete.');
      assert.equal(res.body.data.post.isOwner, false);
    });

    it('should prevent non-author from deleting post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(res.status, 403);
    });

    it('should allow author to delete post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 200);

      // Verify post no longer exists
      const getRes = await request(app).get(`/api/posts/${post._id}`);
      assert.equal(getRes.status, 404);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    let post;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test post for likes' });
      post = res.body.data.post;
    });

    it('should toggle like on post (like then unlike)', async () => {
      // First toggle: Like
      const likeRes = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(likeRes.status, 200);
      assert.equal(likeRes.body.data.liked, true);
      assert.equal(likeRes.body.data.likesCount, 1);

      // Check post state
      const postAfterLike = await request(app)
        .get(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token2}`);
      assert.equal(postAfterLike.body.data.post.hasLiked, true);
      assert.equal(postAfterLike.body.data.post.likesCount, 1);

      // Second toggle: Unlike
      const unlikeRes = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(unlikeRes.status, 200);
      assert.equal(unlikeRes.body.data.liked, false);
      assert.equal(unlikeRes.body.data.likesCount, 0);
    });
  });

  describe('GET /api/posts/user/:userId', () => {
    it('should return timeline posts for a specific user', async () => {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Timeline Post 1' });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Timeline Post 2' });

      const res = await request(app).get(`/api/posts/user/${user1._id}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 2);
      assert.equal(res.body.meta.total, 2);
    });
  });
});
