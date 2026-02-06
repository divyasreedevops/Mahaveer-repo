using Microsoft.AspNetCore.Mvc;
using PharmaCare.Server.Business;

namespace PharmaCare.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly ILogger<LoginController> _logger;

        public LoginController(AuthService authService, ILogger<LoginController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("admin")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            try
            {
                var isValid = await _authService.ValidateAdminCredentials(request.Username, request.Password);

                if (isValid)
                {
                    return Ok(new { message = "Login successful", isAuthenticated = true });
                }

                return Unauthorized(new { message = "Invalid credentials", isAuthenticated = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin login");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Logout successful" });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
