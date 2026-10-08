const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, clearTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Users API Endpoints', () => {
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

    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send({
      username: 'userone',
      email: 'user1@example.com',
      password: 'password123',
      name: 'User One',
      bio: 'Bio One'
    });
    user1 = res1.body.data.user;
    token1 = res1.body.data.token;

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send({
      username: 'usertwo',
      email: 'user2@example.com',
      password: 'password123',
      name: 'User Two',
      bio: 'Bio Two'
    });
    user2 = res2.body.data.user;
    token2 = res2.body.data.token;
  });

  describe('GET /api/users/profile/:username', () => {
    it('should return user public profile with follower stats', async () => {
      const res = await request(app)
        .get(`/api/users/profile/${user1.username}`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.username, 'userone');
      assert.equal(res.body.data.followersCount, 0);
      assert.equal(res.body.data.isFollowing, false);
      assert.equal(res.body.data.isSelf, false);
    });

    it('should return 404 for non-existent username', async () => {
      const res = await request(app).get('/api/users/profile/nonexistentuser');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('should allow authenticated user to update their profile name and bio', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Updated Name One',
          bio: 'Updated Bio One'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.name, 'Updated Name One');
      assert.equal(res.body.data.user.bio, 'Updated Bio One');
    });

    it('should reject profile update without authentication', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .send({ name: 'Hacker' });

      assert.equal(res.status, 401);
    });
  });

  describe('POST & DELETE /api/users/:id/follow', () => {
    it('should allow user2 to follow user1 and increment follower counts', async () => {
      const followRes = await request(app)
        .post(`/api/users/${user1._id}/follow`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(followRes.status, 200);
      assert.equal(followRes.body.data.isFollowing, true);
      assert.equal(followRes.body.data.followersCount, 1);

      // Verify user1 profile reflects following status
      const profileRes = await request(app)
        .get(`/api/users/profile/${user1.username}`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(profileRes.body.data.isFollowing, true);
      assert.equal(profileRes.body.data.followersCount, 1);
    });

    it('should prevent user from following themselves', async () => {
      const res = await request(app)
        .post(`/api/users/${user1._id}/follow`)
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('should allow user2 to unfollow user1', async () => {
      // Follow first
      await request(app)
        .post(`/api/users/${user1._id}/follow`)
        .set('Authorization', `Bearer ${token2}`);

      // Now unfollow
      const unfollowRes = await request(app)
        .delete(`/api/users/${user1._id}/follow`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(unfollowRes.status, 200);
      assert.equal(unfollowRes.body.data.isFollowing, false);
      assert.equal(unfollowRes.body.data.followersCount, 0);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users by query', async () => {
      const res = await request(app)
        .get('/api/users/search?q=userone')
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].username, 'userone');
    });
  });
});
