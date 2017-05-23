import fs from 'fs'
import path from 'path'
import { expect } from 'chai'
import { generateFromGraph } from '../src'

import basic from 'schesign-graph-examples/graphs/export/basic'
import recursion from 'schesign-graph-examples/graphs/export/recursion'
import propertyVariations from 'schesign-graph-examples/graphs/export/property_variations'
import inheritanceChain2 from 'schesign-graph-examples/graphs/export/inheritance_chain_2'
import linkedNodes2 from 'schesign-graph-examples/graphs/export/linked_nodes_2'

const { describe, it } = global
const readSql = name => fs.readFileSync(path.resolve(__dirname, 'fixtures', name), 'utf-8')

describe('generateFromGraph', () => {
  it('should convert basic graph to a sql string', () => {
    const sql = generateFromGraph(basic.graph)
    expect(sql).to.equal(readSql('basic.sql'))
  })
  it('should convert recursion graph to a sql string', () => {
    const sql = generateFromGraph(recursion.graph)
    expect(sql).to.equal(readSql('recursion.sql'))
  })
  it('should convert propertyVariations graph to a sql string', () => {
    const sql = generateFromGraph(propertyVariations.graph)
    expect(sql).to.equal(readSql('property_variations.sql'))
  })
  it('should convert a linkedNodes2 graph to a sql string', () => {
    const sql = generateFromGraph(linkedNodes2.graph)
    expect(sql).to.equal(readSql('linked_nodes.sql'))
  })
  it('should convert a inheritance graph to a sql string', () => {
    const sql = generateFromGraph(inheritanceChain2.graph)
    expect(sql).to.equal(readSql('inheritance.sql'))
  })
})
