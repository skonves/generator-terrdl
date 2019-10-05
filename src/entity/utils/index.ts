import { readFileSync } from 'fs';
import * as ts from 'typescript';
import * as prettier from 'prettier';

export function addToRegistry(
  fileText: string,
  isClient: boolean,
  kabab: string,
  pascal: string,
) {
  const sourceFile = ts.createSourceFile(
    'index.ts',
    fileText,
    ts.ScriptTarget.ES2015,
    true,
  );

  const replacements = [
    getRegistryReplacement(sourceFile, isClient, kabab, pascal),
    getRegistryImportReplacement(sourceFile, isClient, kabab, pascal),
  ];

  const text = replacements
    .sort((a, b) => b.start - a.start)
    .reduce(
      (acc, replacement) =>
        acc.slice(0, replacement.start) +
        replacement.text +
        acc.slice(replacement.end),
      sourceFile.text,
    );

  return prettier.format(text, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });
}

function getRegistryReplacement(
  sourceFile: ts.SourceFile,
  isClient: boolean,
  kabab: string,
  pascal: string,
): Replacement {
  const serviceKey = `${kabab}-service`;
  const serviceName = `${isClient ? 'Client' : 'Server'}${pascal}Service`;

  let insertAt = sourceFile.end;

  for (const node of traverse(sourceFile)) {
    if (ts.isExpressionStatement(node)) {
      const contents = Array.from(traverse(node));

      const identifiers = contents.filter(ts.isIdentifier);

      if (
        identifiers.length === 4 &&
        identifiers[0].getText() === 'registry' &&
        identifiers[1].getText() === 'for' &&
        identifiers[2].getText() === 'use'
      ) {
        insertAt = node.getEnd();
        const forCall = identifiers[1];

        const stringLiteral = Array.from(traverse(forCall.parent.parent)).find(
          ts.isStringLiteral,
        );

        const lastIsNewExp = ts.isNewExpression(identifiers[3].parent);

        if (
          stringLiteral.getText() === `'${serviceKey}'` &&
          lastIsNewExp &&
          identifiers[3].getText() === serviceName
        ) {
          return { text: '', start: 0, end: 0 };
        }
      }
    }
  }

  return {
    text: `\n\nregistry.for('${serviceKey}').use(()=> new ${serviceName}())`,
    start: insertAt,
    end: insertAt,
  };
}

function getRegistryImportReplacement(
  sourceFile: ts.SourceFile,
  isClient: boolean,
  kabab: string,
  pascal: string,
): Replacement {
  const serviceName = `${isClient ? 'Client' : 'Server'}${pascal}Service`;

  let lastImportEnd = 0;

  for (const node of traverse(sourceFile)) {
    if (ts.isImportDeclaration(node)) {
      lastImportEnd = node.getEnd();
      const contents = Array.from(traverse(node));

      const module = contents.find(ts.isStringLiteral);
      const services = new Set(
        contents.filter(ts.isIdentifier).map(x => x.getText()),
      );

      if (module.getText() !== "'./services'") continue;

      if (services.has(serviceName)) continue;

      const syntaxList = contents.find(isSyntaxList);

      services.add(serviceName);

      return {
        text: Array.from(services)
          .sort((a, b) => a.localeCompare(b))
          .join(', '),
        start: syntaxList.getStart(),
        end: syntaxList.getEnd(),
      };
    }
  }

  return {
    text: `import { ${serviceName} } from './services';`,
    start: lastImportEnd,
    end: lastImportEnd,
  };
}

export function addToRegistryTypeMap(
  fileText: string,
  kabab: string,
  kababPlural: string,
  pascal: string,
) {
  const sourceFile = ts.createSourceFile(
    'index.ts',
    fileText,
    ts.ScriptTarget.ES2015,
    true,
  );

  const replacements = [
    getRegistryTypeMapReplacement(sourceFile, kabab, pascal),
    getRegistryTypeMapImportReplacement(sourceFile, kababPlural, pascal),
  ];

  const text = replacements
    .filter(x => x)
    .sort((a, b) => b.start - a.start)
    .reduce(
      (acc, replacement) =>
        acc.slice(0, replacement.start) +
        replacement.text +
        acc.slice(replacement.end),
      sourceFile.text,
    );

  return prettier.format(text, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });
}

