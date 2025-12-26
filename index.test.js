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

    // 1x1ピクセルのテスト用PNG画像を作成（base64）- 小さい画像用
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    fs.writeFileSync(path.join(testInputDir, 'test-image.png'), testImageData);
    fs.writeFileSync(path.join(testInputDir, 'test-image-small.png'), testImageData);
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
    const sharp = (await import('sharp')).default;
    const testOutputDirSp = path.join(__dirname, 'test-output-sp');
    const testLargeImagePath = path.join(testInputDir, 'test-large-image.png');

    // 1000x1000ピクセルの大きい画像を作成（SP_IMAGE_WIDTHより大きい）
    await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toFile(testLargeImagePath);

    await convertImages(testInputDir, testOutputDirSp, 70, 768);

    // 出力ディレクトリが作成されているかチェック
    expect(fs.existsSync(testOutputDirSp)).toBe(true);

    // 大きい画像の場合：スマホ用画像が生成される
    const largeImageDir = path.join(testOutputDirSp, 'test-large-image');
    expect(fs.existsSync(largeImageDir)).toBe(true);
    expect(fs.existsSync(path.join(largeImageDir, 'index.png'))).toBe(true);
    expect(fs.existsSync(path.join(largeImageDir, 'index-sp.png'))).toBe(true);
    expect(fs.existsSync(path.join(largeImageDir, 'index-sp.webp'))).toBe(true);
    expect(fs.existsSync(path.join(largeImageDir, 'index-sp.avif'))).toBe(true);

    // 小さい画像の場合：スマホ用画像は生成されない
    const smallImageDir = path.join(testOutputDirSp, 'test-image-small');
    expect(fs.existsSync(smallImageDir)).toBe(true);
    expect(fs.existsSync(path.join(smallImageDir, 'index.png'))).toBe(true);
    expect(fs.existsSync(path.join(smallImageDir, 'index-sp.png'))).toBe(false);
    expect(fs.existsSync(path.join(smallImageDir, 'index-sp.webp'))).toBe(false);
    expect(fs.existsSync(path.join(smallImageDir, 'index-sp.avif'))).toBe(false);

    // クリーンアップ
    if (fs.existsSync(testOutputDirSp)) {
      fs.rmSync(testOutputDirSp, { recursive: true, force: true });
    }
    if (fs.existsSync(testLargeImagePath)) {
      fs.unlinkSync(testLargeImagePath);
    }
  });
});