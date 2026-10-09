import "server-only";
import { ageOn, fullName } from "./format";
import { snapshot } from "./registry";

/** Example people to click instead of scanning a real QR. Remove in production. */
export async function samplePeople() {
  const { residents } = await snapshot();
  return residents.map((r) => ({ uin: r.uin, name: fullName(r), age: ageOn(r.dob), token: r.token }));
}
