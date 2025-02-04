// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    address[] public owners;
    uint256 public required;

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    uint256 public transactionCount;

    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
    }

    event Submission(uint256 indexed transactionId);
    event Confirmation(address indexed sender, uint256 indexed transactionId);
    event Execution(uint256 indexed transactionId);
    event ExecutionFailure(uint256 indexed transactionId);
    event Deposit(address indexed sender, uint256 amount);

    modifier onlyOwner() {
        require(isOwner(msg.sender), "Not an owner");
        _;
    }

    modifier transactionExists(uint256 transactionId) {
        require(transactions[transactionId].destination != address(0), "Transaction does not exist");
        _;
    }

    modifier confirmed(uint256 transactionId, address owner) {
        require(confirmations[transactionId][owner], "Transaction not confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "At least one owner required");
        require(_required > 0 && _required <= _owners.length, "Invalid required confirmations");

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            owners.push(_owners[i]);
        }

        required = _required;
    }

    function isOwner(address addr) public view returns (bool) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == addr) {
                return true;
            }
        }
        return false;
    }

    function submitTransaction(address destination, uint256 value, bytes memory data) 
        public onlyOwner returns (uint256) 
    {
        uint256 transactionId = transactionCount++;
        transactions[transactionId] = Transaction(destination, value, data, false);
        emit Submission(transactionId);
        return transactionId;
    }

    function confirmTransaction(uint256 transactionId) 
        public onlyOwner transactionExists(transactionId) 
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
    }

    function executeTransaction(uint256 transactionId) 
        public onlyOwner transactionExists(transactionId) confirmed(transactionId, msg.sender) 
    {
        Transaction storage txn = transactions[transactionId];

        require(!txn.executed, "Transaction already executed");

        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                count += 1;
            }
        }

        require(count >= required, "Not enough confirmations");

        txn.executed = true;
        (bool success,) = txn.destination.call{value: txn.value}(txn.data);
        if (success) {
            emit Execution(transactionId);
        } else {
            txn.executed = false;
            emit ExecutionFailure(transactionId);
        }
    }

    // Permet au multisig de recevoir des BNB
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
