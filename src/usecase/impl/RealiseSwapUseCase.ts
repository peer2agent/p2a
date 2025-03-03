import {JupiterImpl} from "../../trade-token-service/impl/JupiterSwapImpl";
import { Connection, Keypair, PublicKey,LAMPORTS_PER_SOL} from "@solana/web3.js";
import bs58 from 'bs58';
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";



export class RealiseSwap {
    public async usecase(trackingInfoInputDTO: TrackingInfoInputDTO): Promise<any> {
        
        const keypairBase58 = process.env.SECRET_KEY!!;
        
        const keypairBytes = bs58.decode(keypairBase58);
        
        const keypair = Keypair.fromSecretKey(keypairBytes);

        const wallets = trackingInfoInputDTO.trackedWallet.map(wallets => wallets.wallet)
        
        const trackingInfo = new WalletTrackerImpl();
        
        await trackingInfo.createWebhook(wallets);

        try {
            await Promise.all(trackingInfoInputDTO.trackedWallet.map(async (wallet) => {

                const walletDTO = await trackingInfo.getDistribution(wallet.wallet);
                
                const swapHistory = walletDTO.filteredTokens
    
                await Promise.all(swapHistory.map(async (token) => { 
                    
                    if (!token.id || token.id.length < 32 || token.id.length > 44) {
                        console.error(`Skipping swap: Invalid token ID - ${token.id}`);
                        return;
                    }

                    const outputMint = new PublicKey(token.id);

                    const trade = new JupiterImpl({
                        outputMintTokenAddress: outputMint,
                        inputMintTokenAddress: new PublicKey("So11111111111111111111111111111111111111112"),
                        connection: new Connection(trackingInfoInputDTO.configTrade!!),
                        ownerUserKey:keypair,
                        isSimulation: trackingInfoInputDTO.isSimulation
                    });

                    var mode = trade.selectMode(walletDTO, token.percentage);

                    const swapAmount = Number(Math.floor(wallet.value * mode * LAMPORTS_PER_SOL));

                    if (!swapAmount || swapAmount <= 0) {
                        console.warn(`Skipping swap due to low amount: ${swapAmount}`);
                        return;
                    }

                    console.log(`Realise Swap: ${wallet.wallet} --> ${swapAmount}`);

                    try {
                        await trade.realiseSwap(swapAmount);
                    } catch (error) {
                        console.error(`Swap failed for ${wallet.wallet}:`, error);
                    }
                }));
            }));
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error during RealiseSwap execution.`, error);
        } finally {
            return "Completed RealiseSwap";
        }
    }

}



