/* global describe it expect */
import Codeowners from './codeowners.mjs';

const repos = new Codeowners();

describe('codeowners', () => {
  it('returns owners for this file', () => {
    const owner = repos.getOwner('codeowners.test.mjs');
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
    repos.getOwner('codeowners.test.mjs').pop();

    const owner = repos.getOwner('codeowners.test.mjs');
    expect(owner).toEqual(['@beaugunderson']);
  });
});
