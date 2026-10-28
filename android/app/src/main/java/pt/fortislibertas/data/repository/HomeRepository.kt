package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.HomeSummary

interface HomeRepository {
    suspend fun getHome(): HomeSummary
}
