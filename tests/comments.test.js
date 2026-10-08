const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, clearTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Comments API Endpoints', () => {
  let user1, token1;
  let user2, token2;
  let post;

  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const res1 = await request(app).post('/api/auth/register').send({
      username: 'postauthor',
      email: 'author@example.com',
      password: 'password123',
      name: 'Author Name'
    });
    user1 = res1.body.data.user;
    token1 = res1.body.data.token;

    const res2 = await request(app).post('/api/auth/register').send({
      username: 'commenter',
      email: 'commenter@example.com',
      password: 'password123',
      name: 'Commenter Name'
    });
    user2 = res2.body.data.user;
    token2 = res2.body.data.token;

    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Discuss this post below!' });
    post = postRes.body.data.post;
  });

  describe('POST /api/comments/post/:postId', () => {
    it('should add a comment and increment post commentsCount', async () => {
      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Great perspective on BLEM!' });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.comment.content, 'Great perspective on BLEM!');
      assert.equal(res.body.data.comment.author.username, 'commenter');

      // Check that post commentsCount incremented
      const postCheck = await request(app).get(`/api/posts/${post._id}`);
      assert.equal(postCheck.body.data.post.commentsCount, 1);
    });

    it('should reject empty comment content', async () => {
      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: '' });

      assert.equal(res.status, 400);
    });
  });

  describe('GET /api/comments/post/:postId', () => {
    it('should retrieve all comments for a post in chronological order', async () => {
      await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Second comment reply' });

      const res = await request(app).get(`/api/comments/post/${post._id}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 2);
      assert.equal(res.body.data[0].content, 'First comment');
      assert.equal(res.body.data[1].content, 'Second comment reply');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Comment to be deleted' });
      commentId = res.body.data.comment._id;
    });

    it('should allow author of comment to delete it and decrement commentsCount', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(res.status, 200);

      // Verify post commentsCount decremented back to 0
      const postCheck = await request(app).get(`/api/posts/${post._id}`);
      assert.equal(postCheck.body.data.post.commentsCount, 0);
    });

    it('should reject unauthorized user attempting to delete comment', async () => {
      // Create a 3rd user
      const res3 = await request(app).post('/api/auth/register').send({
        username: 'unauthorized',
        email: 'unauth@example.com',
        password: 'password123',
        name: 'Random User'
      });
      const token3 = res3.body.data.token;

      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token3}`);

      assert.equal(res.status, 403);
    });
  });
});
