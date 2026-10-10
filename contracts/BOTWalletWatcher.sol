// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BOTWalletWatcher
 * @notice On-chain watchlist registry and notification preference manager on BOT Chain (Chain ID: 968).
 * Users record their watched wallets, labels, and notification criteria on-chain.
 * Off-chain indexers and Telegram bots listen to contract events and query watchlists
 * to dispatch real-time alerts when activity occurs.
 */
contract BOTWalletWatcher {
    struct WatchConfig {
        address target;
        string label;
        bool watchIncoming;
        bool watchOutgoing;
        bool watchERC20;
        bool watchNFT;
        uint256 minThresholdWei; // Minimum BOT/token transfer amount to trigger alert (0 = all)
        uint256 addedAt;
        bool active;
    }

    // Mapping: subscriber => target wallet => WatchConfig
    mapping(address => mapping(address => WatchConfig)) private _watchConfigs;
    // Mapping: subscriber => list of watched target addresses
    mapping(address => address[]) private _userWatchlist;
    // Mapping: target wallet => list of subscriber addresses
    mapping(address => address[]) private _targetSubscribers;
    // Master registry of unique monitored target addresses
    address[] private _allMonitoredTargets;
    mapping(address => bool) private _isGloballyMonitored;

    // Events
    event WalletWatched(
        address indexed subscriber,
        address indexed target,
        string label,
        uint256 minThresholdWei,
        bool watchIncoming,
        bool watchOutgoing,
        bool watchERC20,
        bool watchNFT,
        uint256 timestamp
    );

    event WalletUnwatched(
        address indexed subscriber,
        address indexed target,
        uint256 timestamp
    );

    event PreferencesUpdated(
        address indexed subscriber,
        address indexed target,
        string label,
        uint256 minThresholdWei,
        bool watchIncoming,
        bool watchOutgoing,
        bool watchERC20,
        bool watchNFT,
        uint256 timestamp
    );

    // Errors
    error InvalidAddress();
    error AlreadyWatching();
    error NotWatching();
    error EmptyLabel();

    /**
     * @notice Add a new target wallet to your watchlist with alert preferences.
     * @param target Address to monitor.
     * @param label Human-friendly label (e.g. "DAO Treasury", "Personal Cold Wallet").
     * @param watchIncoming Alert on incoming transfers.
     * @param watchOutgoing Alert on outgoing transfers.
     * @param watchERC20 Alert on ERC-20 token movements.
     * @param watchNFT Alert on ERC-721/1155 NFT movements.
     * @param minThresholdWei Minimum value in Wei to trigger alert (0 for all).
     */
    function watchWallet(
        address target,
        string calldata label,
        bool watchIncoming,
        bool watchOutgoing,
        bool watchERC20,
        bool watchNFT,
        uint256 minThresholdWei
    ) external {
        if (target == address(0)) revert InvalidAddress();
        if (bytes(label).length == 0) revert EmptyLabel();
        if (_watchConfigs[msg.sender][target].active) revert AlreadyWatching();

        WatchConfig memory newConfig = WatchConfig({
            target: target,
            label: label,
            watchIncoming: watchIncoming,
            watchOutgoing: watchOutgoing,
            watchERC20: watchERC20,
            watchNFT: watchNFT,
            minThresholdWei: minThresholdWei,
            addedAt: block.timestamp,
            active: true
        });

        _watchConfigs[msg.sender][target] = newConfig;
        _userWatchlist[msg.sender].push(target);
        _targetSubscribers[target].push(msg.sender);

        if (!_isGloballyMonitored[target]) {
            _isGloballyMonitored[target] = true;
            _allMonitoredTargets.push(target);
        }

        emit WalletWatched(
            msg.sender,
            target,
            label,
            minThresholdWei,
            watchIncoming,
            watchOutgoing,
            watchERC20,
            watchNFT,
            block.timestamp
        );
    }

    /**
     * @notice Update alert preferences and label for an already watched wallet.
     */
    function updatePreferences(
        address target,
        string calldata label,
        bool watchIncoming,
        bool watchOutgoing,
        bool watchERC20,
        bool watchNFT,
        uint256 minThresholdWei
    ) external {
        if (!_watchConfigs[msg.sender][target].active) revert NotWatching();
        if (bytes(label).length == 0) revert EmptyLabel();

        WatchConfig storage config = _watchConfigs[msg.sender][target];
        config.label = label;
        config.watchIncoming = watchIncoming;
        config.watchOutgoing = watchOutgoing;
        config.watchERC20 = watchERC20;
        config.watchNFT = watchNFT;
        config.minThresholdWei = minThresholdWei;

        emit PreferencesUpdated(
            msg.sender,
            target,
            label,
            minThresholdWei,
            watchIncoming,
            watchOutgoing,
            watchERC20,
            watchNFT,
            block.timestamp
        );
    }

    /**
     * @notice Remove a target wallet from the subscriber's watchlist.
     */
    function unwatchWallet(address target) external {
        if (!_watchConfigs[msg.sender][target].active) revert NotWatching();

        _watchConfigs[msg.sender][target].active = false;

        // Remove from _userWatchlist
        address[] storage userList = _userWatchlist[msg.sender];
        uint256 len = userList.length;
        for (uint256 i = 0; i < len; i++) {
            if (userList[i] == target) {
                userList[i] = userList[len - 1];
                userList.pop();
                break;
            }
        }

        // Remove from _targetSubscribers
        address[] storage subscribers = _targetSubscribers[target];
        uint256 subLen = subscribers.length;
        for (uint256 i = 0; i < subLen; i++) {
            if (subscribers[i] == msg.sender) {
                subscribers[i] = subscribers[subLen - 1];
                subscribers.pop();
                break;
            }
        }

        emit WalletUnwatched(msg.sender, target, block.timestamp);
    }

    /**
     * @notice Retrieve the full active watchlist for a subscriber.
     */
    function getMyWatchlist(address subscriber) external view returns (WatchConfig[] memory) {
        address[] storage targets = _userWatchlist[subscriber];
        uint256 count = 0;

        for (uint256 i = 0; i < targets.length; i++) {
            if (_watchConfigs[subscriber][targets[i]].active) {
                count++;
            }
        }

        WatchConfig[] memory list = new WatchConfig[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < targets.length; i++) {
            if (_watchConfigs[subscriber][targets[i]].active) {
                list[index] = _watchConfigs[subscriber][targets[i]];
                index++;
            }
        }
        return list;
    }

    /**
     * @notice Check if a subscriber is watching a target.
     */
    function isWatching(address subscriber, address target) external view returns (bool) {
        return _watchConfigs[subscriber][target].active;
    }

    /**
     * @notice Get watch config for a specific subscriber and target.
     */
    function getWatchConfig(address subscriber, address target) external view returns (WatchConfig memory) {
        return _watchConfigs[subscriber][target];
    }

    /**
     * @notice Get all subscribers watching a specific target address (used by off-chain indexer).
     */
    function getSubscribers(address target) external view returns (address[] memory) {
        return _targetSubscribers[target];
    }

    /**
     * @notice Returns total number of watched targets for a user.
     */
    function getWatchCount(address subscriber) external view returns (uint256) {
        return _userWatchlist[subscriber].length;
    }

    /**
     * @notice Returns all globally monitored targets across the network.
     */
    function getAllMonitoredTargets() external view returns (address[] memory) {
        return _allMonitoredTargets;
    }
}
