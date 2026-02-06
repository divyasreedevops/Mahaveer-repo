using PharmaCare.Server.Data;

namespace PharmaCare.Server.Business

{

    public class OtpService

    {

        private readonly OtpRepository _otpRepository;

        public OtpService(OtpRepository otpRepository)

        {

            _otpRepository = otpRepository;

        }

        public async Task SaveOtp(string mobileNumber, string otp)

        {

            await _otpRepository.SaveOtp(mobileNumber, otp);

        }

        public async Task<bool> ValidateOtp(string mobileNumber, string otp)

        {

            return await _otpRepository.ValidateOtp(mobileNumber, otp);

        }

    }

}

