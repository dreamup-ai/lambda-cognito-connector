import fs from "node:fs";

const privateKey = fs.readFileSync("test/fixtures/cognito_key", "base64");
const publicKey = fs.readFileSync("test/fixtures/cognito_key.pub", "base64");

Object.assign(process.env, {
  NEW_USER_ENDPOINT: "http://localhost:3000/user/cognito",
  NEW_USER_PRIVATE_KEY: privateKey,
  NEW_USER_PUBLIC_KEY: publicKey,
  SIGNATURE_HEADER: "X-Testing-Signature",
});
