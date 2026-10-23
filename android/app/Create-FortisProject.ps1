#Requires -Version 5.1
<#
.SYNOPSIS
    Gera a estrutura base do projeto FortisLibertas (Android / Kotlin / Jetpack Compose).

.DESCRIPTION
    Cria pastas e ficheiros Kotlin com declaracoes validas e pacotes corretos.
    Ficheiros ja existentes sao ignorados, salvo se usar -Force.

.EXAMPLE
    .\Create-FortisProject.ps1

.EXAMPLE
    .\Create-FortisProject.ps1 -Force
#>
[CmdletBinding()]
param(
    [string]$ProjectRoot = "D:\ATEC\Projeto Final\Code\fortis-libertas\android\app",
    [string]$RootPackage = "pt.atec.goncalo.fortislibertas_appandroid",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Caminhos
# ---------------------------------------------------------------------------
if (-not (Test-Path $ProjectRoot)) {
    throw "Pasta do projeto nao encontrada: $ProjectRoot"
}

$srcRoot  = Join-Path $ProjectRoot "src\main\java"
$pkgPath  = $RootPackage -replace '\.', '\'
$basePath = Join-Path $srcRoot $pkgPath

# ---------------------------------------------------------------------------
# Registo de templates: caminho relativo -> corpo Kotlin (sem linha package)
# ---------------------------------------------------------------------------
$templates = [ordered]@{}

function Add-Kt {
    param([string]$Rel, [string]$Body)
    $script:templates[$Rel] = $Body
}

# --- Raiz -------------------------------------------------------------------
Add-Kt "MainActivity.kt" @'
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.theme.FortisTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FortisTheme {
                FortisApp()
            }
        }
    }
}
'@

Add-Kt "FortisApp.kt" @'
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.components.FortisBottomBar
import pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.components.FortisTopBar
import pt.atec.goncalo.fortislibertas_appandroid.ui.home.HomeScreen
import pt.atec.goncalo.fortislibertas_appandroid.ui.navigation.DESTINATION_HOME

@Composable
fun FortisApp() {
    val navController = rememberNavController()

    Scaffold(
        topBar = { FortisTopBar() },
        bottomBar = { FortisBottomBar() }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = DESTINATION_HOME,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(DESTINATION_HOME) {
                HomeScreen()
            }
            // TODO: adicionar os restantes destinos (dashboard, newrecord, ...)
        }
    }
}
'@

# --- core/designsystem/theme --------------------------------------------------
Add-Kt "core/designsystem/theme/Color.kt" @'
import androidx.compose.ui.graphics.Color

// TODO: ajustar paleta ao branding do Fortis Libertas
val FortisPrimary = Color(0xFF6650A4)
val FortisOnPrimary = Color(0xFFFFFFFF)
val FortisPrimaryDark = Color(0xFFD0BCFF)
val FortisBackground = Color(0xFFFFFBFE)
val FortisBackgroundDark = Color(0xFF1C1B1F)
val FortisSurface = Color(0xFFFFFBFE)
val FortisSurfaceDark = Color(0xFF1C1B1F)
val FortisError = Color(0xFFB3261E)
'@

Add-Kt "core/designsystem/theme/Theme.kt" @'
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = FortisPrimary,
    onPrimary = FortisOnPrimary,
    background = FortisBackground,
    surface = FortisSurface,
    error = FortisError
)

private val DarkColors = darkColorScheme(
    primary = FortisPrimaryDark,
    background = FortisBackgroundDark,
    surface = FortisSurfaceDark,
    error = FortisError
)

@Composable
fun FortisTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = FortisTypography,
        shapes = FortisShapes,
        content = content
    )
}
'@

Add-Kt "core/designsystem/theme/Type.kt" @'
import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val FortisTypography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp
    )
)
'@

Add-Kt "core/designsystem/theme/Shape.kt" @'
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val FortisShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp)
)
'@

Add-Kt "core/designsystem/theme/Spacing.kt" @'
import androidx.compose.ui.unit.dp

object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
}
'@

# --- core/designsystem/components (stubs) -------------------------------------
$componentTpl = @'
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun __NAME__(modifier: Modifier = Modifier) {
    // TODO: implementar __NAME__
}
'@

$components = @(
    "StatCard", "SegmentedToggle", "BudgetCard", "CategoryCard", "DonutChart",
    "OverviewChart", "SettingsRow", "FortisTopBar", "FortisBottomBar"
)

foreach ($c in $components) {
    Add-Kt "core/designsystem/components/$c.kt" ($componentTpl.Replace('__NAME__', $c))
}

# --- data/model ---------------------------------------------------------------
Add-Kt "data/model/FinancialRecord.kt" @'
// Data em formato ISO (yyyy-MM-dd) para evitar exigir minSdk 26 (java.time)
data class FinancialRecord(
    val id: Long,
    val title: String,
    val amount: Double,
    val categoryId: Long,
    val date: String,
    val isIncome: Boolean
)
'@

