import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import {
  getSkinFilePath,
  getCapeFilePath,
  getSkinFileUrl,
  getCapeFileUrl,
  buildSkinFilename,
  buildCapeFilename,
  ensureDirs,
  writeSkinFile,
  writeCapeFile,
  deleteFileIfExists,
} from '../services/storage';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('storage — URL and path helpers', () => {
  it('getSkinFileUrl returns the public URL for a given filename', () => {
    expect(getSkinFileUrl('42-abc.png')).toBe('/skins-registry/skins/42-abc.png');
  });

  it('getCapeFileUrl returns the public URL for a given filename', () => {
    expect(getCapeFileUrl('7-deadbeef.png')).toBe('/skins-registry/capes/7-deadbeef.png');
  });

  it('getSkinFilePath ends with the supplied filename', () => {
    expect(getSkinFilePath('1-cafef00d.png')).toMatch(/[/\\]skins[/\\]1-cafef00d\.png$/);
  });

  it('getCapeFilePath ends with the supplied filename', () => {
    expect(getCapeFilePath('99-feedface.png')).toMatch(/[/\\]capes[/\\]99-feedface\.png$/);
  });
});

describe('storage — buildSkinFilename / buildCapeFilename', () => {
  it('encodes the userId and a random hex revision', () => {
    const filename = buildSkinFilename(42);
    // <userId>-<12 hex chars>.png — REVISION_BYTES=6 → 12 hex chars.
    expect(filename).toMatch(/^42-[0-9a-f]{12}\.png$/);
  });

  it('produces a different filename on each call (per upload uniqueness)', () => {
    const a = buildSkinFilename(1);
    const b = buildSkinFilename(1);
    expect(a).not.toBe(b);
  });

  it('cape filenames follow the same shape', () => {
    expect(buildCapeFilename(7)).toMatch(/^7-[0-9a-f]{12}\.png$/);
  });
});

describe('storage — ensureDirs', () => {
  it('creates skins and capes directories', () => {
    ensureDirs();
    expect(mkdirSync).toHaveBeenCalledTimes(2);
    const calls = (mkdirSync as jest.Mock).mock.calls as [string, { recursive: boolean }][];
    expect(calls[0][0]).toMatch(/skins$/);
    expect(calls[1][0]).toMatch(/capes$/);
    expect(calls[0][1]).toEqual({ recursive: true });
  });
});

describe('storage — write', () => {
  it('writeSkinFile writes the buffer at the resolved skin path', () => {
    const buffer = Buffer.from('fake-skin-data');
    writeSkinFile('5-abcd0001.png', buffer);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/skins[/\\]5-abcd0001\.png$/),
      buffer,
    );
  });

  it('writeCapeFile writes the buffer at the resolved cape path', () => {
    const buffer = Buffer.from('fake-cape-data');
    writeCapeFile('3-abcd0002.png', buffer);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/capes[/\\]3-abcd0002\.png$/),
      buffer,
    );
  });
});

describe('storage — deleteFileIfExists', () => {
  it('calls rmSync when the file exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    deleteFileIfExists('/some/path/file.png');
    expect(rmSync).toHaveBeenCalledWith('/some/path/file.png');
  });

  it('does not call rmSync when the file does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    deleteFileIfExists('/some/path/missing.png');
    expect(rmSync).not.toHaveBeenCalled();
  });
});

