import * as Generator from 'yeoman-generator';
import * as pluralize from 'pluralize';

import { addEntity, addToServiceIndex, addToRegistry } from './utils';

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { type: String, required: true });
  }

  writing() {
    const cases = getCases(this.options['name']);

    const camel = cases.singular.camel;
    const camelPlural = cases.plural.camel;
    const kabab = cases.singular.kabab;
    const kababPlural = cases.plural.kabab;
    const pascal = cases.singular.pascal;
    const screamingSnake = cases.singular.screamingSnake;
    const namespace = cases.plural.screamingSnake.split('_').join('');

    this.fs.copyTpl(
      this.templatePath('action-types.template'),
      this.destinationPath(
        `src/common/entities/${kababPlural}/action-types.ts`,
      ),
      { camel, pascal, screamingSnake, namespace },
    );

    this.fs.copyTpl(
      this.templatePath('actions.template'),
      this.destinationPath(`src/common/entities/${kababPlural}/actions.ts`),
      { camel, camelPlural, kabab, kababPlural, pascal, screamingSnake },
    );

    this.fs.copyTpl(
      this.templatePath('index.template'),
      this.destinationPath(`src/common/entities/${kababPlural}/index.ts`),
      { camel, camelPlural, kabab, kababPlural, pascal, screamingSnake },
    );

    this.fs.copyTpl(
      this.templatePath('interfaces.template'),
      this.destinationPath(`src/common/entities/${kababPlural}/interfaces.ts`),
      { camel, camelPlural, kabab, kababPlural, pascal, screamingSnake },
    );

    this.fs.copyTpl(
      this.templatePath('reducer.template'),
      this.destinationPath(`src/common/entities/${kababPlural}/reducer.ts`),
      { camel, camelPlural, kabab, kababPlural, pascal, screamingSnake },
    );

    this.fs.copyTpl(
      this.templatePath('types.template'),
      this.destinationPath(`src/common/entities/${kababPlural}/types.ts`),
      { camel, camelPlural, kabab, kababPlural, pascal, screamingSnake },
    );

    this.fs.copyTpl(
      this.templatePath('service.template'),
      this.destinationPath(`src/client/services/client-${kabab}-service.ts`),
      { camel, kabab, kababPlural, pascal, scope: 'Client' },
    );

    this.fs.copyTpl(
      this.templatePath('service.template'),
      this.destinationPath(`src/server/services/server-${kabab}-service.ts`),
      { camel, kabab, kababPlural, pascal, scope: 'Server' },
    );

    this.fs.write(
      this.destinationPath('src/common/entities/index.ts'),
      addEntity(
        this.fs.read(this.destinationPath('src/common/entities/index.ts')),
        camel,
        camelPlural,
        kababPlural,
        pascal,
      ),
    );

    this.fs.write(
      this.destinationPath('src/client/services/index.ts'),
      addToServiceIndex(
        this.fs.exists(this.destinationPath('src/client/services/index.ts'))
          ? this.fs.read(this.destinationPath('src/client/services/index.ts'))
          : '',
        true,
        kabab,
        pascal,
      ),
    );

    this.fs.write(
      this.destinationPath('src/client/registry.ts'),
      addToRegistry(
        this.fs.read(this.destinationPath('src/client/registry.ts')),
        true,
        kabab,
        pascal,
      ),
    );

    this.fs.write(
      this.destinationPath('src/server/services/index.ts'),
      addToServiceIndex(
        this.fs.exists(this.destinationPath('src/server/services/index.ts'))
          ? this.fs.read(this.destinationPath('src/server/services/index.ts'))
          : '',
        false,
        kabab,
        pascal,
      ),
    );

    this.fs.write(
      this.destinationPath('src/server/registry.ts'),
      addToRegistry(
        this.fs.read(this.destinationPath('src/server/registry.ts')),
        false,
        kabab,
        pascal,
      ),
    );
  }
}

function getCases(input: string) {
  const words = [];
  let word = '';

  for (let i = 0; i < input.length; i++) {
    const last = i > 0 && input[i - 1];
    const c = input[i];
    if (i === 0) {
      if (isChar(c)) word += c;
    } else if (!isChar(c)) {
      if (word) {
        words.push(word);
        word = '';
      }
    } else if (isLower(last) && isUpper(c)) {
      if (word) {
        words.push(word);
      }
      word = c;
    } else {
      word += c;
    }
  }

  if (word) words.push(word);

  const singular = words
    .slice(0, words.length - 1)
    .concat([pluralize.singular(words[words.length - 1])]);

  const plural = words
    .slice(0, words.length - 1)
    .concat([pluralize.plural(words[words.length - 1])]);

  return {
    singular: {
      camel: singular.map((w, i) => (i ? upper(w) : w.toLowerCase())).join(''),
      pascal: singular.map(upper).join(''),
      kabab: singular.map(w => w.toLowerCase()).join('-'),
      screamingSnake: singular.map(w => w.toUpperCase()).join('_'),
    },
    plural: {
      camel: plural.map((w, i) => (i ? upper(w) : w.toLowerCase())).join(''),
      pascal: plural.map(upper).join(''),
      kabab: plural.map(w => w.toLowerCase()).join('-'),
      screamingSnake: plural.map(w => w.toUpperCase()).join('_'),
    },
  };
}

function upper(word: string) {
  return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
}

function isChar(c: string) {
  return c && c.toUpperCase() !== c.toLowerCase();
}

function isUpper(c: string) {
  return c && c === c.toUpperCase();
}

function isLower(c: string) {
  return c && c === c.toLowerCase();
}
