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

  it('allows definition of minimum owners requiring approval', () => {
    const owner = repos.getOwner('index.mjs');
    expect(owner).toEqual(['@example-section-owner', '@beaugunderson']);
  });

  it('allows inline comments', () => {
    const owner = repos.getOwner('package-lock.json');
    expect(owner).toEqual(['@example-inline-comment-owner', '@beaugunderson']);
  });

  it('allows paths with spaces', () => {
    const owner = repos.getOwner('a path with spaces/and subdirectories/index.mjs');
    expect(owner).toEqual(['@beaugunderson', '@jasonsperske']);
  });

  it('owners is a copy of internal data', () => {
    repos.getOwner('codeowners.test.mjs').pop();

    const owner = repos.getOwner('codeowners.test.mjs');
    expect(owner).toEqual(['@beaugunderson']);
  });
});
