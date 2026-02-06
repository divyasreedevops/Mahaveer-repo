using PharmaCare.Server.Data;
using PharmaCare.Server.Models;

namespace PharmaCare.Server.Business
{
    public class PatientService
    {
        private readonly PatientRepository _patientRepository;

        public PatientService(PatientRepository patientRepository)
        {
            _patientRepository = patientRepository;
        }

        public async Task<List<Patientdetails>> GetPatientsByStatus(string status)
        {
            return await _patientRepository.GetPatientsByStatus(status);
        }

        public async Task<int> UpdatePatient(Patientdetails patient)
        {
            return await _patientRepository.UpdatePatient(patient);
        }

        public async Task<bool> CheckMobileNumberExists(string mobileNumber)
        {
            return await _patientRepository.CheckMobileNumberExists(mobileNumber);
        }

        public async Task<PatientRegisterResult> RegisterPatient(Patient patient)
        {
            return await _patientRepository.RegisterPatient(patient);
        }

        public async Task<int> UpdateRegistrationstatus(Patientdetails patient)
        {
            return await _patientRepository.UpdateRegistrationStatus(patient);
        }

        public async Task<Patientdetails> GetPatientByMobile(string mobile)
        {
            return await _patientRepository.GetPatientByMobile(mobile);
        }
    }
}
