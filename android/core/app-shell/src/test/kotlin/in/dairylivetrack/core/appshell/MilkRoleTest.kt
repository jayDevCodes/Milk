package `in`.dairylivetrack.core.appshell

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MilkRoleTest {
    @Test
    fun everyRoleHasItsOwnHeadlineAndMetrics() {
        assertEquals(3, MilkRole.entries.size)
        assertEquals(3, MilkRole.entries.map { it.headline }.toSet().size)
        assertNotEquals(MilkRole.DRIVER.metrics, MilkRole.SELLER.metrics)
        assertNotEquals(MilkRole.SELLER.metrics, MilkRole.OWNER.metrics)
    }

    @Test
    fun sellerCopyOnlyDescribesTheCurrentSellersOwnPickupContext() {
        val sellerCopy = MilkRole.SELLER.description.lowercase()
        assertTrue(sellerCopy.contains("your assigned vehicle"))
        assertTrue(sellerCopy.contains("your own pickup"))
        assertFalse(sellerCopy.contains("other sellers"))
    }
}
