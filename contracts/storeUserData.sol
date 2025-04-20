// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.0 < 0.9.0;
pragma abicoder v2;

// 记录添加 Liquidity 的细节
contract UserStorageData{
     struct TransactionStruck{
        address caller;
        address poolAddress;
        address tokenAddress0;
        address tokenAddress1;
     }

     TransactionStruck[] transactions;

     function addToBlockchain(address poolAddress, address tokenAddress0, address tokenAddress1) public{
        transactions.push(TransactionStruck(msg.sender, poolAddress, tokenAddress0, tokenAddress1));
     }

     function getAllTransactions()public view returns(TransactionStruck[] memory) {
        return transactions;
     }

}