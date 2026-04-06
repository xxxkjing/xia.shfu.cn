import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

const getAdminCredentials = () => {
	const username = import.meta.env.ADMIN_USERNAME;
	const password = import.meta.env.ADMIN_PASSWORD;

	if (!username || !password) {
		return null;
	}

	return { username, password };
};

const hashValue = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const createSessionToken = () => {
	const credentials = getAdminCredentials();
	if (!credentials) return null;

	return hashValue(`admin:${credentials.username}:${credentials.password}`);
};

export const verifyCredentials = (username: string, password: string) => {
	const credentials = getAdminCredentials();
	if (!credentials) return false;

	return username === credentials.username && password === credentials.password;
};

export const verifySessionToken = (token?: string | null) => {
	if (!token) return false;
	const expected = createSessionToken();
	if (!expected) return false;

	return token === expected;
};
