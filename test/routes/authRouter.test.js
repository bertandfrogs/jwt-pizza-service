const stRequest = require("supertest");
const app = require("../../src/service");

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await stRequest(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
});

test('login', async () => {
  const loginResponse = await stRequest(app).put('/api/auth').send(testUser);
  expect(loginResponse.status).toBe(200);
  expectValidJwt(loginResponse.body.token);

  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginResponse.body.user).toMatchObject(expectedUser);
});

test('register', async () => {
	const registerResponse = await stRequest(app).post('/api/auth').send(testUser);
	expect(registerResponse.status).toBe(200);
	expectValidJwt(registerResponse.body.token);
  
	const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
	delete expectedUser.password;
	expect(registerResponse.body.user).toMatchObject(expectedUser);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}