function getRegistryTypeMapReplacement(
  sourceFile: ts.SourceFile,
  kabab: string,
  pascal: string,
): Replacement {
  const serviceKey = `${kabab}-service`;
  const interfaceName = `I${pascal}Service`;

  for (const typeReferenceNode of traverse(sourceFile)) {
    if (ts.isTypeReferenceNode(typeReferenceNode)) {
      let isGenericRegistry = false;
      for (const identifier of traverse(typeReferenceNode)) {
        if (
          ts.isIdentifier(identifier) &&
          identifier.getText() === 'GenericRegistry'
        ) {
          isGenericRegistry = true;
          break;
        }
      }

      if (isGenericRegistry) {
        for (const typeLiteralNode of traverse(typeReferenceNode)) {
          if (ts.isTypeLiteralNode(typeLiteralNode)) {
            for (const syntaxListNode of traverse(typeLiteralNode)) {
              if (isSyntaxList(syntaxListNode)) {
                const text = syntaxListNode.getText().trim();
                return {
                  text:
                    (text.length && !text.endsWith(',') && !text.endsWith(';')
                      ? ','
                      : '') + `'${serviceKey}': ${interfaceName}`,
                  start: syntaxListNode.getEnd(),
                  end: syntaxListNode.getEnd(),
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
}

function getRegistryTypeMapImportReplacement(
  sourceFile: ts.SourceFile,
  kababPlural: string,
  pascal: string,
): Replacement {
  const interfaceName = `I${pascal}Service`;

  let lastImportEnd = 0;

  for (const node of traverse(sourceFile)) {
    if (ts.isImportDeclaration(node)) {
      lastImportEnd = node.getEnd();
      const contents = Array.from(traverse(node));

      const module = contents.find(ts.isStringLiteral);
      const interfaces = new Set(
        contents.filter(ts.isIdentifier).map(x => x.getText()),
      );

      if (module.getText() !== `'./entities/${kababPlural}'`) continue;

      if (interfaces.has(interfaceName)) continue;

      const syntaxList = contents.find(isSyntaxList);

      interfaces.add(interfaceName);

      return {
        text: Array.from(interfaces)
          .sort((a, b) => a.localeCompare(b))
          .join(', '),
        start: syntaxList.getStart(),
        end: syntaxList.getEnd(),
      };
    }
  }

  return {
    text: `import { ${interfaceName} } from './entities/${kababPlural}';`,
    start: lastImportEnd,
    end: lastImportEnd,
  };
}

export function addToServiceIndex(
  fileText: string,
  isClient: boolean,
  kabab: string,
  pascal: string,
) {
  const sourceFile = ts.createSourceFile(
    'index.ts',
    fileText,
    ts.ScriptTarget.ES2015,
    true,
  );

  const service = `${isClient ? 'Client' : 'Server'}${pascal}Service`;
  const module = `'./${isClient ? 'client' : 'server'}-${kabab}-service'`;

  let insertAt = 0;

  for (const node of traverse(sourceFile)) {
    if (ts.isExportDeclaration(node)) {
      insertAt = node.getEnd();

      const exports = new Set<string>();
      let exportModule: string;

      for (const child of traverse(node)) {
        if (ts.isExportSpecifier(child)) {
          exports.add(child.getText());
        } else if (ts.isStringLiteral(child)) {
          exportModule = child.getText();
        }
      }

      if (exports.has(service) && exportModule === module) {
        return sourceFile.text;
      }
    }
  }

  const text =
    sourceFile.text.slice(0, insertAt) +
    `export { ${service} } from ${module}` +
    sourceFile.text.slice(insertAt);

  return prettier.format(text, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });
}

export function addEntity(
  fileText: string,
  camel: string,
  camelPlural: string,
  kababPlural: string,
  pascal: string,
): string {
  const sourceFile = ts.createSourceFile(
    'index.ts',
    fileText,
    ts.ScriptTarget.ES2015,
    true,
  );

  const replacements: Replacement[] = [
    getStateReplacement(sourceFile, camelPlural, pascal),
    getReducerReplacement(sourceFile, camel, camelPlural),
    getImportReplacement(sourceFile, camel, kababPlural, pascal),
  ];

  const text = replacements
    .sort((a, b) => b.start - a.start)
    .reduce(
      (acc, replacement) =>
        acc.slice(0, replacement.start) +
        replacement.text +
        acc.slice(replacement.end),
      sourceFile.text,
    );

  return prettier.format(text, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });
}

function isSyntaxList(node: ts.Node): node is ts.SyntaxList {
  return node.kind === ts.SyntaxKind.SyntaxList;
}

function getReducerReplacement(
  sourceFile: ts.SourceFile,
  camel: string,
  camelPlural: string,
): Replacement {
  for (const child of traverse(sourceFile)) {
    if (ts.isVariableDeclaration(child)) {
      const callExpression = child.getChildren().find(ts.isCallExpression);
      if (!callExpression) continue;

      const indentifier = callExpression.getChildren().find(ts.isIdentifier);
      if (!indentifier || indentifier.getText() !== 'combineReducers') continue;

      const objectLiteral = Array.from(traverse(callExpression)).find(
        ts.isObjectLiteralExpression,
      );
      if (!objectLiteral) continue;

      const props = Array.from(traverse(callExpression)).filter(
        ts.isPropertyAssignment,
      );

      const names = new Set(
        [camelPlural, ...props.map(s => s.name.getText())].sort((a, b) =>
          a.localeCompare(b),
        ),
      );

      const text = Array.from(names).reduce((acc, name) => {
        const existing = props.find(x => x.name.getText() === name);

        return (
          acc +
          (existing
            ? existing.getText() + ',\n'
            : `${camelPlural}: ${camel}Reducer,\n`)
        );
      }, '');

      return {
        text,
        start: objectLiteral.getStart() + 1,
        end: objectLiteral.getEnd() - 1,
      };
    }
  }

  return {
    text: '',
    start: 0,
    end: 0,
  };
}

function getImportReplacement(
  sourceFile: ts.SourceFile,
  camel: string,
  kababPlural: string,
  pascal: string,
): Replacement {
  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  const reducerImports = imports.filter(x =>
    x.moduleSpecifier.getText().match(/'\.\/[^\/]+\/reducer'/),
  );
  const insertImportAt = Math.max(...reducerImports.map(s => s.getEnd()));

  return reducerImports.some(
    x => x.moduleSpecifier.getText() === `'./${kababPlural}/reducer'`,
  )
    ? {
        text: '',
        start: 0,
        end: 0,
      }
    : {
        text: `import { ${pascal}ReducerState, ${camel}Reducer } from './${kababPlural}/reducer';`,
        start: insertImportAt,
        end: insertImportAt,
      };
}

function getStateReplacement(
  sourceFile: ts.SourceFile,
  camelPlural: string,
  pascal: string,
): Replacement {
  const typeDef = sourceFile.statements
    .filter(ts.isTypeAliasDeclaration)
    .find(x => x.name.text === 'ApplicationState');

  const syntaxList = typeDef
    .getChildren()
    .find(ts.isTypeLiteralNode)
    .getChildren()
    .find(isSyntaxList);

  const propSignatures = syntaxList
    .getChildren()
    .filter(ts.isPropertySignature);

  const names = new Set(
    [camelPlural, ...propSignatures.map(s => s.name.getText())].sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  const text = Array.from(names).reduce((acc, name) => {
    const existing = propSignatures.find(x => x.name.getText() === name);

    return (
      acc +
      (existing
        ? existing.getText() + '\n'
        : `${camelPlural}: ${pascal}ReducerState;\n`)
    );
  }, '');

  return {
    text,
    start: syntaxList.getStart(),
    end: syntaxList.getEnd(),
  };
}

type Replacement = {
  text: string;
  start: number;
  end: number;
};

function* traverse(node: ts.Node): IterableIterator<ts.Node> {
  if (!node) return;
  const stack: ts.Node[] = [node];
  while (stack.length) {
    const cursor = stack.pop();
    yield cursor;

    cursor
      .getChildren()
      .reverse()
      .forEach(c => stack.push(c));
  }
}
