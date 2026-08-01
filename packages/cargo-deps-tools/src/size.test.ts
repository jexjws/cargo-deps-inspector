import { describe, expect, it } from 'vitest'
import { guessCargoFileCategory } from './size'

describe('guessCargoFileCategory', () => {
  it.each([
    ['src/lib.rs', 'rust'],
    ['tests/integration.rs', 'tests'],
    ['examples/demo.rs', 'examples'],
    ['benches/parser.rs', 'benches'],
    ['build.rs', 'build'],
    ['Cargo.toml', 'manifest'],
    ['README.md', 'docs'],
    ['assets/logo.svg', 'assets'],
    ['fixtures/input.bin', 'other'],
  ] as const)('categorizes %s as %s', (file, expected) => {
    expect(guessCargoFileCategory(file)).toBe(expected)
  })
})
