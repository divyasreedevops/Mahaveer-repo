namespace PharmaCare.Server.Models
{
    public class InventoryItem
    {
        public long Id { get; set; }

        public string Name { get; set; }
        public string Type { get; set; }
        public string? Disease { get; set; }

        public decimal DosageValue { get; set; }
        public string DosageUnits { get; set; }

        public int QuantityValue { get; set; }
        public string QuantityUnits { get; set; }

        public decimal MRP { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalPrice { get; set; }

        public int Status { get; set; }

        public long? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }
        public long? UpdatedBy { get; set; }
    }

    public enum InventoryStatus
    {
        Inactive = 0,
        Active = 1
    }

}
