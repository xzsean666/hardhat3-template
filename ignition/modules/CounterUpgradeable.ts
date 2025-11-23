import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * UUPS 可升级合约部署模块
 * 
 * 本模块使用 UUPS 代理模式部署 Counter 合约
 * 
 * 部署步骤：
 * 1. 部署 Counter 实现合约
 * 2. 部署 ERC1967Proxy 代理，指向 Counter 实现
 * 3. 通过代理调用 initialize() 方法初始化合约状态
 * 
 * 升级步骤：
 * 1. 部署新的 Counter 实现合约
 * 2. 通过代理调用 upgradeTo(newImplementation) 方法
 * 3. 只有合约 owner 可以执行升级
 */
export default buildModule("CounterUpgradeableModule", (m) => {
  // 部署实现合约
  const implementation = m.contract("Counter");

  // 编码 initialize() 调用数据
  const initializeData = m.encodeFunctionCall(implementation, "initialize", []);

  // 部署 ERC1967Proxy 代理，指向实现合约
  const proxy = m.contract("ERC1967Proxy", [implementation, initializeData]);

  // 创建通过代理访问的 Counter 合约实例
  const counterProxy = m.contractAt("Counter", proxy, { id: "CounterProxy" });

  return { 
    implementation,
    proxy,
    counterProxy,
  };
});
