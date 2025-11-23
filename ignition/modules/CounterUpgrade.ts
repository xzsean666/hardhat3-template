import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CounterUpgradeableModule from "./CounterUpgradeable.js";

/**
 * UUPS 合约升级模块
 * 
 * 本模块用于将 Counter 合约升级到 CounterV2
 * 需要从 owner 账户发送升级交易
 */
export default buildModule("CounterUpgradeModule", (m) => {
  // 获取 owner 账户（第一个账户，和初始化时一样）
  const owner = m.getAccount(0);

  // 导入现有的部署结果
  const counterUpgradeable = m.useModule(CounterUpgradeableModule);

  // 部署新的实现合约 CounterV2
  const counterV2 = m.contract("CounterV2");

  // 在代理地址上使用 Counter 接口创建实例，然后调用 upgradeToAndCall
  // 由于是 UUPS，upgradeToAndCall 在实现合约中，通过代理委托调用
  const counterAtProxy = m.contractAt("Counter", counterUpgradeable.proxy, { 
    id: "CounterAtProxyForUpgrade" 
  });

  // 从 owner 账户调用 upgradeToAndCall 方法（会委托给实现合约）
  // 使用空数据，因为 CounterV2 不需要初始化
  m.call(counterAtProxy, "upgradeToAndCall", [counterV2, "0x"], {
    from: owner,
  });

  // 创建升级后的代理实例，使用 CounterV2 ABI
  const counterV2Proxy = m.contractAt("CounterV2", counterUpgradeable.proxy, { 
    id: "CounterV2Proxy" 
  });

  return {
    counterV2,
    proxy: counterUpgradeable.proxy,
    counterV2Proxy,
  };
});
