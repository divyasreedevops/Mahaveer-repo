using MySqlConnector;
using PharmaCare.Server.Models;
using System.Data;

namespace PharmaCare.Server.Data
{
    public class InventoryRepository
    {
        private readonly DbContext _dbContext;

        public InventoryRepository(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<InventoryItem>> GetInventoryMasterData()
        {
            var items = new List<InventoryItem>();
            try
            {

                using var connection = _dbContext.GetConnection();
                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_GetInventoryMaster", connection);
                command.CommandType = CommandType.StoredProcedure;

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    items.Add(new InventoryItem
                    {
                        Id = reader.GetInt64(reader.GetOrdinal("Id")),

                        Name = reader.GetString(reader.GetOrdinal("Name")),
                        Type = reader.GetString(reader.GetOrdinal("Type")),
                        Disease = reader.IsDBNull(reader.GetOrdinal("Disease"))
                            ? null
                            : reader.GetString(reader.GetOrdinal("Disease")),

                        DosageValue = reader.GetDecimal(reader.GetOrdinal("DosageValue")),
                        DosageUnits = reader.GetString(reader.GetOrdinal("DosageUnits")),

                        QuantityValue = reader.GetInt32(reader.GetOrdinal("QuantityValue")),
                        QuantityUnits = reader.GetString(reader.GetOrdinal("QuantityUnits")),

                        MRP = reader.GetDecimal(reader.GetOrdinal("MRP")),
                        Discount = reader.GetDecimal(reader.GetOrdinal("Discount")),
                        FinalPrice = reader.GetDecimal(reader.GetOrdinal("FinalPrice")),

                        Status = reader.GetInt32(reader.GetOrdinal("Status")),

                        CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy"))
                            ? null
                            : reader.GetInt64(reader.GetOrdinal("CreatedBy")),

                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),

                        UpdatedDate = reader.GetDateTime(reader.GetOrdinal("UpdatedDate")),

                        UpdatedBy = reader.IsDBNull(reader.GetOrdinal("UpdatedBy"))
                            ? null
                            : reader.GetInt64(reader.GetOrdinal("UpdatedBy"))
                    });
                }

            }
            catch (Exception ex) { }
            return items;
        }

        public async Task<int> SaveInventoryItems(List<InventoryItem> items)
        {
            using var connection = _dbContext.GetConnection();
            await connection.OpenAsync();

            int totalSaved = 0;
            try
            {
                foreach (var item in items)
                {
                    using var command = new MySqlCommand("sp_SaveInventoryItem", connection);
                    command.CommandType = CommandType.StoredProcedure;

                    command.Parameters.AddWithValue("@p_Id", item.Id);

                    command.Parameters.AddWithValue("@p_Name", item.Name);
                    command.Parameters.AddWithValue("@p_Type", item.Type);
                    command.Parameters.AddWithValue("@p_Disease", item.Disease ?? (object)DBNull.Value);

                    command.Parameters.AddWithValue("@p_DosageValue", item.DosageValue);
                    command.Parameters.AddWithValue("@p_DosageUnits", item.DosageUnits);

                    command.Parameters.AddWithValue("@p_QuantityValue", item.QuantityValue);
                    command.Parameters.AddWithValue("@p_QuantityUnits", item.QuantityUnits);

                    command.Parameters.AddWithValue("@p_MRP", item.MRP);
                    command.Parameters.AddWithValue("@p_Discount", item.Discount);

                    item.FinalPrice = item.MRP - item.Discount;
                    command.Parameters.AddWithValue("@p_FinalPrice", item.FinalPrice);

                    command.Parameters.AddWithValue("@p_Status", InventoryStatus.Active);
                    command.Parameters.AddWithValue("@p_CreatedBy", item.CreatedBy ?? 0);

                    //await command.ExecuteNonQueryAsync();


                    totalSaved += await command.ExecuteNonQueryAsync();
                }
            }
            catch (Exception ex) { }


            return totalSaved;
        }

        public async Task<int> DeleteInventory(long id, long userId)
        {
            try
            {
                using var connection = _dbContext.GetConnection();
                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_DeleteInventory", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };

                command.Parameters.AddWithValue("@p_Id", id);
                command.Parameters.AddWithValue("@p_UpdatedBy", userId);

                var resultParam = new MySqlParameter("@p_Result", MySqlDbType.Int32)
                {
                    Direction = ParameterDirection.Output
                };
                command.Parameters.Add(resultParam);

                await command.ExecuteNonQueryAsync();

                return Convert.ToInt32(resultParam.Value);
            }
            catch (Exception ex) { return 0; }
        }
    }


}
