import { validateUpgradeSafety } from '@openzeppelin/upgrades-core';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('🔍 验证可升级合约的安全性...\n');

  try {
    const buildInfoDir = path.join(__dirname, '../artifacts/build-info');
    const files = fs.readdirSync(buildInfoDir);
    
    // Hardhat 3 分离了 input (.json) 和 output (.output.json)
    // 我们需要合并它们才能让 validateUpgradeSafety 识别
    const inputFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.output.json'));
    
    if (inputFiles.length === 0) {
      console.log('❌ 未找到构建信息文件');
      process.exit(1);
    }

    // 创建临时目录存放合并后的文件
    const tempBuildDir = path.join(__dirname, '../artifacts/temp-build-info');
    if (fs.existsSync(tempBuildDir)) {
      fs.rmSync(tempBuildDir, { recursive: true });
    }
    fs.mkdirSync(tempBuildDir, { recursive: true });

    // 合并 input 和 output 文件
    for (const inputFile of inputFiles) {
      const inputPath = path.join(buildInfoDir, inputFile);
      const outputPath = inputPath.replace('.json', '.output.json');
      
      if (!fs.existsSync(outputPath)) {
        continue;
      }

      const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
      const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      
      // 创建兼容格式的完整构建信息
      const mergedBuildInfo = {
        _format: 'hh-sol-build-info-1',
        id: inputData.id,
        input: inputData.input,
        solcVersion: inputData.solcVersion,
        solcLongVersion: inputData.solcLongVersion,
        output: outputData.output || outputData
      };
      
      fs.writeFileSync(
        path.join(tempBuildDir, inputFile),
        JSON.stringify(mergedBuildInfo)
      );
    }

    // 使用合并后的文件进行验证
    const report = await validateUpgradeSafety(tempBuildDir);

    console.log(`📊 验证结果:`);
    console.log(`   ✅ 通过验证的合约数: ${report.numPassed}`);
    console.log(`   📈 需要验证的合约总数: ${report.numTotal}\n`);

    // 清理临时目录
    fs.rmSync(tempBuildDir, { recursive: true, force: true });

    if (report.ok) {
      console.log('✅ 所有升级合约安全检查通过！');
      process.exit(0);
    } else {
      console.log('❌ 发现升级安全问题:\n');
      console.log(report.explain(true));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
    process.exit(1);
  }
}

main();
