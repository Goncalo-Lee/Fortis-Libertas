package pt.fortislibertas.di

import android.content.Context
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import pt.fortislibertas.BuildConfig
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.local.DashboardStore
import pt.fortislibertas.data.local.SettingsStore
import pt.fortislibertas.data.remote.AuthApi
import pt.fortislibertas.data.remote.AuthInterceptor
import pt.fortislibertas.data.remote.DashboardApi
import pt.fortislibertas.data.remote.FinanceApi
import pt.fortislibertas.data.remote.FortisApi
import pt.fortislibertas.data.remote.NotificationApi
import pt.fortislibertas.data.remote.WalletApi
import pt.fortislibertas.data.repository.AuthRepository
import pt.fortislibertas.data.repository.DashboardRepository
import pt.fortislibertas.data.repository.FakeAuthRepository
import pt.fortislibertas.data.repository.FakeDashboardRepository
import pt.fortislibertas.data.repository.FakeHomeRepository
import pt.fortislibertas.data.repository.FakeNotificationRepository
import pt.fortislibertas.data.repository.FakeProfileRepository
import pt.fortislibertas.data.repository.FakeRecordRepository
import pt.fortislibertas.data.repository.FakeTransactionRepository
import pt.fortislibertas.data.repository.FakeWalletRepository
import pt.fortislibertas.data.repository.HomeRepository
import pt.fortislibertas.data.repository.NotificationRepository
import pt.fortislibertas.data.repository.ProfileRepository
import pt.fortislibertas.data.repository.RecordRepository
import pt.fortislibertas.data.repository.RemoteAuthRepository
import pt.fortislibertas.data.repository.RemoteDashboardRepository
import pt.fortislibertas.data.repository.RemoteHomeRepository
import pt.fortislibertas.data.repository.RemoteNotificationRepository
import pt.fortislibertas.data.repository.RemoteProfileRepository
import pt.fortislibertas.data.repository.RemoteRecordRepository
import pt.fortislibertas.data.repository.RemoteTransactionRepository
import pt.fortislibertas.data.repository.RemoteWalletRepository
import pt.fortislibertas.data.repository.TransactionRepository
import pt.fortislibertas.data.repository.WalletRepository
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Creates the app dependencies in one place.
 * This is where (and the only place where) local data or the API is chosen.
 */
class AppContainer(context: Context) {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val accountStore = AccountStore(context)
    val settingsStore = SettingsStore(context)

    /** Active dashboard of each account: every screen that reads records uses it. */
    val dashboardStore = DashboardStore(context, accountStore)

    private val json = Json { ignoreUnknownKeys = true }

    private val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(accountStore))
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    // In debug, shows the requests in Logcat (without the token: see redactHeader)
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

    /** Dashboard data shared by Home, Transactions, New record and Profile. */
    private val financeApi: FinanceApi by lazy { retrofit.create(FinanceApi::class.java) }

    // ── Repositories ────────────────────────────────────

    /**
     * The active dashboard for the API calls. If none was chosen yet (the app opens on the Home,
     * before the Dashboard tab), the first active dashboard of the account is picked and saved.
     * Called only when a request is made, so dashboardRepository is ready by then.
     */
    private suspend fun activeDashboardId(): String? =
        dashboardStore.current() ?: try {
            dashboardRepository.getDashboards()
                .firstOrNull { it.isActive }
                ?.id
                ?.also { dashboardStore.setActive(it) }
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            null
        }

    val authRepository: AuthRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeAuthRepository()
        else RemoteAuthRepository(retrofit.create(AuthApi::class.java))

    val profileRepository: ProfileRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeProfileRepository(accountStore)
        else RemoteProfileRepository(retrofit.create(FortisApi::class.java), financeApi) { activeDashboardId() }
    val recordRepository: RecordRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeRecordRepository()
        else RemoteRecordRepository(financeApi) { activeDashboardId() }

    val dashboardRepository: DashboardRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeDashboardRepository()
        else RemoteDashboardRepository(retrofit.create(DashboardApi::class.java))

    val walletRepository: WalletRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeWalletRepository()
        else RemoteWalletRepository(retrofit.create(WalletApi::class.java), accountStore)

    // After walletRepository: the Home uses it for the card stack
    val homeRepository: HomeRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeHomeRepository()
        else RemoteHomeRepository(financeApi, walletRepository) { activeDashboardId() }

    val notificationRepository: NotificationRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeNotificationRepository()
        else RemoteNotificationRepository(retrofit.create(NotificationApi::class.java))

    val transactionRepository: TransactionRepository =
        if (BuildConfig.USE_FAKE_DATA) FakeTransactionRepository()
        else RemoteTransactionRepository(financeApi) { activeDashboardId() }

    /**
     * Account clean-up when the app starts. FortisApp waits for it before choosing
     * the first screen, so it never opens with an account that is about to be removed.
     */
    val startup: Job = appScope.launch {
        accountStore.clearSessionOnly()              // "Remember me" off → that session ends here
        if (BuildConfig.USE_FAKE_DATA) accountStore.seedIfEmpty(FakeAccountData.accounts)
    }
}

