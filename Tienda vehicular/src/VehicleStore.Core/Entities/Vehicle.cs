using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class Vehicle
    {
        public int Id { get; set; }
        public int VehicleModelId { get; set; }
        public VehicleModel Model { get; set; } = null!;
        public int Year { get; set; }
        public decimal Price { get; set; }
        public string Fuel { get; set; } = "Gasoline";   // Gasoline|Diesel|Hybrid|Electric
        public string Transmission { get; set; } = "AT"; // AT|MT
        public string? Color { get; set; }
        public bool IsFeatured { get; set; }
        public ICollection<VehicleSpec> Specs { get; set; } = [];
        public ICollection<MediaAsset> Media { get; set; } = [];
    }
}
