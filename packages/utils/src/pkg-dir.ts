import path from 'node:path'
import { findUp, findUpSync } from 'find-up'

export interface PkgDirOptions {
  /**
	The directory to start searching from.

	@default process.cwd()
	*/
  readonly cwd?: string
}

export async function packageDirectory({ cwd }: PkgDirOptions = {}) {
  const filePath = await findUp('package.json', { cwd })
  return filePath && path.dirname(filePath)
}

export function packageDirectorySync({ cwd }: PkgDirOptions = {}) {
  const filePath = findUpSync('package.json', { cwd })
  return filePath && path.dirname(filePath)
}