Add-Kt "data/model/Category.kt" @'
data class Category(
    val id: Long,
    val name: String,
    val colorHex: String
)
'@

Add-Kt "data/model/Summary.kt" @'
data class Summary(
    val totalIncome: Double,
    val totalExpense: Double
) {
    val balance: Double
        get() = totalIncome - totalExpense
}
'@

Add-Kt "data/model/User.kt" @'
data class User(
    val id: Long,
    val name: String,
    val email: String
)
'@

# --- data/local ---------------------------------------------------------------
Add-Kt "data/local/FakeData.kt" @'
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

object FakeData {
    val categories: List<Category> = listOf(
        Category(1, "Alimentacao", "#F97316"),
        Category(2, "Transportes", "#3B82F6"),
        Category(3, "Salario", "#22C55E")
    )

    val records: List<FinancialRecord> = listOf(
        FinancialRecord(1, "Supermercado", 45.90, 1, "2026-10-20", isIncome = false),
        FinancialRecord(2, "Passe mensal", 40.00, 2, "2026-10-01", isIncome = false),
        FinancialRecord(3, "Salario", 1200.00, 3, "2026-10-01", isIncome = true)
    )
}
'@

Add-Kt "data/local/TokenStore.kt" @'
import android.content.Context

// TODO: considerar EncryptedSharedPreferences para guardar o token com seguranca
class TokenStore(context: Context) {

    private val prefs = context.getSharedPreferences("fortis_auth", Context.MODE_PRIVATE)

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun clear() {
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    private companion object {
        const val KEY_TOKEN = "access_token"
    }
}
'@

# --- data/remote --------------------------------------------------------------
Add-Kt "data/remote/FortisApi.kt" @'
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.CategoryDto
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.FinancialRecordDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface FortisApi {

    @GET("records")
    suspend fun getRecords(): List<FinancialRecordDto>

    @GET("categories")
    suspend fun getCategories(): List<CategoryDto>

    @POST("records")
    suspend fun createRecord(@Body body: FinancialRecordDto): FinancialRecordDto

    @PUT("records/{id}")
    suspend fun updateRecord(@Path("id") id: Long, @Body body: FinancialRecordDto): FinancialRecordDto

    @DELETE("records/{id}")
    suspend fun deleteRecord(@Path("id") id: Long)
}
'@

Add-Kt "data/remote/AuthInterceptor.kt" @'
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenProvider: () -> String?
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokenProvider()

        val request = if (token.isNullOrBlank()) {
            original
        } else {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }
        return chain.proceed(request)
    }
}
'@

Add-Kt "data/remote/dto/FinancialRecordDto.kt" @'
import kotlinx.serialization.Serializable
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

@Serializable
data class FinancialRecordDto(
    val id: Long,
    val title: String,
    val amount: Double,
    val categoryId: Long,
    val date: String,
    val isIncome: Boolean
)

fun FinancialRecordDto.toDomain(): FinancialRecord = FinancialRecord(
    id = id,
    title = title,
    amount = amount,
    categoryId = categoryId,
    date = date,
    isIncome = isIncome
)

fun FinancialRecord.toDto(): FinancialRecordDto = FinancialRecordDto(
    id = id,
    title = title,
    amount = amount,
    categoryId = categoryId,
    date = date,
    isIncome = isIncome
)
'@

Add-Kt "data/remote/dto/CategoryDto.kt" @'
import kotlinx.serialization.Serializable
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category

@Serializable
data class CategoryDto(
    val id: Long,
    val name: String,
    val colorHex: String
)

fun CategoryDto.toDomain(): Category = Category(
    id = id,
    name = name,
    colorHex = colorHex
)
'@

# --- data/repository ----------------------------------------------------------
Add-Kt "data/repository/FinanceRepository.kt" @'
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

interface FinanceRepository {
    suspend fun getRecords(): List<FinancialRecord>
    suspend fun getCategories(): List<Category>
    suspend fun createRecord(record: FinancialRecord): Result<Unit>
    suspend fun updateRecord(record: FinancialRecord): Result<Unit>
    suspend fun deleteRecord(id: Long): Result<Unit>
}
'@

Add-Kt "data/repository/FakeFinanceRepository.kt" @'
import pt.atec.goncalo.fortislibertas_appandroid.data.local.FakeData
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

class FakeFinanceRepository : FinanceRepository {

    private val records = FakeData.records.toMutableList()

    override suspend fun getRecords(): List<FinancialRecord> = records.toList()

    override suspend fun getCategories(): List<Category> = FakeData.categories

    override suspend fun createRecord(record: FinancialRecord): Result<Unit> {
        records.add(record)
        return Result.success(Unit)
    }

    override suspend fun updateRecord(record: FinancialRecord): Result<Unit> {
        val index = records.indexOfFirst { it.id == record.id }
        if (index == -1) {
            return Result.failure(NoSuchElementException("Registo ${record.id} nao existe"))
        }
        records[index] = record
        return Result.success(Unit)
    }

