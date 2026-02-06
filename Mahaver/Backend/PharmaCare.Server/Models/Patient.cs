namespace PharmaCare.Server.Models
{
    public class Patientdetails
    {
        public long Id { get; set; }
        public string? PatientId { get; set; }
        public string FullName { get; set; }
        public string? MobileNumber { get; set; }
        public string? Email { get; set; }
        public string? AadharNumber { get; set; }
        public DateTime? Dob { get; set; }
        public DateTime RegistrationDate { get; set; }
        public string? RegistrationStatus { get; set; }
        public int Status { get; set; }
        public long? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public long? UpdatedBy { get; set; }
        public int FirstLogin { get; set; }
    }


    public class Patient
    {
        public string MobileNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public string Otp { get; set; } = string.Empty;
    }

    public class PatientRegisterResult
    {
        public int Result { get; set; }
        public string? PatientId { get; set; }
    }

    public enum PatienRegStatus
    {
        Rejected = -1,
        Pending = 0,
        Approved = 1

    }

}
