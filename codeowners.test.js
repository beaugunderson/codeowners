/* global describe it expect */
const Codeowners = require('./codeowners.js');

const repos = new Codeowners();

describe('codeowners', () => {
  it(`returns owners for ${__filename}`, () => {
    const owner = repos.getOwner(__filename);
    expect(owner).toEqual(['@beaugunderson']);
  });

  it('returns owners by combining default owners', () => {
    const owner = repos.getOwner('README.md');
    expect(owner).toEqual(['@jasonsperske', '@beaugunderson']);
  });

  it('returns owners by combining root level owners', () => {
    const owner = repos.getOwner('package.json');
    expect(owner).toEqual(['@example', '@beaugunderson']);
  });

  it('owners is a copy of internal data', () => {
    repos.getOwner(__filename).pop();

    const owner = repos.getOwner(__filename);
    expect(owner).toEqual(['@beaugunderson']);
  });
});
