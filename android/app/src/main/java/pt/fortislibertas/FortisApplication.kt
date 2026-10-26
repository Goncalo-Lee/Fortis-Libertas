package pt.fortislibertas

import android.app.Application
import pt.fortislibertas.di.AppContainer

/** Registada no AndroidManifest (android:name=".FortisApplication"). */
class FortisApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
