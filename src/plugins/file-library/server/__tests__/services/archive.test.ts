import path from 'path';

jest.mock('adm-zip');
jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

import { extractZip } from '../../services/archive';
import AdmZip from 'adm-zip';
import { mkdirSync, writeFileSync } from 'fs';

const MockAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

// Use a deep enough path that a few `..` levels won't escape it
const DEST = path.resolve(process.cwd(), 'test-builds', 'my-build', 'files');

type MockEntry = {
  entryName: string;
  isDirectory: boolean;
  header: { size: number };
  getData: () => Buffer;
};

const makeEntry = (
  entryName: string,
  isDirectory = false,
  size = 100,
  data = Buffer.from('x'),
): MockEntry => ({ entryName, isDirectory, header: { size }, getData: () => data });

const mockZip = (entries: MockEntry[]) => {
  MockAdmZip.mockImplementation(
    () => ({ getEntries: jest.fn().mockReturnValue(entries) }) as unknown as AdmZip,
  );
};

beforeEach(() => jest.clearAllMocks());

describe('extractZip', () => {
  test('extracts a regular file entry', () => {
    mockZip([makeEntry('mods/file.jar', false, 100)]);
    expect(() => extractZip('/fake.zip', DEST)).not.toThrow();
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('creates directory for directory entries', () => {
    mockZip([makeEntry('mods/', true, 0)]);
    extractZip('/fake.zip', DEST);
    expect(mkdirSync).toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  test('skips __MACOSX entries', () => {
    mockZip([
      makeEntry('__MACOSX/._file.jar', false, 50),
      makeEntry('__MACOSX', false, 0),
      makeEntry('mods/real.jar', false, 100),
    ]);
    extractZip('/fake.zip', DEST);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('skips entries with empty name after stripping leading slashes', () => {
    mockZip([makeEntry('/', false, 10), makeEntry('///', false, 10)]);
    extractZip('/fake.zip', DEST);
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  test('strips leading slashes from entry names', () => {
    mockZip([makeEntry('/mods/file.jar', false, 50)]);
    extractZip('/fake.zip', DEST);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('normalizes backslashes in entry names', () => {
    mockZip([makeEntry('mods\\sub\\file.jar', false, 50)]);
    extractZip('/fake.zip', DEST);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('throws when entry count exceeds maxEntries', () => {
    mockZip([
      makeEntry('a.txt', false, 1),
      makeEntry('b.txt', false, 1),
      makeEntry('c.txt', false, 1),
    ]);
    expect(() => extractZip('/fake.zip', DEST, { maxEntries: 2 })).toThrow('too many entries');
  });

  test('throws when total uncompressed size exceeds maxSize', () => {
    mockZip([makeEntry('big.bin', false, 600)]);
    expect(() => extractZip('/fake.zip', DEST, { maxSize: 500 })).toThrow('exceeds limit');
  });

  test('accumulates size across multiple entries', () => {
    mockZip([makeEntry('a.bin', false, 300), makeEntry('b.bin', false, 300)]);
    expect(() => extractZip('/fake.zip', DEST, { maxSize: 500 })).toThrow('exceeds limit');
  });

  test('throws on zip-slip path traversal', () => {
    // path.join(DEST, '../../../../../evil') resolves outside DEST
    mockZip([makeEntry('../../../../../etc/passwd', false, 10)]);
    expect(() => extractZip('/fake.zip', DEST)).toThrow('Zip-slip detected');
  });

  test('uses default limits when options are omitted', () => {
    mockZip([makeEntry('file.jar', false, 100)]);
    expect(() => extractZip('/fake.zip', DEST, {})).not.toThrow();
  });
});
