using MySqlConnector;
using PharmaCare.Server.Data;
using System.Data;

namespace PharmaCare.Server.Business
{
    public class AuthService
    {
        private readonly AdminRepository _adminRepository;

        public AuthService(AdminRepository adminRepository)
        {
            _adminRepository = adminRepository;
        }

        public async Task<bool> ValidateAdminCredentials(string username, string password)
        {
            return await _adminRepository.ValidateAdminLogin(username, password);
        }
    }
}
