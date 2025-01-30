const stRequest = require("supertest");
const app = require("../../src/service");
const formatAuthHeader = require("../formatAuthHeader");

const testMenuItem = { "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }
const testOrder = {"franchiseId": 1, "storeId": 1, "items": [{ "menuId": 1, "description": "Veggie", "price": 0.05 }]};
let testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserId;
let testUserAuthToken;

// create new user for this test
beforeAll(async () => {
	testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
	const registerRes = await stRequest(app).post("/api/auth").send(testUser);
	testUserId = registerRes.body.user.id;
	testUserAuthToken = registerRes.body.token;
})

// delete test user
afterAll(async () => {
	// delete test user
	await stRequest(app).delete(`/api/auth/${testUserId}`).set(formatAuthHeader(testUserAuthToken));
})

test("get menu", async () => {
	const getMenuResponse = await stRequest(app).get("/api/order/menu");
	expect(getMenuResponse.statusCode).toBe(200);
})

test("create order", async () => {
	const createResponse = await stRequest(app).post("/api/order/").send(testOrder).set(formatAuthHeader(testUserAuthToken));
	expect(createResponse.statusCode).toBe(200);
})

test("get orders", async () => {
	const getResponse = await stRequest(app).get("/api/order/").set(formatAuthHeader(testUserAuthToken));
	expect(getResponse.statusCode).toBe(200);
})

// needs admin authorization
test("add menu item", async () => {
	
})