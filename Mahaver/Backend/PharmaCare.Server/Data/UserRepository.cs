using MySqlConnector;
using PharmaCare.Server.Models;
using System.Data;
using System.Security.Cryptography;
using System.Text;

namespace PharmaCare.Server.Data
{
    public class UserRepository
    {
        private readonly DbContext _dbContext;

        public UserRepository(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> CreateUser(User user)
        {
            try
            {
                using var connection = _dbContext.GetConnection();
                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_CreateUser", connection);
                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.AddWithValue("p_FirstName", user.Firstname);
                command.Parameters.AddWithValue("p_LastName", user.Lastname);
                command.Parameters.AddWithValue("p_UserName", user.Username);
                command.Parameters.AddWithValue("p_Email", user.Email);
                command.Parameters.AddWithValue("p_Password", HashPassword(user.Password));
                command.Parameters.AddWithValue("p_Role", user.Role);
                command.Parameters.AddWithValue("p_Status", (int)UserStatus.Active);
                command.Parameters.AddWithValue("p_CreatedBy", 1);

                return await command.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        private string HashPassword(string password)
        {
            try
            {
                using var sha256 = SHA256.Create();
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(bytes);
            }
            catch (Exception ex)
            {
                return string.Empty;
            }
        }
    }


}
