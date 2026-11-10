package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.PaymentMethod

/** Body of POST /api/v1/dashboards/{id}/payment-methods (endpoints.md §13.3). */
@Serializable
data class CreatePaymentMethodRequestDto(
    val name: String,
    @SerialName("card_id") val cardId: String? = null,   // null = not a card (cash, transfer...)
)

/** JSON of a payment method (§13.2): only what the app shows. */
@Serializable
data class PaymentMethodDto(
    @SerialName("payment_method_id") val id: String,
    val name: String,
) {
    fun toModel() = PaymentMethod(id = id, name = name)
}
