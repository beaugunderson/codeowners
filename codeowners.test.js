/* global describe it expect */
const Codeowners = require('./codeowners.js');

const repos = new Codeowners();

describe('codeowners', () => {
  it('returns owners for file', () => {
    const owner = repos.getOwner(__filename);
    expect(owner).toEqual(['@beaugunderson']);
  });

  it('owners is a copy of internal data', () => {
    repos.getOwner(__filename).pop();

    const owner = repos.getOwner(__filename);
    expect(owner).toEqual(['@beaugunderson']);
  });

  it('respects inline comments', () => {
    expect(repos.ownerEntries[0].comment).toEqual(" I own the whole project!")
  });
});
