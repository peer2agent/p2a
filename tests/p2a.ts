import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { P2a } from "../target/types/p2a";
import { assert } from "chai";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

describe("p2a", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2a as Program<P2a>;
  const user = anchor.web3.Keypair.generate();
  const trader = anchor.web3.Keypair.generate();

  let [potePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pote"), user.publicKey.toBuffer()],
    program.programId
  );

  let [permissionPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("permission"), trader.publicKey.toBuffer()],
    program.programId
  );

  let [followListPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("follow_list"), trader.publicKey.toBuffer()],
    program.programId
  );

  it("Faz o primeiro aporte", async () => {
    const airdrop = await provider.connection.requestAirdrop(user.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdrop);

    await program.methods
      .makeApport(500)
      .accounts({
        signer: user.publicKey,
        })
      .signers([user])
      .rpc();

    const pote = await program.account.apport.fetch(potePda);
    assert.equal(pote.amount, 500);
  });

  it("Atualiza (acumula) o valor do pote com +200", async () => {
    await program.methods
      .updateApport(200)
      .accounts({
        signer: user.publicKey
      })
      .signers([user])
      .rpc();

    const pote = await program.account.apport.fetch(potePda);
    assert.equal(pote.amount, 700);
  });

  it("Inicializa o trader (permission + follow_list)", async () => {
    const airdrop = await provider.connection.requestAirdrop(trader.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdrop);

    await program.methods
      .initializeTrader()
      .accounts({
        signer: trader.publicKey,
        })
      .signers([trader])
      .rpc();

    const permission = await program.account.permissionToTrade.fetch(permissionPda);
    assert.isTrue(permission.isAllowed);
  });

  

  it("Cria a autoridade de swap via PDA", async () => {
    const [swapPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("swap_authority"), user.publicKey.toBuffer()],
      program.programId
    );
  
    await program.methods
      .delegateSwapAuthority()
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
  
    const acc = await program.account.swapDelegate.fetch(swapPda);
    assert.ok(acc.owner.equals(user.publicKey));
  });

});
