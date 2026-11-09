package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.CardUpdate
import pt.fortislibertas.data.model.Wallet

/** What the Cards / Banks screen needs. Implemented as Fake (local) and Remote (API). */
interface WalletRepository {
    suspend fun getWallet(): Wallet
    suspend fun freezeCard(cardId: String)
    suspend fun unfreezeCard(cardId: String)
    suspend fun updateCard(cardId: String, update: CardUpdate)
    suspend fun deleteCard(cardId: String)
}
