package pt.atec.goncalo.fortislibertas_appandroid.di

import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import pt.atec.goncalo.fortislibertas_appandroid.data.local.TokenStore
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.AuthInterceptor
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.FortisApi
import pt.atec.goncalo.fortislibertas_appandroid.data.repository.FakeFinanceRepository
import pt.atec.goncalo.fortislibertas_appandroid.data.repository.FinanceRepository
import pt.atec.goncalo.fortislibertas_appandroid.data.repository.RemoteFinanceRepository
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

interface AppContainer {
    val financeRepository: FinanceRepository
}

// baseUrl por defeito: 10.0.2.2 e o localhost do PC visto a partir do emulador Android
class DefaultAppContainer(
    private val tokenStore: TokenStore,
    private val useFakeData: Boolean,
    private val baseUrl: String = "http://10.0.2.2:8080/api/"
) : AppContainer {

    override val financeRepository: FinanceRepository by lazy {
        if (useFakeData) {
            FakeFinanceRepository()
        } else {
            val client = OkHttpClient.Builder()
                .addInterceptor(AuthInterceptor { tokenStore.getToken() })
                .build()

            val json = Json { ignoreUnknownKeys = true }

            val retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()

            RemoteFinanceRepository(retrofit.create(FortisApi::class.java))
        }
    }
}
