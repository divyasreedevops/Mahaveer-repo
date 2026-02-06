using Microsoft.AspNetCore.Mvc;
using PharmaCare.Server.Business;
using PharmaCare.Server.Data;
using PharmaCare.Server.Models;

namespace PharmaCare.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PatientController : ControllerBase
    {
        private readonly PatientService _patientService;
        private readonly OtpService _otpservice;
        private readonly ILogger<PatientController> _logger;

        public PatientController(PatientService patientService, ILogger<PatientController> logger, OtpService otpservice)
        {
            _patientService = patientService;
            _logger = logger;
            _otpservice = otpservice;
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetPatientsByStatus(string status)
        {
            try
            {
                if (!string.IsNullOrEmpty(status))
                {
                    var patients = await _patientService.GetPatientsByStatus(status);
                    return Ok(patients);
                }
                return StatusCode(400, new { message = "status cannot be empty" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching patients by status");
                return StatusCode(500, new { message = "An error occurred while fetching patients" });
            }
        }

        [HttpPost("Update")]
        public async Task<IActionResult> UpdatePatient([FromBody] Patientdetails patient)
        {
            if (string.IsNullOrWhiteSpace(patient.FullName) || string.IsNullOrWhiteSpace(patient.AadharNumber))
            {
                return BadRequest(new { message = "Name, mobile number, and Aadhar number are required" });
            }

            try
            {
                var result = await _patientService.UpdatePatient(patient);

                return result switch
                {
                    1 => Ok(new { message = "Patient updated successfully" }),

                    -1 => NotFound(new { message = "Patient not found" }),

                    -2 => Conflict(new { message = "Aadhaar number already exists" }),

                    0 => StatusCode(500, new { message = "An unexpected error occurred" })
                };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving patient");
                return StatusCode(500, new { message = "An error occurred while saving patient" });
            }
        }



        [HttpPost("Register")]
        public async Task<IActionResult> SendOtp([FromBody] OtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Mobile number is required" });
            }

            //var exists = await _patientService.CheckMobileNumberExists(request.MobileNumber);
            //if (exists)
            //{
            //    return Conflict(new { message = "User already registered" });
            //}

            var otp = Random.Shared.Next(100000, 999999).ToString();
            await _otpservice.SaveOtp(request.MobileNumber, otp);

            _logger.LogInformation($"OTP {otp} generated for mobile number {request.MobileNumber}");

            // TODO: Integrate with SMS service provider to send OTP

            return Ok(new { message = "OTP sent successfully", mobileNumber = request.MobileNumber, Otp = otp });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyOtp([FromBody] Patient request)
        {
            if (string.IsNullOrWhiteSpace(request.MobileNumber) || string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new { message = "Mobile number and OTP are required" });
            }

            var isValid = await _otpservice.ValidateOtp(request.MobileNumber, request.Otp);
            if (isValid)
            {
                var response = await _patientService.RegisterPatient(request);
                return response.Result switch
                {
                    1 => Ok(new
                    {
                        message = "Patient registered successfully",
                        patientId = response.PatientId

                    }),

                    2 => Ok(new
                    {
                        message = "Login Successful",
                        patientId = response.PatientId
                    }),

                    _ => StatusCode(500, new
                    {
                        message = "Something went wrong"
                    })


                };


            }

            return Ok(new { message = "Invalid OTP", isValid = false });
        }


        [HttpPost("UpdateStatus")]
        public async Task<IActionResult> UpdateRegStatus([FromBody] Patientdetails patient)
        {
            if (patient.Id < 1 || string.IsNullOrWhiteSpace(patient.RegistrationStatus) || string.IsNullOrWhiteSpace(patient.PatientId))
            {
                return BadRequest(new { message = "Id, Registration status, and PatientId are required" });
            }

            try
            {
                var result = await _patientService.UpdateRegistrationstatus(patient);

                return result switch
                {
                    1 => Ok(new { message = "Registration status updated successfully" }),

                    -1 => NotFound(new { message = "Patient not found" }),

                    -2 => BadRequest(new { message = "Invalid registration status" }),

                    0 => StatusCode(500, new { message = "Unexpected error occurred" })
                };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving patient");
                return StatusCode(500, new { message = "An error occurred while saving patient" });
            }
        }


        [HttpGet("GetPatientByMobileNumber")]
        public async Task<IActionResult> GetPatientByMobile(string mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile))
                return BadRequest(new { message = "Mobile number is required" });

            var patient = await _patientService.GetPatientByMobile(mobile);

            if (patient == null)
                return NotFound(new { message = "Patient not found" });

            return Ok(patient);
        }


    }
}