    override suspend fun deleteRecord(id: Long): Result<Unit> {
        records.removeAll { it.id == id }
        return Result.success(Unit)
    }
}
'@

Add-Kt "data/repository/RemoteFinanceRepository.kt" @'
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.FortisApi
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.toDomain
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.toDto

class RemoteFinanceRepository(
    private val api: FortisApi
) : FinanceRepository {

    override suspend fun getRecords(): List<FinancialRecord> =
        api.getRecords().map { it.toDomain() }

    override suspend fun getCategories(): List<Category> =
        api.getCategories().map { it.toDomain() }

    override suspend fun createRecord(record: FinancialRecord): Result<Unit> =
        runCatching { api.createRecord(record.toDto()); Unit }

    override suspend fun updateRecord(record: FinancialRecord): Result<Unit> =
        runCatching { api.updateRecord(record.id, record.toDto()); Unit }

    override suspend fun deleteRecord(id: Long): Result<Unit> =
        runCatching { api.deleteRecord(id) }
}
'@

# --- di -----------------------------------------------------------------------
Add-Kt "di/AppContainer.kt" @'
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
'@

# --- ui/navigation ------------------------------------------------------------
Add-Kt "ui/navigation/Destinations.kt" @'
const val DESTINATION_HOME = "home"
const val DESTINATION_DASHBOARD = "dashboard"
const val DESTINATION_NEW_RECORD = "newrecord"
const val DESTINATION_TRANSACTIONS = "transactions"
const val DESTINATION_PROFILE = "profile"
const val DESTINATION_NOTIFICATIONS = "notifications"
'@

# --- ui: ecras (Screen / ViewModel / UiState) ---------------------------------
$screenTpl = @'
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun __NAME__Screen(
    modifier: Modifier = Modifier,
    viewModel: __NAME__ViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    // TODO: substituir por UI real a partir de uiState
    Text(text = "__NAME__ - $uiState", modifier = modifier)
}
'@

$viewModelTpl = @'
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class __NAME__ViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<__NAME__UiState>(__NAME__UiState.Loading)
    val uiState: StateFlow<__NAME__UiState> = _uiState.asStateFlow()

    // TODO: ligar ao FinanceRepository
}
'@

$uiStateTpl = @'
sealed interface __NAME__UiState {
    data object Loading : __NAME__UiState
    data class Success(val items: List<String> = emptyList()) : __NAME__UiState
    data class Error(val message: String) : __NAME__UiState
}
'@

$screens = @(
    @{ Name = 'Home';          Folder = 'home' },
    @{ Name = 'Dashboard';     Folder = 'dashboard' },
    @{ Name = 'NewRecord';     Folder = 'newrecord' },
    @{ Name = 'Transactions';  Folder = 'transactions' },
    @{ Name = 'Profile';       Folder = 'profile' },
    @{ Name = 'Notifications'; Folder = 'notifications' }
)

foreach ($s in $screens) {
    $n = $s.Name
    $f = $s.Folder
    Add-Kt "ui/$f/$($n)Screen.kt"    ($screenTpl.Replace('__NAME__', $n))
    Add-Kt "ui/$f/$($n)ViewModel.kt" ($viewModelTpl.Replace('__NAME__', $n))
    Add-Kt "ui/$f/$($n)UiState.kt"   ($uiStateTpl.Replace('__NAME__', $n))
}

# ---------------------------------------------------------------------------
# Escrita dos ficheiros
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "A criar estrutura do projeto FortisLibertas..." -ForegroundColor Cyan
Write-Host "Destino: $basePath"
Write-Host ""

$created = 0
$skipped = 0

foreach ($rel in $templates.Keys) {
    $target = Join-Path $basePath $rel
    $dir    = Split-Path $target -Parent

    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if ((Test-Path $target) -and -not $Force) {
        Write-Host "[SKIP] Ja existe: $rel" -ForegroundColor Yellow
        $skipped++
        continue
    }

    $folder = Split-Path $rel -Parent
    if ([string]::IsNullOrEmpty($folder)) {
        $pkg = $RootPackage
    }
    else {
        $pkg = $RootPackage + '.' + ($folder -replace '[\\/]', '.')
    }

    $content = "package $pkg`r`n`r`n" + $templates[$rel].TrimStart()

    Set-Content -Path $target -Value $content -Encoding UTF8
    $created++
    Write-Host "[OK]   $rel" -ForegroundColor Green
}

Write-Host ""
Write-Host "Criados: $created | Ignorados: $skipped | Total: $($templates.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Adicionar dependencias no build.gradle.kts (navigation-compose, lifecycle-viewmodel-compose,"
Write-Host "     retrofit, converter-kotlinx-serialization, okhttp, kotlinx-serialization-json)"
Write-Host "  2. Criar a classe Application que instancia DefaultAppContainer e declarar no AndroidManifest"
Write-Host "  3. Definir buildConfigField USE_FAKE_DATA (boolean) no build.gradle.kts"
Write-Host "  4. Ligar os ViewModels ao FinanceRepository e substituir os TODO"
