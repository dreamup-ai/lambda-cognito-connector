import { expect } from "chai";
import sinon from "sinon";
import { handler } from "../src/index";
import crypto from "node:crypto";
import payload from "./fixtures/payload.json";
import assert from "node:assert";

const {
  NEW_USER_ENDPOINT,
  NEW_USER_PUBLIC_KEY,
  NEW_USER_PRIVATE_KEY,
  SIGNATURE_HEADER,
} = process.env;

assert(NEW_USER_ENDPOINT, "NEW_USER_ENDPOINT is required");
assert(NEW_USER_PUBLIC_KEY, "NEW_USER_PUBLIC_KEY is required");
assert(NEW_USER_PRIVATE_KEY, "NEW_USER_PRIVATE_KEY is required");
assert(SIGNATURE_HEADER, "SIGNATURE_HEADER is required");

const rawPrivateKey = Buffer.from(NEW_USER_PRIVATE_KEY, "base64");
const privateKey = crypto.createPrivateKey(rawPrivateKey);
const rawPublicKey = Buffer.from(NEW_USER_PUBLIC_KEY, "base64");
const publicKey = crypto.createPublicKey(rawPublicKey);

function sign(payload: string) {
  const signature = crypto.sign("sha256", Buffer.from(payload), privateKey);
  return signature.toString("base64");
}

function verify(payload: string, signature: string) {
  const verified = crypto.verify(
    "sha256",
    Buffer.from(payload),
    publicKey,
    Buffer.from(signature, "base64")
  );
  return verified;
}

const sandbox = sinon.createSandbox();

describe("handler", () => {
  let fetchStub: sinon.SinonStub;
  beforeEach(() => {
    sandbox.restore();
    fetchStub = sandbox.stub(global, "fetch").resolves();
  });

  it("should call fetch with the correct arguments", async () => {
    await handler(payload);
    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.firstCall.args[0]).to.equal(NEW_USER_ENDPOINT);
    expect(fetchStub.firstCall.args[1]).to.deep.equal({
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        [SIGNATURE_HEADER]: sign(JSON.stringify(payload)),
      },
    });

    const signature = fetchStub.firstCall.args[1].headers[SIGNATURE_HEADER];
    expect(verify(JSON.stringify(payload), signature)).to.be.true;
  });
});
