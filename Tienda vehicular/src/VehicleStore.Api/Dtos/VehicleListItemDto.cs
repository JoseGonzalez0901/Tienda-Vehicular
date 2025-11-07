using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public sealed class VehicleListItemDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public int Year { get; set; }
        public decimal Price { get; set; }
        public string? CoverUrl { get; set; }
        public string Condition { get; set; }
        public string Location { get; set; }
        public string MileageKm { get; set; }
    }
}
