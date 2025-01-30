const stRequest = require("supertest");
const app = require("../../src/service");
const formatAuthHeader = require("../formatAuthHeader");

let testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let registerRes;
let testUserId;
let testUserAuthToken;

// register a user to use in all tests
beforeAll(async () => {
	testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
	registerRes = await stRequest(app).post("/api/auth").send(testUser);
	testUserId = registerRes.body.user.id;
	testUserAuthToken = registerRes.body.token;
	expectValidJwt(testUserAuthToken);
});

afterAll(async () => {
	// delete test user
	const deleteResponse = await stRequest(app).delete(`/api/auth/${testUserId}`).set(formatAuthHeader(testUserAuthToken));
	expect(deleteResponse.statusCode).toBe(200);
	expect(deleteResponse.body).toMatchObject({ message: 'user deletion successful' });

	// check that the user was deleted properly
	const loginAfterDeletion = await stRequest(app).put("/api/auth").send(testUser);
	expect(loginAfterDeletion.status).toBe(404);
});

test("register user", async () => {
	const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
	delete expectedUser.password;
	expect(registerRes.body.user).toMatchObject(expectedUser);
});

test("register invalid user", async () => {
	const invalidUser = { name: "a", email: "asdf@test.com" };
	const register = await stRequest(app).post("/api/auth").send(invalidUser);
	
	expect(register.statusCode).toBe(400);
});

test("update", async () => {
	let modifiedTestUser = { ...testUser };
	modifiedTestUser.password = "asdfasdf";
	testUser.name = "updated";
	const updateResponse = await stRequest(app).put(`/api/auth/${testUserId}`).send(modifiedTestUser).set(formatAuthHeader(testUserAuthToken));
	expect(updateResponse.statusCode).toBe(200);
	
	const oldUser = { ...testUser, roles: [{ role: "diner" }] };
	delete oldUser.password;
	expect(updateResponse.body).not.toMatchObject(oldUser);

	const expectedUser = { ...modifiedTestUser, roles: [{ role: "diner" }] };
	delete expectedUser.password;
	expect(updateResponse.body).toMatchObject(expectedUser);

	testUser = modifiedTestUser;
});

test("logout invalid auth token", async () => {
	const logoutResponse = await stRequest(app).delete("/api/auth").set(formatAuthHeader("asdfasdf"));
	expect(logoutResponse.statusCode).toBe(401);
	expect(logoutResponse.body).toMatchObject({ message: 'unauthorized' });
});

test("delete without authorization", async () => {
	const deleteResponse = await stRequest(app).delete(`/api/auth/${testUserId + 1}`).set(formatAuthHeader(testUserAuthToken));
	expect(deleteResponse.statusCode).toBe(403);
	expect(deleteResponse.body).toMatchObject({ message: 'unauthorized' });
})

test("logout deleted auth token", async () => {
	// logout valid token
	const logoutResponse = await stRequest(app).delete("/api/auth").set(formatAuthHeader(testUserAuthToken));
	expect(logoutResponse.statusCode).toBe(200);
	expect(logoutResponse.body).toMatchObject({ message: 'logout successful' });
	
	// try to logout again with the same token
	const logoutResponse2 = await stRequest(app).delete("/api/auth").set(formatAuthHeader(testUserAuthToken));
	expect(logoutResponse2.statusCode).toBe(401);
	expect(logoutResponse2.body).toMatchObject({ message: 'unauthorized' });
});


test("login", async () => {
	const loginResponse = await stRequest(app).put("/api/auth").send(testUser);
	expect(loginResponse.status).toBe(200);
	expectValidJwt(loginResponse.body.token);
	testUserAuthToken = loginResponse.body.token;

	const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
	delete expectedUser.password;
	expect(loginResponse.body.user).toMatchObject(expectedUser);
});

// ------------------- Helper Functions -------------------

function expectValidJwt(potentialJwt) {
	expect(potentialJwt).toMatch(
		/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
	);
}