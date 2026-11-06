package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.AuthResponseDto
import pt.fortislibertas.data.remote.dto.SignInRequestDto
import pt.fortislibertas.data.remote.dto.SignUpRequestDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Better Auth endpoints (see docs/planning/api/endpoints.md, section 2).
 * They return Response<...> so the repository can read the "set-auth-token" header.
 */
interface AuthApi {

    @POST("api/auth/sign-in/email")
    suspend fun signIn(@Body body: SignInRequestDto): Response<AuthResponseDto>

    @POST("api/auth/sign-up/email")
    suspend fun signUp(@Body body: SignUpRequestDto): Response<AuthResponseDto>
}
