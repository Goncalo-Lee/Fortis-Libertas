package pt.fortislibertas.data.fake

import pt.fortislibertas.data.model.Dashboard

/** Test dashboards for local mode. */
object FakeDashboardData {
    val dashboards = listOf(
        Dashboard(id = "dash-personal", name = "Pessoal", isActive = true, role = "owner"),
        Dashboard(id = "dash-home", name = "Casa", isActive = true, role = "editor"),
    )
}
