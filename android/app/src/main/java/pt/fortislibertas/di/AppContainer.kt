package pt.fortislibertas.di

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import pt.fortislibertas.BuildConfig
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.local.FakeData
import pt.fortislibertas.data.remote.AuthInterceptor
import pt.fortislibertas.data.remote.FortisApi
import pt.fortislibertas.data.remote.HomeApi
import pt.fortislibertas.data.remote.RecordApi
import pt.fortislibertas.data.repository.FakeHomeRepository
import pt.fortislibertas.data.repository.FakeProfileRepository
import pt.fortislibertas.data.repository.FakeRecordRepository
import pt.fortislibertas.data.repository.HomeRepository
import pt.fortislibertas.data.repository.ProfileRepository
import pt.fortislibertas.data.repository.RecordRepository
import pt.fortislibertas.data.repository.RemoteHomeRepository
import pt.fortislibertas.data.repository.RemoteProfileRepository
import pt.fortislibertas.data.repository.RemoteRecordRepository
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Cria as dependências da app num só sítio.
 * É aqui (e só aqui) que se escolhe entre dados locais e API.
 */
class AppContainer(context: Context) {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val accountStore = AccountStore(context)

    private val json = Json { ignoreUnknownKeys = true }

    private val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(accountStore))
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    // Em debug mostra os pedidos no Logcat (sem o token: ver redactHeader)
                    level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                    else HttpLoggingInterceptor.Level.NONE
                    redactHeader("Authorization")
                },
            )
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_URL)
            .client(okHttp)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    // ── Repositórios ─────────────────────────────────────

    val profileRepository: ProfileRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeProfileRepository(accountStore)
        else RemoteProfileRepository(retrofit.create(FortisApi::class.java))
    val recordRepository: RecordRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeRecordRepository()
        else RemoteRecordRepository(retrofit.create(RecordApi::class.java))

    val homeRepository: HomeRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeHomeRepository()
        else RemoteHomeRepository(retrofit.create(HomeApi::class.java))

    init {
        if (BuildConfig.USE_FAKE_DATA) {
            appScope.launch { accountStore.seedIfEmpty(FakeData.accounts) }
        }
    }
}

