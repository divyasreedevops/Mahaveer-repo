using Microsoft.AspNetCore.Mvc;
using PharmaCare.Server.Business;
using PharmaCare.Server.Data;
using PharmaCare.Server.Models;

namespace PharmaCare.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(UserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPost("CreateUser")]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            if (string.IsNullOrWhiteSpace(user.Username) || string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            try
            {
                await _userService.CreateUser(user);
                return Ok(new { message = "User created successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error Creating user");
                return StatusCode(500, new { message = "An error occurred while creating user" });
            }
        }
    }
}
