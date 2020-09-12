import * as Generator from 'yeoman-generator';

module.exports = class extends Generator {
  initializing() {
    this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (this.pkg && Object.keys(this.pkg).length) {
      console.log('Found existing package.json:');
      console.log(this.pkg);
    }
  }

  writing() {
    [
      // Root
      '.gitignore',
      '.nycrc',
      '.prettierrc',
      'tsconfig.json',
      'tslint.json',
      'webpack.common.js',
      'webpack.dev.js',
      'webpack.prod.js',
      'Dockerfile',
      '.dockerignore',

      // Client
      'src/client/index.tsx',
      'src/client/registry.ts',

      // Common
      'src/common/custom.d.ts',
      'src/common/entities/index.ts',
      'src/common/router/index.tsx',
      'src/common/pages/app/app.tsx',
      'src/common/pages/app/index.less',
      'src/common/utils/dispatch-lock.tests.ts',
      'src/common/utils/dispatch-lock.ts',
      'src/common/utils/dispatch-monitor.tests.ts',
      'src/common/utils/dispatch-monitor.ts',
      'src/common/utils/index.ts',
      'src/common/types.ts',

      // Server
      'src/server/api/index.ts',
      'src/server/index.ejs',
      'src/server/index.tsx',
      'src/server/page.ts',
      'src/server/registry.ts',
    ].forEach(file => {
      this.fs.copy(
        this.templatePath(file + '.template'),
        this.destinationPath(file),
      );
    });

    this.fs.copyTpl(
      this.templatePath('package.json.template'),
      this.destinationPath('package.json'),
      {
        name: this.pkg.name || 'typescript-application',
        version: this.pkg.version || '0.0.1',
        description:
          this.pkg.description ||
          'Base project for creating a console application in Typescript',
        author: this.pkg.author || '',
        license: this.pkg.license || 'ISC',
      },
    );
  }

  install() {
    this.npmInstall(
      [
        'typescript',
        '@types/node',
        'prettier',
        'tslint',
        'mocha',
        '@types/mocha',
        'chai',
        '@types/chai',
        'sinon',
        '@types/sinon',
        'nyc',
        'ts-node',
        'source-map-support',
      ],
      {
        'save-dev': true,
      },
    );
    this.npmInstall([
      'react@16',
      'redux@4',
      'react-dom',
      'react-redux',
      'redux-thunk',
      'react-router',
      'react-router-dom',
      'express',
      'flux-standard-functions',
      'ts-registry',
      'ejs',
    ]);
    this.npmInstall(
      [
        '@types/react@16',
        '@types/react-dom',
        '@types/react-redux',
        '@types/react-router',
        '@types/react-router-dom',
        '@types/express',
        '@types/ejs',
        'webpack-cli',

        'less',

        // Webpack
        'webpack@4',
        'webpack-merge@4',
        'ts-loader',
        'less-loader',
        'css-loader',
        'json-loader',
        'css-hot-loader',
        'html-webpack-plugin',
        'mini-css-extract-plugin',
        'null-loader',
        'webpack-node-externals',
        'webpack-dev-server',
      ],
      {
        'save-dev': true,
      },
    );
  }

  private pkg: {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
  };
};
