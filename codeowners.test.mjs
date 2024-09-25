/* global describe it expect */
import path from 'path';
import { fileURLToPath } from 'url';
import Codeowners from './codeowners.mjs';

const repos = new Codeowners();
// eslint-disable-next-line no-underscore-dangle
const __filename = ((metaUrl) => {
  const filename = fileURLToPath(metaUrl);
  const dirname = path.dirname(filename);
  return filename.substring(dirname.length + 1);
})(import.meta.url);

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
