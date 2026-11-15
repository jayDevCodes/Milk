package in.dairylivetrack.core.maps

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import org.maplibre.android.MapLibre
import org.maplibre.android.maps.MapView

@Composable
fun MilkMapPreview(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle

    val mapView = remember(context) {
        MapLibre.getInstance(context.applicationContext)
        MapView(context).apply { onCreate(null) }
    }

    DisposableEffect(lifecycle, mapView) {
        var started = false
        var resumed = false
        var destroyed = false

        fun pauseIfNeeded() {
            if (resumed) {
                mapView.onPause()
                resumed = false
            }
        }

        fun stopIfNeeded() {
            pauseIfNeeded()
            if (started) {
                mapView.onStop()
                started = false
            }
        }

        fun destroyIfNeeded() {
            if (!destroyed) {
                stopIfNeeded()
                mapView.onDestroy()
                destroyed = true
            }
        }

        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> if (!started && !destroyed) {
                    mapView.onStart()
                    started = true
                }
                Lifecycle.Event.ON_RESUME -> if (!resumed && !destroyed) {
                    mapView.onResume()
                    resumed = true
                }
                Lifecycle.Event.ON_PAUSE -> pauseIfNeeded()
                Lifecycle.Event.ON_STOP -> stopIfNeeded()
                Lifecycle.Event.ON_DESTROY -> destroyIfNeeded()
                else -> Unit
            }
        }

        lifecycle.addObserver(observer)
        onDispose {
            lifecycle.removeObserver(observer)
            destroyIfNeeded()
        }
    }

    LaunchedEffect(mapView) {
        mapView.getMapAsync { map ->
            map.setStyle("asset://maps/preview-style.json")
        }
    }

    AndroidView(factory = { mapView }, modifier = modifier)
}
