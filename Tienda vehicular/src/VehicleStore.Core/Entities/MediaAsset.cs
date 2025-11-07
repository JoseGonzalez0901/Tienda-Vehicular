using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class MediaAsset
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;
        public required string Type { get; set; }   // image|video|model3d
        public required string Url { get; set; }
        public int Order { get; set; }
        public bool IsCover { get; set; }
    }
}
