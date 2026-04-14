Context:

An early stage web3 startup is launching a community utility token to reward early adopters and drive engagement on their platform. Rather than a one-time airdrop which historically gets drained by bots and concentrated in a handful of wallets within minutes - they want a continuous, fair distribution model: any community member can claim a small amount of tokens each day, but no single wallet can claim more than once every 24 hours.

This approach solves 2 problems:

 1) Bot and sybil resistance - a per wallet cooldown enforced on-chain means non script can repeatedly drain the supply, even if it controls many wallets, since each claim costs gas

 2) Sustained engagement - users have a reason to return daily, driving habitual interaction with the platform rather than a one-off claim The product team has also asked that the frontend show users exactly how long they must wait before their next claim, rather than just a disabled button - reducing support requests from confused users who don't understand why their transaction failed.

Future work:

As the platform scales, the team introduces a new objective:- Reward not just participation, but quality participation.
Instead of treating all wallets equally, the faucet evolves into a reputation-aware reward system where users with stronger on-platform behavior receive improved reward access over time. This helps to:
    - Incentivize meaningful engagement
    - Reduce farming behavior
    - Create long-term community alignment (TBD)

For testing purposes,
 - cooldown duration is set at 30 seconds

To view deployed contracts on blockscout,
 Utility tokens contract: https://eth-sepolia.blockscout.com/address/0x0346a974b8975a9925cb656ea158f7ee7544a577#code
 Faucet contract: https://eth-sepolia.blockscout.com/address/0x70c019acf5e8afd47dcc4a3cbdbbfb14d8ada158#code