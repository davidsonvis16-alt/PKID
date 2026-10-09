// Creates a P-256 signing key for identity QRs and writes it to .env.local.
// Run once: npm run keygen. Keep the key secret; anyone holding it can issue QRs.
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const b64 = Buffer.from(pem).toString("base64");

const file = ".env.local";
let env = existsSync(file) ? readFileSync(file, "utf8") : "";
const set = (k, v) => {
  const line = `${k}=${v}`;
  env = new RegExp(`^${k}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${k}=.*$`, "m"), line) : env + (env.endsWith("\n") || !env ? "" : "\n") + line + "\n";
};
set("QR_SIGNING_KEY", b64);
if (!/^SESSION_SECRET=/m.test(env)) set("SESSION_SECRET", randomBytes(32).toString("hex"));
if (!/^STAFF_PIN=/m.test(env)) set("STAFF_PIN", "2468");
writeFileSync(file, env);
console.log("Wrote QR_SIGNING_KEY to .env.local. Existing QRs signed with an older key will stop verifying.");
