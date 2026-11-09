package pt.fortislibertas.data.fake

import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.PaymentCard
import java.math.BigDecimal
import java.time.LocalDate

/** Test wallet for local mode. Card colours match the card stack of FakeHomeData. */
object FakeWalletData {

    val banks = listOf(
        BankAccount(
            id = "bank-1", name = "Banco Demo", currency = "EUR",
            balance = BigDecimal("1250.40"), isFrozen = false, isOwner = true,
        ),
        BankAccount(
            id = "bank-2", name = "Banco Poupança", currency = "EUR",
            balance = BigDecimal("320.00"), isFrozen = false, isOwner = false,
        ),
    )

    val cards = listOf(
        PaymentCard(
            id = "card-1", bankId = "bank-1", bankName = "Banco Demo", colorHex = "#FFE761",
            cardholderName = "Ana Silva", type = CardType.DEBIT, last4 = "7642",
            expiryDate = LocalDate.now().plusYears(2).withDayOfMonth(1), isFrozen = false, canManage = true,
        ),
        PaymentCard(
            id = "card-2", bankId = "bank-1", bankName = "Banco Demo", colorHex = "#2092E9",
            cardholderName = "Ana Silva", type = CardType.CREDIT, last4 = "5123",
            expiryDate = LocalDate.now().plusYears(1).withDayOfMonth(1), isFrozen = true, canManage = true,
        ),
        PaymentCard(
            id = "card-3", bankId = "bank-2", bankName = "Banco Poupança", colorHex = "#76C352",
            cardholderName = "Ana Silva", type = CardType.DEBIT, last4 = "3413",
            expiryDate = LocalDate.now().minusMonths(2).withDayOfMonth(1), isFrozen = false, canManage = false,
        ),
    )
}
