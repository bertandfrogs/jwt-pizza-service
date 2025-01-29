const stRequest = require("supertest");
const app = require("../../src/service");

let testOrder = { "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }
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
	const getMenuRequest = await stRequest(app).get("/api/order/menu");
	expect(getMenuRequest.statusCode).toBe(200);
})

// needs admin authorization
test("add menu item", async () => {
	
})

test("get orders", async () => {
	
})

test("create order", async () => {
	
})