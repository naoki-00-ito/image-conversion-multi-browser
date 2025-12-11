import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import 'dotenv/config';

function convertImage(inputPath, outputDir, quality) {
  // ディレクトリ内のすべてのファイルとディレクトリを処理
  function processDirectory(currentInputPath, currentOutputPath) {
    const files = fs.readdirSync(currentInputPath);

    for (const file of files) {
      const fullInputPath = path.join(currentInputPath, file);
      const stat = fs.statSync(fullInputPath);

      if (stat.isDirectory()) {
        // サブディレクトリの場合、再帰的に処理
        const subOutputPath = path.join(currentOutputPath, file);
        processDirectory(fullInputPath, subOutputPath);
      } else {
        // ファイルの場合、画像変換を実行
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);

        // 画像ファイルかチェック
        if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp'].includes(ext)) {
          continue;
        }

        // ファイル名をベースにしたサブディレクトリを作成
        const fileOutputDir = path.join(currentOutputPath, baseName);
        if (!fs.existsSync(fileOutputDir)) {
          fs.mkdirSync(fileOutputDir, { recursive: true });
        }

        // 画像をSharpで読み込み
        const image = sharp(fullInputPath);

        // 元の拡張子で出力（index.ext形式）
        const outputOriginalPath = path.join(fileOutputDir, `index${ext}`);
        image.toFile(outputOriginalPath);

        // AVIF形式で保存
        const outputAvifPath = path.join(fileOutputDir, 'index.avif');
        image.avif({ quality: Number.parseInt(quality, 10) }).toFile(outputAvifPath);

        // WebP形式で保存
        const outputWebpPath = path.join(fileOutputDir, 'index.webp');
        image.webp({ quality: Number.parseInt(quality, 10) }).toFile(outputWebpPath);
      }
    }
  }

  // 処理開始
  processDirectory(inputPath, outputDir);
}

convertImage(process.env.INPUT_DIR, process.env.OUTPUT_DIR, process.env.QUALITY);