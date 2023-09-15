import { describe, expect, it } from "bun:test";

import { Codeowners } from "../src/codeowners";

const repos = new Codeowners();

describe("codeowners", () => {
  it("returns owners for file", () => {
    const owner = repos.getOwner(__filename);
    expect(owner).toEqual(["@noahm"]);
  });

  it("owners is a copy of internal data", () => {
    repos.getOwner(__filename).pop();

    const owner = repos.getOwner(__filename);
    expect(owner).toEqual(["@noahm"]);
  });
});

describe("metadata", () => {
  it("parses metadata", () => {
    const metadata = repos.contactInfo;
    expect(metadata).toMatchSnapshot();
  });
});
