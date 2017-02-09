/* eslint no-use-before-define: ["error", { "functions": false }]*/

import knex from 'knex';
import * as utils from './utils';

function _fromBooleanRange(table, propertyName) {
  return table.boolean(propertyName);
}

function _fromStringRange(table, propertyName) {
  return table.text(propertyName);
}

const integers = [
  utils.NUMBER_INT,
  utils.NUMBER_INT_8,
  utils.NUMBER_INT_16,
  utils.NUMBER_INT_32,
];

function _fromNumberRange(table, propertyName, range) {
  if (range.format === utils.NUMBER_INT_64) {
    return table.bigInteger(propertyName);
  } else if (integers.includes(range.format)) {
    return table.integer(propertyName);
  }
  return table.float(propertyName);
}

function _fromDateRange(table, propertyName, range) {
  if (range.format === 'ShortDate') {
    return table.date(propertyName);
  } else if (range.format === 'Time') {
    return table.time(propertyName);
  }
  return table.date(propertyName);
}

function _fromEnumRange(table, propertyName, range) {
  return table.enu(propertyName, range.values);
}

function _fromNestedObject(schemaContext, table, propertyName, range, parentName) {
  const name = `${parentName}_join_${propertyName}`;
  _addTable(schemaContext, name, range.propertyRefs);
  return table
    .integer(propertyName)
    .unsigned()
    .references('id')
    .inTable(name);
}

function _fromLinkedClass(context, table, propertyName, range) {
  const rangeClass = context.definitions.classes[range.ref];
  _addTable(context, rangeClass.label, rangeClass.propertyRefs);
  return table
    .integer(propertyName)
    .unsigned()
    .references('id')
    .inTable(rangeClass.label);
}

function _buildFromRange(schemaContext, table, propertyName, range, isRequired, parentName) {
  let col;
  switch (range.type) {
    case utils.BOOLEAN:
      col = _fromBooleanRange(table, propertyName);
      break;
    case utils.TEXT:
      col = _fromStringRange(table, propertyName);
      break;
    case utils.NUMBER:
      col = _fromNumberRange(table, propertyName, range);
      break;
    case utils.DATE:
      return _fromDateRange(table, propertyName, range);
    case utils.ENUM:
      return _fromEnumRange(table, propertyName, range);
    case utils.NESTED_OBJECT:
      return _fromNestedObject(schemaContext, table, propertyName, range, parentName);
    case utils.LINKED_CLASS:
      return _fromLinkedClass(schemaContext, table, propertyName, range);
    default:
      throw new Error(`Not expecting type: ${range.type}`);
  }

  if (isRequired) {
    col.notNullable();
  }
}

function _fromPropertyRefs(context, table, propertyRefs, parentName) {
  for (let i = 0; i < propertyRefs.length; i++) {
    const propertyRef = propertyRefs[i];
    const property = context.definitions.properties[propertyRef.ref];
    const { label, range } = property;

    /* create a linking table */
    if (utils.isMultipleCardinality(propertyRef.cardinality) && range.type !== utils.NESTED_OBJECT) {
      const name = `${parentName}_join_${label}`;
      _addTableForMultipleCardinality(context, name, parentName, label, range, propertyRef);
    } else {
      _buildFromRange(context, table, label, range, propertyRef.required, parentName);
    }
  }
}

export function _addTableForMultipleCardinality(context, tableName, table1, table2, range, propertyRef) {
  const instance = knex({
    client: context.client,
  });

  /* add result table */
  const knexSchema = instance.schema.createTable(table2, table => {
    table.increments('id');
    table
      .integer(table1 + '_id')
      .unsigned()
      .references('id')
      .inTable(table1);

    _buildFromRange(context, table, table2, range, propertyRef.required, table2 + '_id');
  });

  context.tables.push(`${knexSchema.toString()};`);
}

export function _addTable(context, tableName, propertyRefs) {
  if (context.tablesAdded[tableName]) {
    return;
  }
  context.tablesAdded[tableName] = true;

  const instance = knex({
    client: context.client,
  });

  const knexSchema = instance.schema.createTable(tableName, table => {
    table.increments('id');
    _fromPropertyRefs(context, table, propertyRefs, tableName);
  });

  context.tables.push(`${knexSchema.toString()};`);
}

export function _flattenHierarchies(context) {
  Object.keys(context.definitions.classes).forEach(key => {
    const classNode = context.definitions.classes[key];
    const recurseNode = node => {
      if (node.subClassOf) {
        const parent = context.definitions.classes[node.subClassOf];
        parent.propertyRefs.forEach(parentRef => {
          const exclude = classNode.excludeParentProperties
            && classNode.excludeParentProperties.includes(parentRef.ref)
          const exists = existsInRefs(context, classNode.propertyRefs, parentRef)
          if (!exclude && !exists) {
            classNode.propertyRefs.push(parentRef);
          }
        });
        recurseNode(parent);
      }
    };
    recurseNode(classNode);
  });
}


export function generateFromGraph(graph, options = {}) {
  const context = {
    client: 'postgres',
    tables: [],
    /* Track tables that have been added */
    tablesAdded: {},
    definitions: {
      classes: {},
      properties: {},
    },
  };

  graph.forEach(node => {
    if (node.type === 'Class') {
      context.definitions.classes[node.uid] = node;
    } else if (node.type === 'Property') {
      context.definitions.properties[node.uid] = node;
    } else {
      throw new Error('Bad node in graph');
    }
  });

  _flattenHierarchies(context);

  Object.keys(context.definitions.classes).forEach(key => {
    const node = context.definitions.classes[key];
    _addTable(context, node.label, node.propertyRefs);
  });

  const tableQueries = context.tables.reverse().map(table => {
    // mysql -> so cant just split with commas `n` float(8, 2),
    let result = table.replace(/,(?! ?[0-9])/g, ',\n  ');
    result = result.replace('(', '(\n   ');
    result = result.replace(');', '\n);');
    return result;
  });

  const query = tableQueries.join('\n\n');
  return query;
}
