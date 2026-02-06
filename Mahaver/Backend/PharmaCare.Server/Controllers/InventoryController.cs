using Microsoft.AspNetCore.Mvc;
using PharmaCare.Server.Business;
using PharmaCare.Server.Data;
using PharmaCare.Server.Models;

namespace PharmaCare.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService;
        private readonly ILogger<InventoryController> _logger;

        public InventoryController(InventoryService inventoryService, ILogger<InventoryController> logger)
        {
            _inventoryService = inventoryService;
            _logger = logger;
        }

        [HttpGet("GetInventoryList")]
        public async Task<IActionResult> GetInventoryMasterData()
        {
            try
            {
                var items = await _inventoryService.GetInventoryMasterData();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching inventory master data");
                return StatusCode(500, new { message = "An error occurred while fetching inventory data" });
            }
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveInventoryItems([FromBody] List<InventoryItem> items)
        {
            if (items == null || items.Count == 0)
            {
                return BadRequest(new { message = "At least one item is required" });
            }

            try
            {
                var saved = await _inventoryService.SaveInventoryItems(items);
                return Ok(new { message = "Items saved successfully", count = saved });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving inventory items");
                return StatusCode(500, new { message = "An error occurred while saving items" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteInventory([FromQuery] long inventoryId, [FromQuery] long userId)
        {
            try
            {
                var result = await _inventoryService.DeleteInventory(inventoryId, userId);

                return result switch
                {
                    1 => Ok(new { message = "Inventory item deleted successfully" }),
                    -1 => NotFound(new { message = "Inventory item not found" }),
                    0 => StatusCode(500, new { message = "Something went wrong" })
                };
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An unexpected error occurred while deleting inventory"
                });
            }
        }
    }
}
