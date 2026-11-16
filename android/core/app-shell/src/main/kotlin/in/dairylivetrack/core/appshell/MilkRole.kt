package `in`.dairylivetrack.core.appshell

enum class MilkRole(
    val title: String,
    val headline: String,
    val description: String,
    val metrics: List<String>,
) {
    DRIVER(
        title = "Driver",
        headline = "Your route, one clear trip.",
        description = "Your published collection route and trip controls will appear here.",
        metrics = listOf("Route", "Stops", "Trip"),
    ),
    SELLER(
        title = "Seller",
        headline = "Your collection vehicle, in view.",
        description = "Only your assigned vehicle and your own pickup context will appear here.",
        metrics = listOf("Vehicle", "ETA", "Your pickups"),
    ),
    OWNER(
        title = "Owner",
        headline = "Your dairy, at a glance.",
        description = "Your fleet, drivers and published route status will appear here.",
        metrics = listOf("Vehicles", "On route", "Completed"),
    ),
}
