export const join = (...parties: string[]) => parties.filter(Boolean).join('/').replace(/\/+/g, '/');
export const resolve = join;
export default { join, resolve };
