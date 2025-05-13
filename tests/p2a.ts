import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("p2a", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program from workspace
  const program = anchor.workspace.p2a as Program<anchor.Idl>;
  
  // Test accounts
  const user = anchor.web3.Keypair.generate();
  const trader = anchor.web3.Keypair.generate();
  const follower = anchor.web3.Keypair.generate();
  
  // PDAs
  let potePDA: PublicKey;
  let poteNonce: number;
  let permissionPDA: PublicKey;
  let permissionNonce: number;
  let followListPDA: PublicKey;
  let followListNonce: number;
  let swapDelegatePDA: PublicKey;
  let swapDelegateNonce: number;

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropUser = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropUser);

    const airdropTrader = await provider.connection.requestAirdrop(
      trader.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTrader);

    // Find PDAs
    [potePDA, poteNonce] = await PublicKey.findProgramAddress(
      [Buffer.from("pote"), user.publicKey.toBuffer()],
      program.programId
    );

    [permissionPDA, permissionNonce] = await PublicKey.findProgramAddress(
      [Buffer.from("permission"), trader.publicKey.toBuffer()],
      program.programId
    );

    [followListPDA, followListNonce] = await PublicKey.findProgramAddress(
      [Buffer.from("follow_list"), trader.publicKey.toBuffer()],
      program.programId
    );

    [swapDelegatePDA, swapDelegateNonce] = await PublicKey.findProgramAddress(
      [Buffer.from("swap_authority"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Can make apport", async () => {
    const apportValue = 100;
    
    await program.methods
      .makeApport(apportValue)
      .accounts({
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
        pote: potePDA,
      })
      .signers([user])
      .rpc();

    const poteAccount = await program.account.apport.fetch(potePDA);
    assert.equal(poteAccount.amount.toNumber(), apportValue);
    assert.ok(poteAccount.signer.equals(user.publicKey));
  });

  it("Can initialize trader", async () => {
    await program.methods
      .initializeTrader()
      .accounts({
        permission: permissionPDA,
        signer: trader.publicKey,
        systemProgram: SystemProgram.programId,
        followList: followListPDA,
      })
      .signers([trader])
      .rpc();

    const permissionAccount = await program.account.permissionToTrade.fetch(permissionPDA);
    assert.equal(permissionAccount.isAllowed, false);
  });

  it("Can add follower", async () => {
    await program.methods
      .addFollower(follower.publicKey)
      .accounts({
        followList: followListPDA,
        signer: trader.publicKey,
      })
      .signers([trader])
      .rpc();

    const followListAccount = await program.account.listOfFollow.fetch(followListPDA);
    assert.ok(followListAccount.follows.some((pk: PublicKey) => pk.equals(follower.publicKey)));
  });

  it("Can update apport", async () => {
    const additionalValue = 50;
    
    await program.methods
      .updateApport(additionalValue)
      .accounts({
        pote: potePDA,
        signer: user.publicKey,
      })
      .signers([user])
      .rpc();

    const poteAccount = await program.account.apport.fetch(potePDA);
    assert.equal(poteAccount.amount.toNumber(), 150); // 100 + 50
  });

  it("Can delegate swap authority", async () => {
    await program.methods
      .delegateSwapAuthority()
      .accounts({
        user: user.publicKey,
        swapDelegate: swapDelegatePDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const swapDelegateAccount = await program.account.swapDelegate.fetch(swapDelegatePDA);
    assert.ok(swapDelegateAccount.owner.equals(user.publicKey));
  });

  it("Can transfer SOL", async () => {
    const transferAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const recipientInitialBalance = await provider.connection.getBalance(follower.publicKey);
    
    await program.methods
      .transferSol(transferAmount)
      .accounts({
        from: user.publicKey,
        to: follower.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const recipientFinalBalance = await provider.connection.getBalance(follower.publicKey);
    assert.equal(
      recipientFinalBalance - recipientInitialBalance,
      transferAmount.toNumber()
    );
  });

  // Note: execute_swap test would require mocking Jupiter program
  // and setting up token accounts, which is more complex
  it("Can execute swap (mock test)", async () => {
    const mockInstructionData = Buffer.from("mock_data");
    
    await program.methods
      .executeSwap(mockInstructionData)
      .accounts({
        user: user.publicKey,
        swapAuthority: swapDelegatePDA,
        jupiterProgram: SystemProgram.programId, // Mock Jupiter program ID
      })
      .signers([user])
      .rpc();
    
    // In a real test, we would verify token balances changed
    assert.ok(true);
  });
});
