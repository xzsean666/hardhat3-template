import { validateUpgradeSafety } from '@openzeppelin/upgrades-core';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
使用方法:
  pnpm validate-upgrades:compare <OldContract> <NewContract>

例如:
  pnpm validate-upgrades:compare Counter CounterV2

此脚本验证新合约是否可以安全地升级旧合约（存储布局兼容性检查）
    `);
    process.exit(1);
  }

  const oldContractName = args[0];
  const newContractName = args[1];

  console.log(`\n🔍 验证升级兼容性...\n`);
  console.log(`比较: ${oldContractName} → ${newContractName}\n`);

  try {
    const buildInfoDir = path.join(__dirname, '../artifacts/build-info');
    const files = fs.readdirSync(buildInfoDir);
    
    // 创建临时目录合并 Hardhat 3 的 input 和 output 文件
    const tempBuildDir = path.join(__dirname, '../artifacts/temp-build-info');
    if (fs.existsSync(tempBuildDir)) {
      fs.rmSync(tempBuildDir, { recursive: true });
    }
    fs.mkdirSync(tempBuildDir, { recursive: true });

    const inputFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.output.json'));
    
    // 合并文件
    for (const inputFile of inputFiles) {
      const inputPath = path.join(buildInfoDir, inputFile);
      const outputPath = inputPath.replace('.json', '.output.json');
      
      if (!fs.existsSync(outputPath)) {
        continue;
      }

      const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
      const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      
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

    // 验证旧版本合约
    console.log(`📋 ${oldContractName} 升级安全检查:`);
    try {
      const oldReport = await validateUpgradeSafety(
        tempBuildDir,
        oldContractName
      );
      
      if (oldReport.ok) {
        console.log('   ✅ 通过\n');
      } else {
        console.log('   ❌ 失败');
        console.log(oldReport.explain(true));
        fs.rmSync(tempBuildDir, { recursive: true, force: true });
        process.exit(1);
      }
    } catch (err: any) {
      console.log(`   ⚠️  无法验证: ${err.message}\n`);
    }

    // 验证新版本合约
    console.log(`📋 ${newContractName} 升级安全检查:`);
    try {
      const newReport = await validateUpgradeSafety(
        tempBuildDir,
        newContractName
      );
      
      if (newReport.ok) {
        console.log('   ✅ 通过\n');
      } else {
        console.log('   ❌ 失败');
        console.log(newReport.explain(true));
        fs.rmSync(tempBuildDir, { recursive: true, force: true });
        process.exit(1);
      }
    } catch (err: any) {
      console.log(`   ⚠️  无法验证: ${err.message}\n`);
    }

    // 验证存储布局兼容性
    console.log(`🔗 存储布局兼容性检查:\n`);
    
    const report = await validateUpgradeSafety(
      tempBuildDir,
      newContractName,
      oldContractName
    );

    // 清理临时目录
    fs.rmSync(tempBuildDir, { recursive: true, force: true });

    if (report.ok) {
      console.log('   ✅ 存储布局兼容');
      console.log('\n✅ 升级兼容性验证通过！可以安全地将合约从');
      console.log(`   ${oldContractName} 升级到 ${newContractName}`);
      process.exit(0);
    } else {
      console.log('   ❌ 存储布局不兼容');
      console.log(report.explain(true));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
    process.exit(1);
  }
}

main();
