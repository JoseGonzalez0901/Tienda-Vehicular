using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public sealed class PagedResult<T>
    {
        public required int Total { get; set; }
        public required int Page { get; set; }
        public required int PageSize { get; set; }
        public required IReadOnlyList<T> Items { get; set; }
    }
}
