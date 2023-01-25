import fs, { promises as fsPromises } from 'node:fs'

/**
Check if a path exists.

@returns Whether the path exists.

@example
```
// foo.ts
import {pathExists} from 'path-exists';

console.log(await pathExists('foo.ts'));
//=> true
```
*/
export async function pathExists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

/**
Synchronously check if a path exists.

@returns Whether the path exists.

@example
```
// foo.ts
import {pathExistsSync} from 'path-exists';

console.log(pathExistsSync('foo.ts'));
//=> true
```
*/
export function pathExistsSync(path: string) {
  try {
    fs.accessSync(path)
    return true
  } catch {
    return false
  }
}
