const { DB } = require("../src/database/database.js");
const { Role } = require("../src/model/model.js");
const randomName = require("./randomName.js");

async function createAdminUser() {
	let user = {
		name: "a",
		email: "a",
		password: "toomanysecrets",
		roles: [{ role: Role.Admin }],
	};
	user.name = randomName();
	user.email = user.name + "@admin.com";

	const addedUser = await DB.addUser(user);
	user.password = "toomanysecrets";

	return { ...user, id: addedUser.id };
}

module.exports = createAdminUser;
