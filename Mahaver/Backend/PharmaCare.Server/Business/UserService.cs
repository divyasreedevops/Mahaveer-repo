using PharmaCare.Server.Data;
using PharmaCare.Server.Models;

namespace PharmaCare.Server.Business
{
    public class UserService
    {
        private readonly UserRepository _userRepository;

        public UserService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<int> CreateUser(User user)
        {
            return await _userRepository.CreateUser(user);
        }
    }
}
