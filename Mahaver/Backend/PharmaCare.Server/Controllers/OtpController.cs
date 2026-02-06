using Microsoft.AspNetCore.Mvc;

namespace PharmaCare.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OtpController : ControllerBase
    {
        private readonly ILogger<OtpController> _logger;
        private static readonly Dictionary<string, string> _otpStore = new();

        public OtpController(ILogger<OtpController> logger)
        {
            _logger = logger;
        }

        [HttpPost("send")]
        public IActionResult SendOtp([FromBody] OtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Mobile number is required" });
            }

            var otp = Random.Shared.Next(100000, 999999).ToString();
            _otpStore[request.MobileNumber] = otp;

            _logger.LogInformation($"OTP {otp} generated for mobile number {request.MobileNumber}");

            // TODO: Integrate with SMS service provider to send OTP

            return Ok(new { message = "OTP sent successfully", mobileNumber = request.MobileNumber });
        }

        [HttpPost("verify")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.MobileNumber) || string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new { message = "Mobile number and OTP are required" });
            }

            if (_otpStore.TryGetValue(request.MobileNumber, out var storedOtp) && storedOtp == request.Otp)
            {
                _otpStore.Remove(request.MobileNumber);
                return Ok(new { message = "OTP verified successfully", isValid = true });
            }

            return Ok(new { message = "Invalid OTP", isValid = false });
        }
    }

    public class OtpRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class VerifyOtpRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }
}
