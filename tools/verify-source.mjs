import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const normalize = (buffer) => buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\n?$/, '\n')
const source = normalize(await readFile(new URL('../contracts/ReachBack.py', import.meta.url)))
const expected = (await readFile(new URL('../SOURCE_SHA256.txt', import.meta.url), 'utf8')).trim().split(/\s+/)[0]
const actual = createHash('sha256').update(source).digest('hex')
if (actual !== expected) {
  console.error(`Frozen source mismatch\nexpected ${expected}\nactual   ${actual}`)
  process.exit(1)
}
console.log(`Frozen source verified: ${actual}`)

