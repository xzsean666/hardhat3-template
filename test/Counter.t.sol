// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Counter} from "../contracts/Counter.sol";
import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

contract CounterTest is Test {
    Counter counter;

    function setUp() public {
        counter = new Counter();
        vm.createSelectFork("https://rpc.minato.soneium.org", 17_000_000);
        console.log("Forked Ethereum at block 17,000,000");
    }

    function test_InitialValue() public {
        vm.startPrank(address(1));
        require(counter.x() == 0, "Initial value should be 0");
    }

    function testFuzz_Inc(uint8 x) public {
        for (uint8 i = 0; i < x; i++) {
            counter.inc();
        }
        require(
            counter.x() == x,
            "Value after calling inc x times should be x"
        );
    }

    function test_IncByZero() public {
        vm.expectRevert();
        counter.incBy(0);
    }
}
