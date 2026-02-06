using MySqlConnector;
using System.Data;
using System.Security.Cryptography;
using System.Text;

namespace PharmaCare.Server.Data
{
    public class AdminRepository
    {
        private readonly DbContext _dbContext;

        public AdminRepository(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> ValidateAdminLogin(string username, string password)
        {
            using var connection = _dbContext.GetConnection();
            await connection.OpenAsync();

            using var command = new MySqlCommand("sp_ValidateAdminLogin", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@p_Username", username);
            command.Parameters.AddWithValue("@p_PasswordHash", HashPassword(password));

            var result = await command.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) > 0;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }
}
