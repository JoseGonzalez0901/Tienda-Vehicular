using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
namespace VehicleStore.Core.Entities
{
    public class UploadMediaDto
    {
        public int VehicleId { get; set; }
        public required string Type { get; set; } // image | video | model3d
        public bool IsCover { get; set; }
        public required IFormFile File { get; set; }
    }

}
