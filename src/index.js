/* eslint no-use-before-define: ["error", { "functions": false }] */

import knex from 'knex'
import * as utils from './utils'

function _getTableName (context, uid, label) {
  if (context.tableLookup.uids[uid]) {
    return context.tableLookup.uids[uid]
  }

  let tableName
  if (context.tableLookup.labels[label]) {
    tableName = `${label}_${context.tableLookup.labels[label]}`
    context.tableLookup.labels[label] += 1
  } else {
    tableName = label
    context.tableLookup.labels[label] = 1
  }

  context.tableLookup.uids[uid] = tableName
  return tableName
}

function _fromBooleanRange (table, propertyName) {
  return table.boolean(propertyName)
}

function _fromStringRange (table, propertyName) {
  return table.text(propertyName)
}

const integers = [
  utils.NUMBER_INT,
  utils.NUMBER_INT_8,
  utils.NUMBER_INT_16,
  utils.NUMBER_INT_32
]

function _fromNumberRange (table, propertyName, range) {
  if (range.format === utils.NUMBER_INT_64) {
    return table.bigInteger(propertyName)
  } else if (integers.includes(range.format)) {
    return table.integer(propertyName)
  }
  return table.float(propertyName)
}

function _fromDateRange (table, propertyName, range) {
  if (range.format === 'ShortDate') {
    return table.date(propertyName)
  } else if (range.format === 'Time') {
    return table.time(propertyName)
  }
  return table.date(propertyName)
}

function _fromEnumRange (table, propertyName, range) {
  return table.enu(propertyName, range.values)
}

function _fromNestedObject (schemaContext, table, property, parentName) {
  const { uid, label, range } = property

  const tableName = _getTableName(schemaContext, uid, label)
  _addTable(schemaContext, uid, tableName, range.propertySpecs)

  return table
    .integer(label)
    .unsigned()
    .references('id')
    .inTable(tableName)
}

function _fromLinkedClass (context, table, property) {
  const rangeClass = context.definitions.classes[property.range.ref]

  const tableName = _getTableName(context, rangeClass.uid, rangeClass.label)
  _addTable(context, rangeClass.uid, tableName, rangeClass.propertySpecs)

  return table
    .integer(property.label)
    .unsigned()
    .references('id')
    .inTable(tableName)
}

function _buildFromRange (schemaContext, table, property, propertySpec, parentName) {
  const { label, range } = property

  let col
  switch (range.type) {
    case utils.BOOLEAN:
      col = _fromBooleanRange(table, label)
      break
    case utils.TEXT:
      col = _fromStringRange(table, label)
      break
    case utils.NUMBER:
      col = _fromNumberRange(table, label, range)
      break
    case utils.DATE:
      return _fromDateRange(table, label, range)
    case utils.ENUM:
      return _fromEnumRange(table, label, range)
    case utils.NESTED_OBJECT:
      return _fromNestedObject(schemaContext, table, property, parentName)
    case utils.LINKED_CLASS:
      return _fromLinkedClass(schemaContext, table, property)
    default:
      throw new Error(`Not expecting type: ${range.type}`)
  }

  if (propertySpec.required) {
    col.notNullable()
  }

  if (propertySpec.primaryKey) {
    col.primary()
  }
}

function _fromPropertySpecs (context, table, propertySpecs, parentName) {
  for (let i = 0; i < propertySpecs.length; i++) {
    const propertySpec = propertySpecs[i]
    const property = context.definitions.properties[propertySpec.ref]
    const { label, range } = property

    /* create a linking table */
    // if (utils.isMultipleCardinality(propertySpec.cardinality) && range.type !== utils.NESTED_OBJECT) {
    if (propertySpec.array && range.type !== utils.NESTED_OBJECT) {
      const name = `${parentName}_join_${label}`
      _addTableForMultipleCardinality(context, name, parentName, property, propertySpec)
    } else {
      _buildFromRange(context, table, property, propertySpec, parentName)
    }
  }
}

export function _addTableForMultipleCardinality (context, tableName, parentName, property, propertySpec) {
  const instance = knex({
    client: context.client
  })

  /* add result table */
  const knexSchema = instance.schema.createTable(property.label, table => {
    table.increments('id')
    table
      .integer(parentName + '_id')
      .unsigned()
      .references('id')
      .inTable(parentName)

    _buildFromRange(context, table, property, propertySpec, property.label + '_id')
  })

  context.tables.push(`${knexSchema.toString()};`)
}

export function _addTable (context, uid, tableName, propertySpecs) {
  if (context.tableLookup.added[uid]) {
    return
  }

  context.tableLookup.added[uid] = true

  const instance = knex({
    client: context.client
  })

  const knexSchema = instance.schema.createTable(tableName, table => {
    const primaryKeySpec = propertySpecs.find(spec => spec.primaryKey)
    if (!primaryKeySpec) {
      table.increments('id')
    }
    _fromPropertySpecs(context, table, propertySpecs, tableName)
  })

  context.tables.push(`${knexSchema.toString()};`)
}

/* If there is a property label lower in the hierarchy,
do not overwrite it from parent with same name */
function existsInRefs (context, propertySpecs, parentRef) {
  const properties = context.definitions.properties
  return propertySpecs.some(ref => {
    const node = properties[ref.ref]
    const parentNode = properties[parentRef.ref]
    return node.label === parentNode.label
  })
}

export function _flattenHierarchies (context) {
  const classes = context.definitions.classes
  Object.keys(classes).forEach(key => {
    const classNode = classes[key]
    const excluded = []

    // classNode.excludeParentProperties || []
    const recurseNode = node => {
      if (node.subClassOf) {
        const parent = classes[node.subClassOf]
        parent.propertySpecs.forEach(parentRef => {
          if (node.excludeParentProperties) {
            excluded.push(...node.excludeParentProperties)
          }
          const exists = existsInRefs(context, classNode.propertySpecs, parentRef)
          if (!exists) {
            classNode.propertySpecs.push(parentRef)
          }
        })
        recurseNode(parent)
      }
    }
    recurseNode(classNode)
    classNode.propertySpecs = classNode.propertySpecs.filter(spec => excluded.indexOf(spec.ref) === -1)
  })
}

export function generateFromGraph (graph, options = {}) {
  const context = {
    client: options.client || 'postgres',
    tables: [],
    /* Track tables that have been added */
    tableLookup: {
      added: {},
      uids: {},
      labels: {}
    },
    definitions: {
      classes: {},
      properties: {}
    }
  }

  graph.forEach(node => {
    if (node.type === 'Class') {
      context.definitions.classes[node.uid] = node
    } else if (node.type === 'Property') {
      context.definitions.properties[node.uid] = node
    } else {
      throw new Error('Bad node in graph')
    }
  })

  _flattenHierarchies(context)

  Object.keys(context.definitions.classes).forEach(key => {
    const node = context.definitions.classes[key]
    const tableName = _getTableName(context, node.uid, node.label)
    _addTable(context, node.uid, tableName, node.propertySpecs)
  })

  const tableQueries = context.tables.reverse().map(table => {
    // mysql -> so cant just split with commas `n` float(8, 2),
    let result = table.replace(/,(?! ?[0-9])/g, ',\n  ')
    result = result.replace('(', '(\n   ')
    result = result.replace(');', '\n);')
    return result
  })

  const query = tableQueries.join('\n\n')
  return query
}
