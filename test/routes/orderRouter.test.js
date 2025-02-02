const stRequest = require("supertest");
const app = require("../../src/service");
const formatAuthHeader = require("../formatAuthHeader");
const createAdminUser = require("../createAdminUser");
const randomName = require("../randomName");

const testMenuItem = { "title": randomName(), "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }
const testOrder = {"franchiseId": 1, "storeId": 1, "items": [{ "menuId": 1, "description": "Veggie", "price": 0.05 }]};
let testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserId;
let adminUserId;
let adminAuthToken;
let testUserAuthToken;

// create new user for this test
beforeAll(async () => {
	// create normal user
	testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
	const registerRes = await stRequest(app).post("/api/auth").send(testUser);
	testUserId = registerRes.body.user.id;
	testUserAuthToken = registerRes.body.token;

	// create admin user
	const adminUser = await createAdminUser();
	adminUserId = adminUser.id;
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

test("get menu", async () => {
	const getMenuResponse = await stRequest(app).get("/api/order/menu");
	expect(getMenuResponse.statusCode).toBe(200);
	expect(getMenuResponse.body).not.toBeNull();
})

test("create order", async () => {
	const createResponse = await stRequest(app).post("/api/order/").send(testOrder).set(formatAuthHeader(testUserAuthToken));
	expect(createResponse.statusCode).toBe(200);
	expect(createResponse.body.order).toMatchObject(testOrder);
})

test("get orders", async () => {
	const getResponse = await stRequest(app).get("/api/order/").set(formatAuthHeader(testUserAuthToken));
	expect(getResponse.statusCode).toBe(200);
})

test("add menu item", async () => {
	// needs admin authorization, use adminAuthToken
	const addMenuResponse = await stRequest(app).put("/api/order/menu").send(testMenuItem).set(formatAuthHeader(adminAuthToken));
	expect(addMenuResponse.statusCode).toBe(200);
})

test("add menu item without authorization", async () => {
	const addMenuResponse = await stRequest(app).put("/api/order/menu").send(testMenuItem).set(formatAuthHeader(testUserAuthToken));
	expect(addMenuResponse.statusCode).toBe(403);
	expect(addMenuResponse.body).toMatchObject({ message: 'not authorized to add menu item' });
})