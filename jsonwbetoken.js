import crypto from "crypto";

function base64url(input) {
    return Buffer.from(input)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function sign(data, secret) {
    return base64url(
        crypto.createHmac("sha256", secret).update(data).digest("base64")
    );
}

function generateJWT(payload, secret, expiresInSec = 3600) {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };


    const now = Math.floor(Date.now() / 1000);
    payload = { ...payload, exp: now + expiresInSec };

    const headerEncoded = base64url(JSON.stringify(header));
    const payloadEncoded = base64url(JSON.stringify(payload));
    const data = `${headerEncoded}.${payloadEncoded}`;
    const signature = sign(data, secret);

    return `${data}.${signature}`;
}

// Ejemplo
const secretKey = "mi_super_secreto_123";
const payload = { userId: 123, role: "admin" };

const token = generateJWT(payload, secretKey);
console.log("JWT generado:", token);
