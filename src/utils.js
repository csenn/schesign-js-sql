/* Speical types */
export const LINKED_CLASS = 'LinkedClass';
export const NESTED_OBJECT = 'NestedObject';

/* Main Primitives */
export const TEXT = 'Text';
export const NUMBER = 'Number';
export const BOOLEAN = 'Boolean';
export const DATE = 'Date';
export const ENUM = 'Enum';

export const TEXT_FORMAT_URL = 'Url';
export const TEXT_FORMAT_EMAIL = 'Email';
export const TEXT_FORMAT_HOSTNAME = 'Hostname';

export const DATE_SHORT = 'ShortDate';
export const DATE_DATETIME = 'DateTime';
export const DATE_TIME = 'Time';

export const NUMBER_INT = 'Int';
export const NUMBER_INT_8 = 'Int8';
export const NUMBER_INT_16 = 'Int16';
export const NUMBER_INT_32 = 'Int32';
export const NUMBER_INT_64 = 'Int64';


export function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function isRequiredCardinality(cardinality) {
  return cardinality.minItems > 0;
}

export function isMultipleCardinality(cardinality) {
  return !isNumber(cardinality.maxItems) || cardinality.maxItems > 1;
}
