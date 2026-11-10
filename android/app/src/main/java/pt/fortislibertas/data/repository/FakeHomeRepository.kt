package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeHomeData
import pt.fortislibertas.data.model.HomeSummary

/** Local mode: always returns the same test data. */
class FakeHomeRepository : HomeRepository {

    override suspend fun getHome(): HomeSummary {
        delay(400)
        return FakeHomeData.build()
    }
}
