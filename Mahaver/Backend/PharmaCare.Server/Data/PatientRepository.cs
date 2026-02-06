using MySqlConnector;
using PharmaCare.Server.Models;
using System.Data;

namespace PharmaCare.Server.Data
{
    public class PatientRepository
    {
        private readonly DbContext _dbContext;

        public PatientRepository(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Patientdetails>> GetPatientsByStatus(string status)
        {

            var patients = new List<Patientdetails>();
            try
            {
                using var connection = _dbContext.GetConnection();
                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_GetPatientsByStatus", connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@p_Status", status);

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    patients.Add(new Patientdetails
                    {
                        Id = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("Id"))),
                        PatientId = reader.GetString(reader.GetOrdinal("PatientId")),
                        FullName = reader.GetString(reader.GetOrdinal("FullName")),
                        MobileNumber = reader.GetString(reader.GetOrdinal("Mobile")),
                        Email = reader.IsDBNull(reader.GetOrdinal("Email"))
         ? null
         : reader.GetString(reader.GetOrdinal("Email")),
                        AadharNumber = reader.IsDBNull(reader.GetOrdinal("Aadhar"))
         ? null
         : reader.GetString(reader.GetOrdinal("Aadhar")),
                        Dob = reader.IsDBNull(reader.GetOrdinal("Dob"))
         ? null
         : reader.GetDateTime(reader.GetOrdinal("Dob")),
                        RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
                        RegistrationStatus = reader.GetString(reader.GetOrdinal("RegistrationStatus")),
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
            return patients;

        }

        public async Task<int> UpdatePatient(Patientdetails patient)
        {
            try
            {
                using var connection = _dbContext.GetConnection();
                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_UpdatePatient", connection);
                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.AddWithValue("@p_Id", patient.Id);
                command.Parameters.AddWithValue("@p_FullName", patient.FullName);
                command.Parameters.AddWithValue("@p_Email", patient.Email);
                command.Parameters.AddWithValue("@p_Aadhar", patient.AadharNumber);
                command.Parameters.AddWithValue("@p_Dob", patient.Dob);
                command.Parameters.AddWithValue("@p_UpdatedBy", patient.UpdatedBy);

                var outputParam = new MySqlParameter("@p_Result", MySqlDbType.Int32)
                {
                    Direction = ParameterDirection.Output
                };
                command.Parameters.Add(outputParam);

                await command.ExecuteNonQueryAsync();

                return Convert.ToInt32(outputParam.Value);
            }
            catch (Exception ex)
            {

                return 0;
            }
        }



        public async Task<bool> CheckMobileNumberExists(string mobileNumber)
        {
            using var connection = _dbContext.GetConnection();
            await connection.OpenAsync();

            using var command = new MySqlCommand("sp_CheckMobileNumberExists", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@p_MobileNumber", mobileNumber);

            var result = await command.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) > 0;
        }


        public async Task<PatientRegisterResult> RegisterPatient(Patient patient)
        {
            using var connection = _dbContext.GetConnection();
            await connection.OpenAsync();

            using var command = new MySqlCommand("sp_SavePatient", connection);
            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.AddWithValue("@p_MobileNumber", patient.MobileNumber);
            command.Parameters.AddWithValue("@p_Email", patient.Email);
            command.Parameters.AddWithValue("@p_CreatedBy", 0);

            var resultParam = new MySqlParameter("@p_Result", MySqlDbType.Int32)
            {
                Direction = ParameterDirection.Output
            };

            var patientIdParam = new MySqlParameter("@p_PatientId", MySqlDbType.VarChar, 50)
            {
                Direction = ParameterDirection.Output
            };

            command.Parameters.Add(resultParam);
            command.Parameters.Add(patientIdParam);

            await command.ExecuteNonQueryAsync();

            return new PatientRegisterResult

            {
                Result = resultParam.Value == DBNull.Value ? 0 : Convert.ToInt32(resultParam.Value),
                PatientId = patientIdParam.Value == DBNull.Value ? null : patientIdParam.Value.ToString()
            };

        }





        public async Task<int> UpdateRegistrationStatus(Patientdetails patientdetails)
        {
            try
            {
                using var connection = _dbContext.GetConnection();
                await connection.OpenAsync();

                using var command = new MySqlCommand("sp_UpdateRegistrationStatus", connection);
                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.AddWithValue("@p_Id", patientdetails.Id);
                command.Parameters.AddWithValue("@p_PatientId", patientdetails.PatientId);
                command.Parameters.AddWithValue("@p_RegistrationStatus", patientdetails.RegistrationStatus);
                command.Parameters.AddWithValue("@p_UpdatedBy", 1);

                var output = new MySqlParameter("@p_Result", MySqlDbType.Int32)
                {
                    Direction = ParameterDirection.Output
                };
                command.Parameters.Add(output);

                await command.ExecuteNonQueryAsync();
                return Convert.ToInt32(output.Value);
            }
            catch (Exception ex) { return 0; }
        }



        public async Task<Patientdetails?> GetPatientByMobile(string mobile)
        {
            using var connection = _dbContext.GetConnection();
            await connection.OpenAsync();

            using var command = new MySqlCommand("sp_GetPatientByMobileNumber", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@p_Mobile", mobile);

            using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                return null;

            return new Patientdetails
            {
                Id = reader.GetInt64(reader.GetOrdinal("Id")),
                PatientId = reader.GetString(reader.GetOrdinal("PatientId")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),
                MobileNumber = reader.GetString(reader.GetOrdinal("Mobile")),
                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email")),
                AadharNumber = reader.IsDBNull(reader.GetOrdinal("Aadhar")) ? null : reader.GetString(reader.GetOrdinal("Aadhar")),
                Dob = reader.IsDBNull(reader.GetOrdinal("Dob")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("Dob")),
                RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
                RegistrationStatus = reader.GetString(reader.GetOrdinal("RegistrationStatus")),
                Status = reader.GetInt32(reader.GetOrdinal("Status")),
                FirstLogin = reader.GetInt32(reader.GetOrdinal("FirstLogin"))
            };
        }




    }




}
