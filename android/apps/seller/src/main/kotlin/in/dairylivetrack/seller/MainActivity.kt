package in.dairylivetrack.seller

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import in.dairylivetrack.core.appshell.MilkApp
import in.dairylivetrack.core.appshell.MilkRole

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { MilkApp(role = MilkRole.SELLER) }
    }
}
