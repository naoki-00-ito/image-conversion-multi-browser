import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { convertImages } from "./index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("convertImages", () => {
  const testInputDir = path.join(__dirname, 'test-input');
  const testOutputDir = path.join(__dirname, 'test-output');

  beforeAll(() => {
    // テスト用のディレクトリとサンプル画像を作成
    if (!fs.existsSync(testInputDir)) {
      fs.mkdirSync(testInputDir, { recursive: true });
    }

    // 1x1ピクセルのテスト用PNG画像を作成（base64）
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    fs.writeFileSync(path.join(testInputDir, 'test-image.png'), testImageData);
  });

  afterAll(() => {
    // テスト用ファイルの削除
    if (fs.existsSync(testInputDir)) {
      fs.rmSync(testInputDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it("画像の変換が正常に動作すること", async () => {
    await convertImages(testInputDir, testOutputDir, 70);

    // 出力ディレクトリが作成されているかチェック
    expect(fs.existsSync(testOutputDir)).toBe(true);

    // test-image ディレクトリが作成されているかチェック
    const imageDir = path.join(testOutputDir, 'test-image');
    expect(fs.existsSync(imageDir)).toBe(true);

    // 各形式のファイルが作成されているかチェック
    expect(fs.existsSync(path.join(imageDir, 'index.png'))).toBe(true);
    expect(fs.existsSync(path.join(imageDir, 'index.webp'))).toBe(true);
    expect(fs.existsSync(path.join(imageDir, 'index.avif'))).toBe(true);
  });

  it("スマホ用画像の変換が正常に動作すること", async () => {
    const testOutputDirSp = path.join(__dirname, 'test-output-sp');

    await convertImages(testInputDir, testOutputDirSp, 70, 768);

    // 出力ディレクトリが作成されているかチェック
    expect(fs.existsSync(testOutputDirSp)).toBe(true);

    // test-image ディレクトリが作成されているかチェック
    const imageDir = path.join(testOutputDirSp, 'test-image');
    expect(fs.existsSync(imageDir)).toBe(true);

    // 通常の各形式のファイルが作成されているかチェック
    expect(fs.existsSync(path.join(imageDir, 'index.png'))).toBe(true);
    expect(fs.existsSync(path.join(imageDir, 'index.webp'))).toBe(true);
    expect(fs.existsSync(path.join(imageDir, 'index.avif'))).toBe(true);

    // スマホ用の各形式のファイルが作成されているかチェック
    expect(fs.existsSync(path.join(imageDir, 'index-sp.png'))).toBe(true);
    expect(fs.existsSync(path.join(imageDir, 'index-sp.webp'))).toBe(true);
    expect(fs.existsSync(path.join(imageDir, 'index-sp.avif'))).toBe(true);

    // クリーンアップ
    if (fs.existsSync(testOutputDirSp)) {
      fs.rmSync(testOutputDirSp, { recursive: true, force: true });
    }
  });
});