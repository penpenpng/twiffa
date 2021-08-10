export const omitUndefinedProps = <T>(x: T): T =>
  x === undefined ? null : JSON.parse(JSON.stringify(x));
