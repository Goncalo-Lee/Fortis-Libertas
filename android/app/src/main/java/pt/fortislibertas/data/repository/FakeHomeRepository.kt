package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.local.FakeHomeData
import pt.fortislibertas.data.model.HomeSummary

/** Modo local: devolve sempre os mesmos dados de teste. */
class FakeHomeRepository : HomeRepository {

    override suspend fun getHome(): HomeSummary {
        delay(400)
        return FakeHomeData.build()
    }
}
