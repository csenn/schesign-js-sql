import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { generateFromGraph } from '../src';
const { describe, it } = global;

import propertyVariations from './fixtures/propertyVariations.json';
import multipleCardinality from './fixtures/multipleCardinality.json';

const readSql = name => fs.readFileSync(path.resolve(__dirname, 'fixtures', name), 'utf-8');
const propertyVariationsSql = readSql('propertyVariationsSql.txt');
const multipleCardinalitySql = readSql('multipleCardinalitySql.txt');

describe('generateJsonSchema', () => {
  it('should convert a propertyVariations graph to a sql string', () => {
    const query = generateFromGraph(propertyVariations.graph, {});
    expect(query).to.equal(propertyVariationsSql);
  });
  it('should convert a multipleCardinality graph to a sql string', () => {
    const query = generateFromGraph(multipleCardinality.graph, {});
    expect(query).to.equal(multipleCardinalitySql);
  });
});
