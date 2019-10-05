import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as helpers from 'yeoman-test';
import * as assert from 'yeoman-assert';
import * as rimraf from 'rimraf';

let tempdir: string;

describe('ts-console:app', function() {
  this.timeout(60000); // tslint:disable-line
  this.slow(45000); // tslint:disable-line

  beforeEach(done => {
    fs.mkdtemp(
      path.join(os.tmpdir(), 'generator-ts-console-tests-'),
      (err, folder) => {
        if (err) throw err;
        tempdir = folder;
        done();
      },
    );
  });

  afterEach(done => {
    rimraf(tempdir, () => done());
  });

  describe('defaults', () => {
    it('generates a valid application', async () => {
      // ARRANGE

      // ACT
      console.log(`testing in ${tempdir}`);
      await helpers
        .run(__dirname)
        .withOptions({ vscode: false, skipInstall: false })
        .inDir(tempdir);

      // ASSERT
      assert.file(path.join(tempdir, 'src', 'client', 'index.tsx'));

      await new Promise((resolve, reject) => {
        exec(
          'npm run build',
          { cwd: tempdir },
          err => (!!err ? reject(err) : resolve()),
        );
      });

      //   await new Promise((resolve, reject) => {
      //     exec(
      //       'npm t',
      //       { cwd: tempdir },
      //       err => (!!err ? reject(err) : resolve()),
      //     );
      //   });
    });
  });
});
