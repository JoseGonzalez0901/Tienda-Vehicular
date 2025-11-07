// Controllers/VehiclesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleStore.Core.Entities;
using VehicleStore.Infrastructure.Data;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly AppDbContext _db;
    public VehiclesController(AppDbContext db) => _db = db;

    string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    // GET /api/vehicles?tab=&page=&limit=&brand=&model=&year=&priceMin=&priceMax=&offer=
    [HttpGet]
    public async Task<ActionResult<PagedResult<VehicleListItemDto>>> GetList(
    [FromQuery] string? tab,
    [FromQuery] int page = 1,
    [FromQuery] int limit = 12,
    [FromQuery] string? brand = null,
    [FromQuery] string? model = null,
    [FromQuery] int? year = null,
    [FromQuery] decimal? priceMin = null,
    [FromQuery] decimal? priceMax = null,
    [FromQuery] bool? offer = null,
    [FromQuery] string? type = null,
    [FromQuery] string? province = null,
    [FromQuery] string? condition = null   // <-- NUEVO
)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var q = _db.Vehicles.AsNoTracking()
            .Include(v => v.Model).ThenInclude(m => m.Brand)
            .Include(v => v.Media)
            .Include(v=>v.Specs)
            .AsQueryable();

        // Filtros básicos
        if (!string.IsNullOrWhiteSpace(brand))
            q = q.Where(v => v.Model.Brand.Name == brand);
        if (!string.IsNullOrWhiteSpace(model))
            q = q.Where(v => v.Model.Name.Contains(model));
        if (year.HasValue)
            q = q.Where(v => v.Year == year.Value);
        if (priceMin.HasValue)
            q = q.Where(v => v.Price >= priceMin.Value);
        if (priceMax.HasValue)
            q = q.Where(v => v.Price <= priceMax.Value);
        if (offer is true)
            q = q.Where(v => v.IsFeatured);

        // type (spec)
        if (!string.IsNullOrWhiteSpace(type))
            q = q.Where(v => v.Specs.Any(s => s.Key == "type" && s.Value == type));

        // province/location (spec)
        if (!string.IsNullOrWhiteSpace(province))
            q = q.Where(v => v.Specs.Any(s =>
                s.Key == "location" && s.Value != null &&
                (s.Value == province || EF.Functions.Like(s.Value!, $"%{province}%"))));

        // condition (spec: "Nuevo" | "Usado")
        if (!string.IsNullOrWhiteSpace(condition))
            q = q.Where(v => v.Specs.Any(s => s.Key == "condition" && s.Value == condition));

        // Tabs
        q = tab switch
        {
            "ofertas" => q.Where(v => v.IsFeatured).OrderByDescending(v => v.Id),
            "populares" => q.OrderByDescending(v => v.IsFeatured).ThenByDescending(v => v.Id),
            _ => q.OrderByDescending(v => v.Id)
        };

        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * limit).Take(limit)
            .Select(v => v.ToListItemDto(BaseUrl))
            .ToListAsync();

        return Ok(new PagedResult<VehicleListItemDto>
        {
            Total = total,
            Page = page,
            PageSize = limit,
            Items = items
        });
    }
    // GET /api/vehicles/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VehicleDetailDto>> GetById([FromRoute] int id)
    {
        var v = await _db.Vehicles.AsNoTracking()
            .WithAllIncludes()
            .FirstOrDefaultAsync(v => v.Id == id);

        if (v is null) return NotFound();

        return Ok(v.ToDetailDto(BaseUrl));
    }

    // GET /api/vehicles/{id}/related
    [HttpGet("{id:int}/related")]
    public async Task<ActionResult<IEnumerable<VehicleListItemDto>>> GetRelated([FromRoute] int id)
    {
        var v = await _db.Vehicles.AsNoTracking()
            .Include(x => x.Model).ThenInclude(m => m.Brand)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (v is null) return Ok(Array.Empty<VehicleListItemDto>());

        // mismos brand/model (o mismo brand, distinto id), top 8
        var rel = await _db.Vehicles.AsNoTracking()
            .Include(x => x.Model).ThenInclude(m => m.Brand)
            .Include(x => x.Media)
            .Where(x => x.Id != v.Id && x.VehicleModelId == v.VehicleModelId)
            .OrderByDescending(x => x.IsFeatured).ThenByDescending(x => x.Id)
            .Take(8)
            .Select(x => x.ToListItemDto(BaseUrl))
            .ToListAsync();

        return Ok(rel);
    }
}
