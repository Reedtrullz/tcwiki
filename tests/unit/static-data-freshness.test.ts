import { readFileSync } from 'node:fs';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { ECOSYSTEM_PROJECT_RECORDS } from '@/lib/data/static';

const staticDataSource = readFileSync('src/lib/data/static.ts', 'utf8');
const staticDataFile = ts.createSourceFile('src/lib/data/static.ts', staticDataSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function collectRecordCalls(node: ts.Node, calls: ts.CallExpression[] = []) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'record') {
    calls.push(node);
  }

  node.forEachChild((child) => {
    collectRecordCalls(child, calls);
  });
  return calls;
}

function findConstInitializer(name: string) {
  let initializer: ts.Expression | undefined;

  staticDataFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        initializer = declaration.initializer;
      }
    }
  });

  return initializer;
}

describe('static data freshness guardrails', () => {
  it('does not store unverified live project status on ecosystem catalog records', () => {
    for (const record of ECOSYSTEM_PROJECT_RECORDS) {
      expect(record.data, record.data.name).not.toHaveProperty('status');
    }
  });

  it('requires every static record to declare freshness explicitly', () => {
    const recordCalls = collectRecordCalls(staticDataFile);

    expect(staticDataSource).not.toContain('STATIC_DATA_BASE_FRESHNESS');
    expect(recordCalls.length).toBeGreaterThan(0);
    for (const call of recordCalls) {
      const { line, character } = staticDataFile.getLineAndCharacterOfPosition(call.getStart(staticDataFile));
      expect(
        call.arguments.length,
        `record() at ${line + 1}:${character + 1} must pass checkedAt and nextReviewDue explicitly`
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it('keeps the freshness helper free of hidden date defaults', () => {
    const initializer = findConstInitializer('checkedFreshness');

    expect(initializer).toBeDefined();
    expect(initializer && ts.isArrowFunction(initializer)).toBe(true);
    if (!initializer || !ts.isArrowFunction(initializer)) {
      return;
    }

    expect(initializer.parameters[1]?.initializer).toBeUndefined();
    expect(initializer.parameters[2]?.initializer).toBeUndefined();
  });
});
