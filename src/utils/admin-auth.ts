import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

const encoder = new TextEncoder();

const toBase64Url = (value: string) => Buffer.from(value, "utf-8").toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf-8");

function getSigningSecret(env: Record<string, string | undefined>) {
	return env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || "fallback-admin-secret";
}

function sign(payload: string, env: Record<string, string | undefined>) {
	return createHmac("sha256", getSigningSecret(env)).update(payload).digest("base64url");
}

export function createAdminSession(username: string, env: Record<string, string | undefined>, maxAge = 60 * 60 * 8) {
	const exp = Date.now() + maxAge * 1000;
	const payload = `${username}.${exp}`;
	const sig = sign(payload, env);
	return `${toBase64Url(payload)}.${sig}`;
}

export function verifyAdminSession(token: string | undefined, env: Record<string, string | undefined>) {
	if (!token) return false;

	const [encodedPayload, signature] = token.split(".");
	if (!encodedPayload || !signature) return false;

	let payload = "";
	try {
		payload = fromBase64Url(encodedPayload);
	} catch {
		return false;
	}

	const expected = sign(payload, env);
	const signatureBuffer = encoder.encode(signature);
	const expectedBuffer = encoder.encode(expected);
	if (signatureBuffer.length !== expectedBuffer.length) return false;
	if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

	const [username, expString] = payload.split(".");
	if (!username || !expString) return false;
	if (username !== env.ADMIN_USERNAME) return false;

	const expiresAt = Number(expString);
	if (!Number.isFinite(expiresAt)) return false;
	if (Date.now() > expiresAt) return false;

	return true;
}
