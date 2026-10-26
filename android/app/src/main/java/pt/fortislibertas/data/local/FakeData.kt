package pt.fortislibertas.data.local

import pt.fortislibertas.data.model.SavedAccount
import pt.fortislibertas.data.model.UserProfile
import java.math.BigDecimal

/** Dados de teste do modo local (USE_FAKE_DATA = true). */
object FakeData {

    private const val PERSONAL_ID = "0192f0a1-0000-7000-8000-000000000001"
    private const val COMPANY_ID = "0192f0a1-0000-7000-8000-000000000002"

    val accounts = listOf(
        SavedAccount(
            id = PERSONAL_ID,
            fullName = "Ana Silva",
            email = "ana.silva@example.com",
            token = "fake-token-personal",
        ),
        SavedAccount(
            id = COMPANY_ID,
            fullName = "Empresa Demo",
            email = "financas@empresa-demo.pt",
            token = "fake-token-company",
        ),
    )

    val profiles: Map<String, UserProfile> = mapOf(
        PERSONAL_ID to UserProfile(
            id = PERSONAL_ID,
            fullName = "Ana Silva",
            userName = "anasilva",
            email = "ana.silva@example.com",
            imageUrl = null,
            accountBalance = BigDecimal("1250.40"),
            amountSaved = BigDecimal("200.00"),
        ),
        COMPANY_ID to UserProfile(
            id = COMPANY_ID,
            fullName = "Empresa Demo",
            userName = "empresademo",
            email = "financas@empresa-demo.pt",
            imageUrl = null,
            accountBalance = BigDecimal("18430.00"),
            amountSaved = BigDecimal("5000.00"),
        ),
    )
}
