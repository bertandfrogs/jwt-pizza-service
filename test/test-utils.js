function formatAuthHeader(authToken) {
	return { 'Authorization': 'Bearer ' + authToken };
}

module.exports = formatAuthHeader;