// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @custom:oz-upgrades-from Counter
contract CounterV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint public constant VERSION = 2;
    uint public newVar;
    uint public x;

    event Increment(uint by);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
    }

    function inc() public {
        x++;
        emit Increment(1);
    }

    function incBy(uint by) public {
        require(by > 0, "incBy: increment should be positive");
        x += by;
        emit Increment(by);
    }

    // 新增功能：乘法操作
    function multiplyBy(uint factor) public {
        require(factor > 0, "multiplyBy: factor should be positive");
        x *= factor;
        emit Increment(x);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
