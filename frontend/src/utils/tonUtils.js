import { beginCell, Address } from '@ton/ton';

// Fetch NFTs from TonAPI (Public)
export const fetchAccountNfts = async (address) => {
    try {
        // Using tonapi.io (Rate limited free tier, but works for demo)
        const res = await fetch(`https://tonapi.io/v2/accounts/${address}/nfts?collection=0:...&limit=10`);
        // Note: collection arg filters specific collection. Omitting it gets all.
        // For Gifts, we ideally filter by the Telegram Gifts collection address if known, or just show all.

        const data = await res.json();
        return data.nft_items || [];
    } catch (e) {
        console.error("Failed to fetch NFTs", e);
        return [];
    }
};

// Construct NFT Transfer Body
export const createNftTransferBody = (newOwnerAddress, forwardPayloadComment) => {
    // OpCode: 0x5fcc3d14 (Ownership Assigned / Transfer)
    // QueryId: 0
    // NewOwner: MsgAddress
    // ResponseAddress: MsgAddress (Return excess gas to original owner)
    // CustomPayload: Maybe Ref (null)
    // ForwardAmount: Coins (0.05 TON)
    // ForwardPayload: Either Ref or Slice. If comment, usually Slice with 0 prefix.

    // Using @ton/ton builder
    const commentCell = beginCell()
        .storeUint(0, 32) // Text comment opcode
        .storeStringTail(forwardPayloadComment)
        .endCell();

    const body = beginCell()
        .storeUint(0x5fcc3d14, 32) // OpCode transfer
        .storeUint(0, 64) // QueryId
        .storeAddress(Address.parse(newOwnerAddress)) // New Owner (Bot)
        .storeAddress(null) // Response Address (Bot? Or Sender?) Usually Sender.
        .storeBit(0) // Null custom payload
        .storeCoins(50000000) // Forward Amount (0.05 TON) to notify Bot
        .storeBit(1) // Forward payload is a reference? Or right here?
        // Actually, logic varies. Let's wrap comment in cell for safety as ref.
        .storeRef(commentCell)
        .endCell();

    return body.toBoc().toString('base64');
};
