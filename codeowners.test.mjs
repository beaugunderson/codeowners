/* global describe it expect */
import Codeowners from './codeowners.mjs';

const repos = new Codeowners();

describe('codeowners', () => {
  it('returns owners for a file defined outside of a section', () => {
    const owner = repos.getOwner('codeowners.test.mjs');
    expect(owner).toEqual(['@beaugunderson']);
  });

  it('overrides default owners with section owners', () => {
    const owner = repos.getOwner('README.md');
    expect(owner).toEqual(['@jasonsperske']);
  });

  it('should combine orphaned files in a section with any root level owners', () => {
    const owner = repos.getOwner('orphaned-file.md');
    expect(owner).toEqual(['@beaugunderson']);
  })

  it('overrides owners defined in a file inside of an ownerless section', () => {
    const owner = repos.getOwner('package.json');
    expect(owner).toEqual(['@example']);
  });

  it('allows definition of minimum owners requiring approval', () => {
    const owner = repos.getOwner('index.mjs');
    expect(owner).toEqual(['@example-section-owner']);
  });

  it('allows inline comments', () => {
    const owner = repos.getOwner('package-lock.json');
    expect(owner).toEqual(['@example-inline-comment-owner']);
  });

  it('allows paths with spaces', () => {
    const owner = repos.getOwner('a path with spaces/and subdirectories/index.mjs');
    expect(owner).toEqual(['@beaugunderson', '@jasonsperske']);
  });

  it('allows a group to be overridden', () => {
    const ownerOfDefault = repos.getOwner('codeowners.d.ts');
    expect(ownerOfDefault).toEqual(['@example-override-group-owner']);
    const ownerOverridden = repos.getOwner('codeowners.mjs');
    expect(ownerOverridden).toEqual(['@example-override-file-owner']);
  });

  it('owners is a copy of internal data', () => {
    repos.getOwner('codeowners.test.mjs').pop();

    const owner = repos.getOwner('codeowners.test.mjs');
    expect(owner).toEqual(['@beaugunderson']);
  });
});
