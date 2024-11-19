import { Project } from 'fixturify-project';
import { join } from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { execa } from 'execa';

const cliPath = join(__dirname, 'cli.js');

describe('cli', () => {
  let project;

  beforeAll(async () => {
    project = new Project({
      files: {
        CODEOWNERS: `*.js @beaugunderson
tests/ @mansona`,
        'index.js': '// a default file',
        tests: {
          'index.js': '// a default test file',
        },
      },
    });
    await project.write();
  });

  describe('audit', () => {
    it('audits the files', async () => {
      const result = await execa({ cwd: project.baseDir })`${cliPath} audit`;

      expect(result.exitCode).to.equal(0);
      expect(result.stdout).to.toMatchInlineSnapshot(`
        "CODEOWNERS                          nobody
        index.js                            @beaugunderson
        package.json                        nobody
        tests                               nobody
        tests/index.js                      @mansona"
      `);
    });

    it('audits the files with --unowned', async () => {
      const result = await execa({ cwd: project.baseDir })`${cliPath} audit --unowned`;

      expect(result.exitCode).to.equal(0);
      expect(result.stdout).to.toMatchInlineSnapshot(`
        "CODEOWNERS
        package.json
        tests"
      `);
    });
  });

  describe('verify', () => {
    it('verifies codeowners for a path', async () => {
      const result = await execa({
        cwd: project.baseDir,
      })`${cliPath} verify index.js @beaugunderson`;

      expect(result.exitCode).to.equal(0);
      expect(result.stdout).to.toMatchInlineSnapshot(`"index.js    @beaugunderson"`);
    });

    it('shows an error if you pass the wrong user', async () => {
      let result;
      try {
        result = await execa({ cwd: project.baseDir })`${cliPath} verify index.js @mansona`;
      } catch (error) {
        expect(error.exitCode).to.equal(1);
        expect(error.stderr).to.toMatchInlineSnapshot(
          `"None of the users/teams specified own the path index.js"`
        );
        expect(error.stdout).to.be.empty;
      }

      // this verifies that the command actually failed and we hit the try/catch above
      expect(result).to.be.undefined;
    });
  });

  describe('list', () => {
    it('shows the codeowner for a file', async () => {
      const result = await execa({
        cwd: project.baseDir,
      })`${cliPath} list index.js`;

      expect(result.exitCode).to.equal(0);
      expect(result.stdout).to.toMatchInlineSnapshot(`"@beaugunderson"`);
    });
  });
});
