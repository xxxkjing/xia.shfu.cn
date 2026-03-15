import { createHash } from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

function digest(value: string) {
	return createHash("sha256").update(value).digest("hex");
}

export function createAdminToken(username: string, password: string) {
	return digest(`${username}:${password}:xia-admin`);
}

export function verifyAdminToken(token: string, username: string, password: string) {
	const expected = createAdminToken(username, password);
	return token === expected;
}
