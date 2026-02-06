using MySqlConnector;

using System.Data;

namespace PharmaCare.Server.Data

{

    public class OtpRepository

    {

        private readonly DbContext _dbContext;
        private readonly ILogger<OtpRepository> _logger;

        public OtpRepository(DbContext dbContext, ILogger<OtpRepository> logger)
        {

            _dbContext = dbContext;
            _logger = logger;

        }

        public async Task SaveOtp(string mobileNumber, string otp)
        {
            try
            {
                using var connection = _dbContext.GetConnection();

                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_SaveOtp", connection);

                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = 30;

                command.Parameters.AddWithValue("@p_MobileNumber", mobileNumber);

                command.Parameters.AddWithValue("@p_Otp", otp);

                await command.ExecuteNonQueryAsync();
                
                _logger.LogInformation($"OTP saved successfully for mobile: {mobileNumber}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving OTP for mobile: {mobileNumber}");
                throw;
            }

        }

        public async Task<bool> ValidateOtp(string mobileNumber, string otp)
        {
            try
            {
                using var connection = _dbContext.GetConnection();

                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_ValidateOtp", connection);

                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = 30;

                command.Parameters.AddWithValue("@p_MobileNumber", mobileNumber);

                command.Parameters.AddWithValue("@p_Otp", otp);

                var result = await command.ExecuteScalarAsync();
                
                _logger.LogInformation($"OTP validation result for {mobileNumber}: {result}");

                return result != null && Convert.ToInt32(result) > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating OTP for mobile: {mobileNumber}");
                throw;
            }

        }

    }

}

