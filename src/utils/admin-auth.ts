const encoder = new TextEncoder();

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function toBase64Url(input: Uint8Array): string {
	const base64 = Buffer.from(input).toString("base64");
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
	const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
	const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
	return new Uint8Array(Buffer.from(`${normalized}${padding}`, "base64"));
}

async function sign(payload: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
	return toBase64Url(new Uint8Array(signature));
}

export function getAdminEnv() {
	const username = import.meta.env.ADMIN_USERNAME;
	const password = import.meta.env.ADMIN_PASSWORD;
	if (!username || !password) return null;
	return { username, password };
}

export function getSessionCookieName() {
	return SESSION_COOKIE;
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
	const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
	const payload = `${username}.${exp}`;
	const signature = await sign(payload, secret);
	return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
	const parts = token.split(".");
	if (parts.length !== 3) return false;
	const [username, expRaw, signature] = parts;
	if (!username || !expRaw || !signature) return false;
	const exp = Number(expRaw);
	if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
	const expected = await sign(`${username}.${expRaw}`, secret);
	const left = fromBase64Url(signature);
	const right = fromBase64Url(expected);
	if (left.length !== right.length) return false;
	let result = 0;
	for (let i = 0; i < left.length; i++) result |= left[i] ^ right[i];
	return result === 0;
}

export function getSessionMaxAge() {
	return SESSION_TTL_SECONDS;
}
