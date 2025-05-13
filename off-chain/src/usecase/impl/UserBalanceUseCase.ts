import { Keypair } from "@solana/web3.js";
import { UserImpl } from "../../smart-contract-service/impl/UserImpl";

export class UserBalanceUseCase{
    private userImpl: UserImpl

    constructor(userKeypair:Keypair) {
        const userImpl = new UserImpl(userKeypair)
        this.userImpl = userImpl
    }

    async execute(amount:number){   

        try {
            console.log("casdasd")
            this.userImpl.makeApport(amount)

            this.userImpl.authorizateTransactionByPDA()

            console.log("User made apport and authorized transaction successfully")
        } catch (error) {
            console.error("execute error -> ",error)
        }

    }

    async addBalance(amount:number){    
        try {
            
            await this.userImpl.addBalance(amount)

            console.log("User added balance successfully")
        } catch (error) {
            console.error("execute error -> ",error)
        }
    }
}