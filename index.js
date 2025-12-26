import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import 'dotenv/config';

export async function convertImage(inputPath, outputDir, quality, spImageWidth) {
  console.log('🚀 画像変換を開始します...');
  console.log(`入力ディレクトリ: ${inputPath}`);
  console.log(`出力ディレクトリ: ${outputDir}`);
  console.log(`品質設定: ${quality}%`);
  if (spImageWidth) {
    console.log(`スマホ用画像幅: ${spImageWidth}px`);
  }
  console.log('');

  let processedFiles = 0;
  const results = [];

  // ディレクトリ内のすべてのファイルとディレクトリを処理
  async function processDirectory(currentInputPath, currentOutputPath, relativePath = '') {
    const files = fs.readdirSync(currentInputPath);
    const promises = [];

    // ディレクトリを開始する時のメッセージ
    if (relativePath) {
      console.log(`📁 ディレクトリ処理中: ${relativePath}/`);
    }

    for (const file of files) {
      const fullInputPath = path.join(currentInputPath, file);
      const stat = fs.statSync(fullInputPath);
      const newRelativePath = relativePath ? path.join(relativePath, file) : file;

      if (stat.isDirectory()) {
        // サブディレクトリの場合、再帰的に処理
        const subOutputPath = path.join(currentOutputPath, file);
        promises.push(processDirectory(fullInputPath, subOutputPath, newRelativePath));
      } else {
        // ファイルの場合、画像変換を実行
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);

        // 画像ファイルかチェック
        if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp'].includes(ext)) {
          continue;
        }

        const displayPath = relativePath ? `${relativePath}/${file}` : file;
        console.log(`📸 処理中: ${displayPath}`);
        processedFiles++;

        // ファイル名をベースにしたサブディレクトリを作成
        const fileOutputDir = path.join(currentOutputPath, baseName);
        if (!fs.existsSync(fileOutputDir)) {
          fs.mkdirSync(fileOutputDir, { recursive: true });
        }

        // 画像をSharpで読み込み
        const image = sharp(fullInputPath);
        const metadata = await image.metadata();

        // 変換するフォーマットのリスト
        const conversionPromises = [
          // 元の拡張子で出力（index.ext形式）
          image.toFile(path.join(fileOutputDir, `index${ext}`)),
          // AVIF形式で保存
          image.avif({ quality: Number.parseInt(quality, 10) }).toFile(path.join(fileOutputDir, 'index.avif')),
          // WebP形式で保存
          image.webp({ quality: Number.parseInt(quality, 10) }).toFile(path.join(fileOutputDir, 'index.webp'))
        ];

        const formatResults = [
          { format: ext.substring(1), path: path.join(fileOutputDir, `index${ext}`) },
          { format: 'avif', path: path.join(fileOutputDir, 'index.avif') },
          { format: 'webp', path: path.join(fileOutputDir, 'index.webp') }
        ];

        // スマホ用画像を生成（SP_IMAGE_WIDTHが設定されていて、画像幅がSP_IMAGE_WIDTHより大きい場合のみ）
        if (spImageWidth) {
          const spWidth = Number.parseInt(spImageWidth, 10);
          
          // 画像の幅がSP_IMAGE_WIDTHより大きい場合のみスマホ用画像を生成
          if (metadata.width && metadata.width > spWidth) {
            const imageSp = sharp(fullInputPath).resize({ width: spWidth });
            
            conversionPromises.push(
              // 元の拡張子で出力（index-sp.ext形式）
              imageSp.clone().toFile(path.join(fileOutputDir, `index-sp${ext}`)),
              // AVIF形式で保存
              imageSp.clone().avif({ quality: Number.parseInt(quality, 10) }).toFile(path.join(fileOutputDir, 'index-sp.avif')),
              // WebP形式で保存
              imageSp.clone().webp({ quality: Number.parseInt(quality, 10) }).toFile(path.join(fileOutputDir, 'index-sp.webp'))
            );

            formatResults.push(
              { format: `sp-${ext.substring(1)}`, path: path.join(fileOutputDir, `index-sp${ext}`) },
              { format: 'sp-avif', path: path.join(fileOutputDir, 'index-sp.avif') },
              { format: 'sp-webp', path: path.join(fileOutputDir, 'index-sp.webp') }
            );
          }
        }

        // 非同期でファイル変換を実行
        promises.push(
          Promise.all(conversionPromises).then((fileResults) => {
            const result = {
              originalFile: displayPath,
              outputDir: baseName,
              relativePath: relativePath,
              formats: formatResults.map((format, index) => ({
                ...format,
                size: fileResults[index].size
              }))
            };
            results.push(result);
            console.log(`✅ 完了: ${displayPath} → ${relativePath ? `${relativePath}/` : ''}${baseName}/`);
            return result;
          })
        );
      }
    }

    await Promise.all(promises);
  }

  // 処理開始
  await processDirectory(inputPath, outputDir);

  // 結果を表示
  console.log('');
  console.log('🎉 変換完了！');
  console.log(`処理ファイル数: ${processedFiles}`);
  console.log('');

  if (results.length > 0) {
    console.log('📊 変換結果:');
    for (const result of results) {
      console.log(`\n📁 ${result.originalFile} → ${result.outputDir}/`);
      for (const format of result.formats) {
        const sizeKB = (format.size / 1024).toFixed(1);
        console.log(`   ${format.format.toUpperCase()}: ${sizeKB} KB`);
      }
    }

    // ファイルサイズ比較
    console.log('\n📈 圧縮率比較:');
    for (const result of results) {
      const original = result.formats[0];
      const avif = result.formats[1];
      const webp = result.formats[2];

      const avifReduction = ((original.size - avif.size) / original.size * 100).toFixed(1);
      const webpReduction = ((original.size - webp.size) / original.size * 100).toFixed(1);

      console.log(`${result.outputDir}:`);
      console.log(`   AVIF: -${avifReduction}% (${(avif.size / 1024).toFixed(1)} KB)`);
      console.log(`   WebP: -${webpReduction}% (${(webp.size / 1024).toFixed(1)} KB)`);
    }
  }

  return results;
}

// テスト用のラッパー関数
export async function convertImages(inputPath, outputDir, quality, spImageWidth) {
  const input = inputPath || process.env.INPUT_DIR;
  const output = outputDir || process.env.OUTPUT_DIR;
  const qual = quality || process.env.QUALITY;
  const spWidth = spImageWidth || process.env.SP_IMAGE_WIDTH;

  return await convertImage(input, output, qual, spWidth);
}

// 直接実行時のみ動作
if (import.meta.url === `file://${process.argv[1]}`) {
  convertImage(process.env.INPUT_DIR, process.env.OUTPUT_DIR, process.env.QUALITY, process.env.SP_IMAGE_WIDTH);
}