import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import {
  getSkinFilePath,
  getCapeFilePath,
  getSkinFileUrl,
  getCapeFileUrl,
  ensureDirs,
  writeSkinFile,
  writeCapeFile,
  deleteSkinFile,
  deleteCapeFile,
  readSkinFile,
  readCapeFile,
  deleteFileIfExists,
  readFileOrNull,
} from '../services/storage';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
  readFileSync: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('storage — URL and path helpers', () => {
  it('getSkinFileUrl returns the correct public URL', () => {
    expect(getSkinFileUrl(42)).toBe('/skins-registry/skins/42.png');
  });

  it('getCapeFileUrl returns the correct public URL', () => {
    expect(getCapeFileUrl(7)).toBe('/skins-registry/capes/7.png');
  });

  it('getSkinFilePath ends with the expected filename', () => {
    expect(getSkinFilePath(1)).toMatch(/[/\\]skins[/\\]1\.png$/);
  });

  it('getCapeFilePath ends with the expected filename', () => {
    expect(getCapeFilePath(99)).toMatch(/[/\\]capes[/\\]99\.png$/);
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
  it('writeSkinFile calls mkdirSync then writeFileSync with correct path and buffer', () => {
    const buffer = Buffer.from('fake-skin-data');
    writeSkinFile(5, buffer);
    expect(writeFileSync).toHaveBeenCalledWith(expect.stringMatching(/skins[/\\]5\.png$/), buffer);
  });

  it('writeCapeFile calls mkdirSync then writeFileSync with correct path and buffer', () => {
    const buffer = Buffer.from('fake-cape-data');
    writeCapeFile(3, buffer);
    expect(writeFileSync).toHaveBeenCalledWith(expect.stringMatching(/capes[/\\]3\.png$/), buffer);
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

describe('storage — deleteSkinFile / deleteCapeFile', () => {
  it('deleteSkinFile removes the skin file when it exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    deleteSkinFile(10);
    expect(rmSync).toHaveBeenCalledWith(expect.stringMatching(/skins[/\\]10\.png$/));
  });

  it('deleteCapeFile removes the cape file when it exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    deleteCapeFile(10);
    expect(rmSync).toHaveBeenCalledWith(expect.stringMatching(/capes[/\\]10\.png$/));
  });
});

describe('storage — readFileOrNull', () => {
  it('returns buffer when file exists', () => {
    const buffer = Buffer.from('data');
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(buffer);
    expect(readFileOrNull('/some/path.png')).toBe(buffer);
  });

  it('returns null when file does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    expect(readFileOrNull('/missing.png')).toBeNull();
  });
});

describe('storage — readSkinFile / readCapeFile', () => {
  it('readSkinFile reads from the skins directory', () => {
    const buffer = Buffer.from('skin-bytes');
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(buffer);
    const result = readSkinFile(2);
    expect(result).toBe(buffer);
    expect(readFileSync).toHaveBeenCalledWith(expect.stringMatching(/skins[/\\]2\.png$/));
  });

  it('readCapeFile returns null when file is missing', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    expect(readCapeFile(2)).toBeNull();
  });
});
