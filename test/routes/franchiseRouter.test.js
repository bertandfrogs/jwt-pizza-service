const stRequest = require("supertest");
const app = require("../../src/service");
const formatAuthHeader = require("../formatAuthHeader");
const createAdminUser = require("../createAdminUser");
const randomName = require("../randomName");

let testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
const testFranchise = { name: "", admins: [{ id: 0, email: "" }]};
const testStore = { franchiseId: 1, name: ""};
let testFranchiseId;
let testStoreId;
let testUserId;
let adminUserId;
let adminAuthToken;
let testUserAuthToken;

// create new user for this test
beforeAll(async () => {
	// create normal user
	const random = randomName();
	testUser.email = random + "@test.com";
	testFranchise.name = random;
	testStore.name = random;
	const registerRes = await stRequest(app).post("/api/auth").send(testUser);
	testUserId = registerRes.body.user.id;
	testUserAuthToken = registerRes.body.token;
	
	// create admin user
	const adminUser = await createAdminUser();
	adminUserId = adminUser.id;
	testFranchise.admins[0].email = adminUser.email;
	testFranchise.admins[0].id = adminUserId;
	delete adminUser.id;
	delete adminUser.roles;

	// log in admin user
	const loginResponse = await stRequest(app).put("/api/auth").send(adminUser);
	adminAuthToken = loginResponse.body.token;
})

afterAll(async () => {
	// delete test user
	await stRequest(app).delete(`/api/auth/${testUserId}`).set(formatAuthHeader(testUserAuthToken));
	// delete admin user
	await stRequest(app).delete(`/api/auth/${adminUserId}`).set(formatAuthHeader(adminAuthToken));
})

test("get franchises", async () => {
	const getFran = await stRequest(app).get("/api/franchise");
	expect(getFran.statusCode).toBe(200);
	expect(getFran.body).not.toBeNull();
})

test("normal user cannot create franchise", async () => {
	const createFran = await stRequest(app).post("/api/franchise").send(testFranchise).set(formatAuthHeader(testUserAuthToken));
	expect(createFran.statusCode).toBe(403);
	expect(createFran.body).toMatchObject({ message: 'unable to create a franchise' });
})

test("create franchise", async () => {
	const createFran = await stRequest(app).post("/api/franchise").send(testFranchise).set(formatAuthHeader(adminAuthToken));
	expect(createFran.statusCode).toBe(200);
	testFranchiseId = createFran.body.id;
	testStore.franchiseId = testFranchiseId;
})

test("normal user cannot create a store", async () => {
	const createFran = await stRequest(app).post(`/api/franchise/${testFranchiseId}/store`).send(testStore).set(formatAuthHeader(testUserAuthToken));
	expect(createFran.statusCode).toBe(403);
	expect(createFran.body).toMatchObject({ message: 'unable to create a store' });
})

test("create a store", async () => {
	const createFran = await stRequest(app).post(`/api/franchise/${testFranchiseId}/store`).send(testStore).set(formatAuthHeader(adminAuthToken));
	expect(createFran.statusCode).toBe(200);
	testStoreId = createFran.body.id;
})

test("normal user cannot delete a store", async () => {
	const createFran = await stRequest(app).delete(`/api/franchise/${testFranchiseId}/store/${testStoreId}`).set(formatAuthHeader(testUserAuthToken));
	expect(createFran.statusCode).toBe(403);
	expect(createFran.body).toMatchObject({ message: 'unable to delete a store' });
})

test("delete a store", async () => {
	const createFran = await stRequest(app).delete(`/api/franchise/${testFranchiseId}/store/${testStoreId}`).set(formatAuthHeader(adminAuthToken));
	expect(createFran.statusCode).toBe(200);
})

test("normal user cannot delete franchise", async () => {
	const deleteFran = await stRequest(app).delete(`/api/franchise/${testFranchiseId}`).send(testFranchise).set(formatAuthHeader(testUserAuthToken));
	expect(deleteFran.statusCode).toBe(403);
	expect(deleteFran.body).toMatchObject({ message: 'unable to delete a franchise' });
})

test("delete franchise", async () => {
	const deleteFran = await stRequest(app).delete(`/api/franchise/${testFranchiseId}`).send(testFranchise).set(formatAuthHeader(adminAuthToken));
	expect(deleteFran.statusCode).toBe(200);
	expect(deleteFran.body).toMatchObject({ message: 'franchise deleted' });
})