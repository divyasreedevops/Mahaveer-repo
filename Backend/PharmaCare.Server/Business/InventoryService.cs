using PharmaCare.Server.Data;
using PharmaCare.Server.Models;

namespace PharmaCare.Server.Business
{
    public class InventoryService
    {
        private readonly InventoryRepository _inventoryRepository;

        public InventoryService(InventoryRepository inventoryRepository)
        {
            _inventoryRepository = inventoryRepository;
        }

        public async Task<List<InventoryItem>> GetInventoryMasterData()
        {
            return await _inventoryRepository.GetInventoryMasterData();
        }

        public async Task<int> SaveInventoryItems(List<InventoryItem> items)
        {

            return await _inventoryRepository.SaveInventoryItems(items);
        }

        public async Task<int> DeleteInventory(long id, long userId)
        {
            return await _inventoryRepository.DeleteInventory(id, userId);
        }
    }
}
