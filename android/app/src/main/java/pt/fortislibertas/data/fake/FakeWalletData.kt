package pt.fortislibertas.data.fake

import java.math.BigDecimal
import java.time.LocalDate
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.BankMember
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.PaymentCard

/** Test wallet for local mode. Card colours match the card stack of FakeHomeData. */
object FakeWalletData {

    val banks = listOf(
        BankAccount(
            id = "bank-1", name = "Banco Demo", currency = "EUR",
            balance = BigDecimal("1250.40"), isFrozen = false, isOwner = true,
        ),
        BankAccount(
            id = "bank-2", name = "Banco Poupança", currency = "EUR",
            balance = BigDecimal("320.00"), isFrozen = false, isOwner = false, canAddCards = true,
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

    /** People in each test bank account. */
    val members = mapOf(
        "bank-1" to listOf(
            BankMember("0192f0a1-0000-7000-8000-000000000001", "Ana Silva", "anasilva", null, "owner"),
            BankMember("u-joao", "João Costa", "jcosta", null, "editor"),
            BankMember("u-rita", "Rita Pereira", null, null, "viewer"),
        ),
        "bank-2" to listOf(
            BankMember("u-marta", "Marta Silva", "msilva", null, "owner"),
            BankMember("0192f0a1-0000-7000-8000-000000000001", "Ana Silva", "anasilva", null, "editor"),
        ),
    )
}
