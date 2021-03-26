import Ajv, { SchemaObject } from 'ajv';
import { HTTPError } from './error';

export function validate<T>(data: unknown, schema: unknown): T {
  const ajv = new Ajv();
  if (!ajv.validate(schema as SchemaObject, data)) {
    throw new HTTPError(400);
  }
  return data as T;
}
